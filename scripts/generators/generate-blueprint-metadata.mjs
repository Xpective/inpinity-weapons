import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readBlueprintDefinition } from "../lib/chain-reader.mjs";
import { resolveBlueprintAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import { getRarityLabel, getTechTierLabel } from "../lib/enum-labels.mjs";

const network = getArgValue("--network", GENERATOR_DEFAULTS.network);
const dryRun = hasFlag("--dry-run");
const fromId = Number(getArgValue("--from", "1"));
const toId = Number(getArgValue("--to", "3"));

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  summary: {
    blueprintsGenerated: 0
  },
  warnings: []
};

function getFactionLockLabel(value) {
  if (Number(value) === 0) return "None";
  if (Number(value) === 1) return "Pi";
  if (Number(value) === 2) return "Phi";
  if (Number(value) === 3) return "Borderline";
  return `Faction ${value}`;
}

function getDistrictLockLabel(value) {
  if (Number(value) === 0) return "None";
  return `District ${value}`;
}

for (let id = fromId; id <= toId; id += 1) {
  const definition = await readBlueprintDefinition({
    network,
    contractAddress: CONTRACTS[network].cityBlueprints,
    id
  });

  if (!definition.id || !definition.name) {
    report.warnings.push(`Blueprint ${id} returned empty definition.`);
    continue;
  }

  const asset = await resolveBlueprintAsset(id);
  const override = await readOptionalOverride("blueprints", id);

  if (!asset) {
    report.warnings.push(`Missing asset manifest entry for blueprint ${id}.`);
  }

  const metadata = {
    schemaVersion: "1.0.0",
    kind: "blueprintMetadata",
    tokenStandard: "ERC1155",
    network,
    chainId: CONTRACTS[network].chainId,
    contractAddress: CONTRACTS[network].cityBlueprints,
    blueprintDefinitionId: definition.id,
    name: definition.name,
    description:
      override?.description ||
      `Published metadata for ${definition.name} in the live Inpinity City system.`,
    image: asset?.image || "",
    external_url: `https://assets.inpinity.online/city/metadata/blueprints/${definition.id}.json`,
    attributes: [
      {
        trait_type: "Blueprint Definition ID",
        value: definition.id,
        display_type: "number"
      },
      {
        trait_type: "Rarity Tier",
        value: definition.rarityTier,
        display_type: "number"
      },
      {
        trait_type: "Rarity",
        value: await getRarityLabel(definition.rarityTier)
      },
      {
        trait_type: "Tech Tier",
        value: definition.techTier,
        display_type: "number"
      },
      {
        trait_type: "Tech Tier Label",
        value: await getTechTierLabel(definition.techTier)
      },
      {
        trait_type: "Faction Lock",
        value: definition.factionLock,
        display_type: "number"
      },
      {
        trait_type: "Faction Lock Label",
        value:
          override?.display?.factionLockLabel ||
          getFactionLockLabel(definition.factionLock)
      },
      {
        trait_type: "District Lock",
        value: definition.districtLock,
        display_type: "number"
      },
      {
        trait_type: "District Lock Label",
        value:
          override?.display?.districtLockLabel ||
          getDistrictLockLabel(definition.districtLock)
      },
      {
        trait_type: "Enabled",
        value: definition.enabled ? "Yes" : "No"
      }
    ],
    verificationStatus: "confirmed",
    notes: `Generated from live CityBlueprints blueprintDefinitionOf(${definition.id}) on ${network}.`
  };

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "blueprints", `${definition.id}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.blueprintsGenerated += 1;
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Blueprints checked: ${report.summary.blueprintsGenerated}`
    : `Blueprint metadata generation complete. Written: ${report.summary.blueprintsGenerated}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}