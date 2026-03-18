import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readWeaponInstance } from "../lib/chain-reader.mjs";
import { resolveWeaponAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import {
  getDamageTypeLabel,
  getFrameTierLabel,
  getRarityLabel,
  getResonanceTypeLabel,
  getWeaponClassLabel
} from "../lib/enum-labels.mjs";

const network = getArgValue("--network", GENERATOR_DEFAULTS.network);
const dryRun = hasFlag("--dry-run");
const fromId = Number(getArgValue("--from", "1"));
const toId = Number(getArgValue("--to", "1"));

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  summary: {
    weaponsGenerated: 0
  },
  warnings: []
};

function getDefinitionDefaults(weaponDefinitionId) {
  const map = {
    1: {
      name: "Iron Sword",
      weaponClass: 1,
      damageType: 1,
      intendedComponents: [
        { componentDefinitionId: 1, name: "Iron Blade" },
        { componentDefinitionId: 2, name: "Reinforced Hilt" }
      ],
      recipeId: 101
    },
    2: {
      name: "Crystal Bow",
      weaponClass: 13,
      damageType: 7,
      intendedComponents: [
        { componentDefinitionId: 3, name: "Crystal Core" },
        { componentDefinitionId: 4, name: "Bow Limb" },
        { componentDefinitionId: 5, name: "Bow String" }
      ],
      recipeId: 102
    },
    3: {
      name: "Plasma Rifle",
      weaponClass: 9,
      damageType: 11,
      intendedComponents: [
        { componentDefinitionId: 6, name: "Plasma Chamber" },
        { componentDefinitionId: 7, name: "Energy Coil" },
        { componentDefinitionId: 8, name: "Stabilizer" },
        { componentDefinitionId: 9, name: "Resonance Grip" }
      ],
      recipeId: 103
    }
  };

  return map[weaponDefinitionId] || null;
}

function getOriginFactionLabel(value) {
  if (Number(value) === 0) return "None";
  if (Number(value) === 1) return "Pi";
  if (Number(value) === 2) return "Phi";
  if (Number(value) === 3) return "Borderline";
  return `Faction ${value}`;
}

