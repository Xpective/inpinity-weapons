import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readJsonFile } from "../lib/fs-utils.mjs";
import { readComponentDefinition } from "../lib/chain-reader.mjs";
import { resolveComponentAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import { getRarityLabel, getTechTierLabel } from "../lib/enum-labels.mjs";

const network = getArgValue("--network", GENERATOR_DEFAULTS.network);
const dryRun = hasFlag("--dry-run");
const fromId = Number(getArgValue("--from", "1"));
const toId = Number(getArgValue("--to", "9"));

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  summary: {
    componentsGenerated: 0
  },
  warnings: []
};

function getDefaultCategoryLabel(category) {
  const categoryMap = {
    1: "Blade",
    2: "Hilt",
    3: "Core",
    4: "Bow Part",
    5: "Chamber",
    6: "Coil",
    7: "Stabilizer",
    8: "Grip"
  };

  return categoryMap[category] || `Category ${category}`;
}

for (let id = fromId; id <= toId; id += 1) {
  const definition = await readComponentDefinition({
    network,
    contractAddress: CONTRACTS[network].cityComponents,
    id
  });

  if (!definition.id || !definition.name) {
    report.warnings.push(`Component ${id} returned empty definition.`);
    continue;
  }

  const asset = await resolveComponentAsset(id);
  const override = await readOptionalOverride("components", id);

  if (!asset) {
    report.warnings.push(`Missing asset manifest entry for component ${id}.`);
  }

  const metadata = {
    schemaVersion: "1.0.0",
    kind: "componentMetadata",
    tokenStandard: "ERC1155",
    network,
    chainId: CONTRACTS[network].chainId,
    contractAddress: CONTRACTS[network].cityComponents,
    componentDefinitionId: definition.id,
    name: definition.name,
    description:
      override?.description ||
      `Published metadata for ${definition.name} in the live Inpinity City system.`,
    image: asset?.image || "",
    external_url: `https://assets.inpinity.online/city/metadata/components/${definition.id}.json`,
    attributes: [
      {
        trait_type: "Component Definition ID",
        value: definition.id,
        display_type: "number"
      },
      {
        trait_type: "Category",
        value: definition.category,
        display_type: "number"
      },
      {
        trait_type: "Category Label",
        value: override?.display?.categoryLabel || getDefaultCategoryLabel(definition.category)
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
        trait_type: "Enabled",
        value: definition.enabled ? "Yes" : "No"
      }
    ],
    verificationStatus: "confirmed",
    notes: `Generated from live CityComponents componentDefinitionOf(${definition.id}) on ${network}.`
  };

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "components", `${definition.id}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.componentsGenerated += 1;
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Components checked: ${report.summary.componentsGenerated}`
    : `Component metadata generation complete. Written: ${report.summary.componentsGenerated}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}