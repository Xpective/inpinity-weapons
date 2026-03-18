import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readEnchantmentItemDefinition } from "../lib/chain-reader.mjs";
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

const report = {
  generatedAt: new Date().toISOString(),
  network,
  chainId: CONTRACTS[network].chainId,
  summary: {
    enchantmentItemsGenerated: 0
  },
  warnings: []
};

for (let itemId = fromId; itemId <= toId; itemId += 1) {
  const definition = await readEnchantmentItemDefinition({
    network,
    contractAddress: CONTRACTS[network].cityEnchantmentItems,
    itemId
  });

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
    verificationStatus: "confirmed",
    notes: `Generated from live CityEnchantmentItems enchantmentItemDefinitionOf(${definition.itemId}) on ${network}.`
  };

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "enchantment-items", `${definition.itemId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.enchantmentItemsGenerated += 1;
}

if (GENERATOR_DEFAULTS.writeReport && !dryRun) {
  await writeSyncReport(GENERATOR_DEFAULTS.reportsPath, report);
}

console.log(
  dryRun
    ? `Dry run complete. Enchantment items checked: ${report.summary.enchantmentItemsGenerated}`
    : `Enchantment item metadata generation complete. Written: ${report.summary.enchantmentItemsGenerated}`
);

if (report.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of report.warnings) {
    console.log(`- ${warning}`);
  }
}