for (let tokenId = fromId; tokenId <= toId; tokenId += 1) {
  const instance = await readWeaponInstance({
    network,
    contractAddress: CONTRACTS[network].cityWeapons,
    tokenId
  });

  if (!instance.weaponDefinitionId) {
    report.warnings.push(`Weapon token ${tokenId} returned empty instance.`);
    continue;
  }

  const defaults = getDefinitionDefaults(instance.weaponDefinitionId);
  const asset = await resolveWeaponAsset(instance.weaponDefinitionId);
  const override = await readOptionalOverride("weapons", tokenId);

  if (!defaults) {
    report.warnings.push(
      `No local definition defaults found for weaponDefinitionId ${instance.weaponDefinitionId}.`
    );
  }

  if (!asset) {
    report.warnings.push(
      `Missing asset manifest entry for weaponDefinitionId ${instance.weaponDefinitionId}.`
    );
  }

  const baseName = defaults?.name || `Weapon ${tokenId}`;

  const metadata = {
    schemaVersion: "1.0.0",
    kind: "weaponInstance",
    tokenStandard: "ERC721",
    network,
    chainId: CONTRACTS[network].chainId,
    contractAddress: CONTRACTS[network].cityWeapons,
    tokenId,
    weaponDefinitionId: instance.weaponDefinitionId,
    name: `${baseName} #${tokenId}`,
    description:
      override?.description ||
      `Live crafted ${baseName} weapon instance from the Inpinity City system on Base Mainnet.`,
    owner: instance.owner,
    weaponClass: defaults?.weaponClass ?? 0,
    damageType: defaults?.damageType ?? 0,
    rarityTier: instance.rarityTier,
    frameTier: instance.frameTier,
    durability: instance.durability,
    upgradeLevel: instance.upgradeLevel,
    metadataRevision: instance.metadataRevision,
    originPlotId: instance.originPlotId,
    originFaction: instance.originFaction,
    originDistrictKind: instance.originDistrictKind,
    craftedAt: instance.craftedAt,
    visualVariant: instance.visualVariant,
    resonanceType: instance.resonanceType,
    craftSeed: instance.craftSeed,
    provenanceHash: instance.provenanceHash,
    genesisEra: instance.genesisEra,
    usedAether: instance.usedAether,
    image: asset?.image || "",
    external_url: `https://assets.inpinity.online/city/metadata/weapons/${tokenId}.json`,
    attributes: [
      {
        trait_type: "Weapon Definition ID",
        value: instance.weaponDefinitionId,
        display_type: "number"
      },
      {
        trait_type: "Weapon Class",
        value: await getWeaponClassLabel(defaults?.weaponClass ?? 0)
      },
      {
        trait_type: "Damage Type",
        value: await getDamageTypeLabel(defaults?.damageType ?? 0)
      },
      {
        trait_type: "Rarity",
        value: await getRarityLabel(instance.rarityTier)
      },
      {
        trait_type: "Frame Tier",
        value: await getFrameTierLabel(instance.frameTier)
      },
      {
        trait_type: "Durability",
        value: instance.durability,
        display_type: "number"
      },
      {
        trait_type: "Upgrade Level",
        value: instance.upgradeLevel,
        display_type: "number"
      },
      {
        trait_type: "Origin Plot ID",
        value: instance.originPlotId,
        display_type: "number"
      },
      {
        trait_type: "Origin Faction",
        value: getOriginFactionLabel(instance.originFaction)
      },
      {
        trait_type: "Origin District Kind",
        value: instance.originDistrictKind,
        display_type: "number"
      },
      {
        trait_type: "Resonance Type",
        value: await getResonanceTypeLabel(instance.resonanceType)
      },
      {
        trait_type: "Visual Variant",
        value: instance.visualVariant,
        display_type: "number"
      },
      {
        trait_type: "Genesis Era",
        value: instance.genesisEra ? "Yes" : "No"
      },
      {
        trait_type: "Used Aether",
        value: instance.usedAether ? "Yes" : "No"
      },
      {
        trait_type: "Crafted At",
        value: instance.craftedAt,
        display_type: "date"
      },
      {
        trait_type: "Craft Seed",
        value: instance.craftSeed
      },
      {
        trait_type: "Provenance Hash",
        value: instance.provenanceHash
      }
    ],
    composition: defaults
      ? {
          type: "resourceBasedRecipe",
          recipeId: defaults.recipeId,
          intendedComponents: defaults.intendedComponents,
          notes:
            "Offchain descriptive composition. Current V1 onchain crafting remains resource-based."
        }
      : undefined,
    generatedAt: new Date().toISOString(),
    sourceContract: CONTRACTS[network].cityWeapons,
    sourceReadMethod: "weaponInstanceOf + ownerOf",
    sourceMode: "chain",
    verificationStatus: "confirmed",
    notes: `Generated from live CityWeapons weaponInstanceOf(${tokenId}) and ownerOf(${tokenId}) on ${network}.`,
    display: {
      weaponClassLabel: await getWeaponClassLabel(defaults?.weaponClass ?? 0),
      damageTypeLabel: await getDamageTypeLabel(defaults?.damageType ?? 0),
      rarityLabel: await getRarityLabel(instance.rarityTier),
      frameTierLabel: await getFrameTierLabel(instance.frameTier),
      originFactionLabel: getOriginFactionLabel(instance.originFaction),
      resonanceTypeLabel: await getResonanceTypeLabel(instance.resonanceType)
    }
  };

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "weapons", `${tokenId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.weaponsGenerated += 1;
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Weapon instances checked: ${report.summary.weaponsGenerated}`
    : `Weapon instance metadata generation complete. Written: ${report.summary.weaponsGenerated}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}