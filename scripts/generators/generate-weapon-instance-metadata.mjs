import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readWeaponInstance } from "../lib/chain-reader.mjs";
import { readWeaponDefinitionFromFile } from "../lib/definition-reader.mjs";
import { resolveWithSource } from "../lib/source-resolver.mjs";
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
const sourceMode = getArgValue("--source", "auto");

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  generator: "generate-weapon-instance-metadata",
  sourceModeRequested: sourceMode,
  summary: {
    weaponsGenerated: 0,
    generatedFromChain: 0,
    generatedFromDefinitions: 0
  },
  warnings: []
};

function getDefinitionDefaultsFromDefinition(def) {
  const recipeMap = {
    1: 101,
    2: 102,
    3: 103
  };

  const intendedComponentsMap = {
    1: [
      { componentDefinitionId: 1, name: "Iron Blade" },
      { componentDefinitionId: 2, name: "Reinforced Hilt" }
    ],
    2: [
      { componentDefinitionId: 3, name: "Crystal Core" },
      { componentDefinitionId: 4, name: "Bow Limb" },
      { componentDefinitionId: 5, name: "Bow String" }
    ],
    3: [
      { componentDefinitionId: 6, name: "Plasma Chamber" },
      { componentDefinitionId: 7, name: "Energy Coil" },
      { componentDefinitionId: 8, name: "Stabilizer" },
      { componentDefinitionId: 9, name: "Resonance Grip" }
    ]
  };

  return {
    name: def.name,
    weaponClass: def.weaponClass,
    damageType: def.damageType,
    recipeId: recipeMap[def.weaponDefinitionId] || null,
    intendedComponents: intendedComponentsMap[def.weaponDefinitionId] || []
  };
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

  const resolvedDefinition = await resolveWithSource({
    sourceMode,
    readFromChain: async () => {
      throw new Error("Weapon definition chain reader not wired yet, using definitions fallback.");
    },
    readFromDefinitions: async () => readWeaponDefinitionFromFile(instance.weaponDefinitionId),
    onWarning: (msg) =>
      report.warnings.push(
        `Weapon token ${tokenId}, definition ${instance.weaponDefinitionId}: ${msg}`
      )
  });

  const def = resolvedDefinition.data;
  const defaults = getDefinitionDefaultsFromDefinition(def);
  const asset = await resolveWeaponAsset(instance.weaponDefinitionId);
  const override = await readOptionalOverride("weapons", tokenId);

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
    composition: defaults?.recipeId
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
    sourceReadMethod: `weaponInstanceOf + ownerOf + ${
      resolvedDefinition.sourceMode === "chain"
        ? "weaponDefinitionOf"
        : "data/definitions/weapons/*.json"
    }`,
    sourceMode: resolvedDefinition.sourceMode,
    verificationStatus: resolvedDefinition.sourceMode === "chain" ? "confirmed" : "derived",
    notes:
      resolvedDefinition.sourceMode === "chain"
        ? `Generated from live CityWeapons reads for token ${tokenId} on ${network}.`
        : `Generated from live weapon instance reads plus local weapon definition fallback for token ${tokenId}.`,
    display: {
      weaponClassLabel: await getWeaponClassLabel(defaults?.weaponClass ?? 0),
      damageTypeLabel: await getDamageTypeLabel(defaults?.damageType ?? 0),
      rarityLabel: await getRarityLabel(instance.rarityTier),
      frameTierLabel: await getFrameTierLabel(instance.frameTier),
      originFactionLabel: getOriginFactionLabel(instance.originFaction),
      resonanceTypeLabel: await getResonanceTypeLabel(instance.resonanceType)
    }
  };

  if (resolvedDefinition.fallbackReason) {
    metadata.sourceFallbackReason = resolvedDefinition.fallbackReason;
  }

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "weapons", `${tokenId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.weaponsGenerated += 1;
  if (resolvedDefinition.sourceMode === "chain") {
    report.summary.generatedFromChain += 1;
  } else {
    report.summary.generatedFromDefinitions += 1;
  }
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Weapon instances checked: ${report.summary.weaponsGenerated}`
    : `Weapon instance metadata generation complete. Written: ${report.summary.weaponsGenerated}`
);

console.log(
  `Sources used: chain=${report.summary.generatedFromChain}, definitions=${report.summary.generatedFromDefinitions}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}