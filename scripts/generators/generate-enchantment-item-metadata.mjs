import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readEnchantmentItemDefinition } from "../lib/chain-reader.mjs";
import { readEnchantmentItemDefinitionFromFile } from "../lib/definition-reader.mjs";
import { resolveWithSource } from "../lib/source-resolver.mjs";
import { resolveEnchantmentItemAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import { getRarityLabel } from "../lib/enum-labels.mjs";

const network = getArgValue("--network", GENERATOR_DEFAULTS.network);
const dryRun = hasFlag("--dry-run");
const fromId = Number(getArgValue("--from", "1"));
const toId = Number(getArgValue("--to", "3"));
const sourceMode = getArgValue("--source", "auto");

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  generator: "generate-enchantment-item-metadata",
  sourceModeRequested: sourceMode,
  summary: {
    enchantmentItemsGenerated: 0,
    generatedFromChain: 0,
    generatedFromDefinitions: 0
  },
  warnings: []
};

for (let itemId = fromId; itemId <= toId; itemId += 1) {
  const resolved = await resolveWithSource({
    sourceMode,
    readFromChain: async () =>
      readEnchantmentItemDefinition({
        network,
        contractAddress: CONTRACTS[network].cityEnchantmentItems,
        itemId
      }),
    readFromDefinitions: async () => readEnchantmentItemDefinitionFromFile(itemId),
    onWarning: (msg) => report.warnings.push(`Enchantment item ${itemId}: ${msg}`)
  });

  const definition = resolved.data;

  if (!definition.itemId) {
    report.warnings.push(`Enchantment item ${itemId} returned empty definition.`);
    continue;
  }

  const asset = await resolveEnchantmentItemAsset(itemId);
  const override = await readOptionalOverride("enchantment-items", itemId);

  if (!asset) {
    report.warnings.push(`Missing asset manifest entry for enchantment item ${itemId}.`);
  }

  const fallbackName =
    definition.enchantmentDefinitionId === 1
      ? "Fire Edge Item"
      : definition.enchantmentDefinitionId === 2
        ? "Precision Sight Item"
        : definition.enchantmentDefinitionId === 3
          ? "Durability Seal Item"
          : `Enchantment Item ${definition.itemId}`;

  const metadata = {
    schemaVersion: "1.0.0",
    kind: "enchantmentItemMetadata",
    tokenStandard: "ERC1155",
    network,
    chainId: CONTRACTS[network].chainId,
    contractAddress: CONTRACTS[network].cityEnchantmentItems,
    enchantmentItemDefinitionId: definition.itemId,
    enchantmentDefinitionId: definition.enchantmentDefinitionId,
    name: override?.name || asset?.name || fallbackName,
    description:
      override?.description ||
      `Published metadata for ${override?.name || asset?.name || fallbackName} in the live Inpinity City system.`,
    image: asset?.image || "",
    external_url: `https://assets.inpinity.online/city/metadata/enchantment-items/${definition.itemId}.json`,
    attributes: [
      {
        trait_type: "Enchantment Item Definition ID",
        value: definition.itemId,
        display_type: "number"
      },
      {
        trait_type: "Enchantment Definition ID",
        value: definition.enchantmentDefinitionId,
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
    generatedAt: new Date().toISOString(),
    sourceContract: CONTRACTS[network].cityEnchantmentItems,
    sourceReadMethod:
      resolved.sourceMode === "chain"
        ? "enchantmentItemDefinitionOf"
        : "data/definitions/enchantment-items/*.json",
    sourceMode: resolved.sourceMode,
    verificationStatus: resolved.sourceMode === "chain" ? "confirmed" : "derived",
    notes:
      resolved.sourceMode === "chain"
        ? `Generated from live CityEnchantmentItems enchantmentItemDefinitionOf(${definition.itemId}) on ${network}.`
        : `Generated from local enchantment item definition fallback for id ${definition.itemId}.`
  };

  if (resolved.fallbackReason) {
    metadata.sourceFallbackReason = resolved.fallbackReason;
  }

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "enchantment-items", `${definition.itemId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.enchantmentItemsGenerated += 1;
  if (resolved.sourceMode === "chain") {
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
    ? `Dry run complete. Enchantment items checked: ${report.summary.enchantmentItemsGenerated}`
    : `Enchantment item metadata generation complete. Written: ${report.summary.enchantmentItemsGenerated}`
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