import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readMateriaItemDefinition } from "../lib/chain-reader.mjs";
import { resolveMateriaItemAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import { getRarityLabel } from "../lib/enum-labels.mjs";

const network = getArgValue("--network", GENERATOR_DEFAULTS.network);
const dryRun = hasFlag("--dry-run");
const fromId = Number(getArgValue("--from", "1"));
const toId = Number(getArgValue("--to", "3"));

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  summary: {
    materiaItemsGenerated: 0
  },
  warnings: []
};

for (let itemId = fromId; itemId <= toId; itemId += 1) {
  const definition = await readMateriaItemDefinition({
    network,
    contractAddress: CONTRACTS[network].cityMateriaItems,
    itemId
  });

  if (!definition.itemId) {
    report.warnings.push(`Materia item ${itemId} returned empty definition.`);
    continue;
  }

  const asset = await resolveMateriaItemAsset(itemId);
  const override = await readOptionalOverride("materia-items", itemId);

  if (!asset) {
    report.warnings.push(`Missing asset manifest entry for materia item ${itemId}.`);
  }

  const fallbackName =
    definition.materiaDefinitionId === 1
      ? "Fire Materia Item"
      : definition.materiaDefinitionId === 2
        ? "Resonance Materia Item"
        : definition.materiaDefinitionId === 3
          ? "Stability Materia Item"
          : `Materia Item ${definition.itemId}`;

  const metadata = {
    schemaVersion: "1.0.0",
    kind: "materiaItemMetadata",
    tokenStandard: "ERC1155",
    network,
    chainId: CONTRACTS[network].chainId,
    contractAddress: CONTRACTS[network].cityMateriaItems,
    materiaItemDefinitionId: definition.itemId,
    materiaDefinitionId: definition.materiaDefinitionId,
    name: override?.name || asset?.name || fallbackName,
    description:
      override?.description ||
      `Published metadata for ${override?.name || asset?.name || fallbackName} in the live Inpinity City system.`,
    image: asset?.image || "",
    external_url: `https://assets.inpinity.online/city/metadata/materia-items/${definition.itemId}.json`,
    attributes: [
      {
        trait_type: "Materia Item Definition ID",
        value: definition.itemId,
        display_type: "number"
      },
      {
        trait_type: "Materia Definition ID",
        value: definition.materiaDefinitionId,
        display_type: "number"
      },
      {
        trait_type: "Level",
        value: definition.level,
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
        trait_type: "Burn On Use",
        value: definition.burnOnUse ? "Yes" : "No"
      },
      {
        trait_type: "Enabled",
        value: definition.enabled ? "Yes" : "No"
      }
    ],
    verificationStatus: "confirmed",
    notes: `Generated from live CityMateriaItems materiaItemDefinitionOf(${definition.itemId}) on ${network}.`
  };

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "materia-items", `${definition.itemId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.materiaItemsGenerated += 1;
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Materia items checked: ${report.summary.materiaItemsGenerated}`
    : `Materia item metadata generation complete. Written: ${report.summary.materiaItemsGenerated}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}