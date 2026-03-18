import path from "node:path";
import { CONTRACTS } from "../config/contracts.mjs";
import { GENERATOR_DEFAULTS } from "../config/generator-defaults.mjs";
import { readMateriaItemDefinition } from "../lib/chain-reader.mjs";
import { readMateriaItemDefinitionFromFile } from "../lib/definition-reader.mjs";
import { resolveWithSource } from "../lib/source-resolver.mjs";
import { resolveMateriaItemAsset } from "../lib/asset-resolver.mjs";
import { readOptionalOverride } from "../lib/override-resolver.mjs";
import { mergeObjects, writeJsonFile } from "../lib/metadata-builder.mjs";
import { writeSyncReport } from "../lib/report-writer.mjs";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";
import { getRarityAssets } from "../lib/rarity-asset-resolver.mjs";
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
  generator: "generate-materia-item-metadata",
  sourceModeRequested: sourceMode,
  summary: {
    materiaItemsGenerated: 0,
    generatedFromChain: 0,
    generatedFromDefinitions: 0
  },
  warnings: []
};

for (let itemId = fromId; itemId <= toId; itemId += 1) {
  const resolved = await resolveWithSource({
    sourceMode,
    readFromChain: async () =>
      readMateriaItemDefinition({
        network,
        contractAddress: CONTRACTS[network].cityMateriaItems,
        itemId
      }),
    readFromDefinitions: async () => readMateriaItemDefinitionFromFile(itemId),
    onWarning: (msg) => report.warnings.push(`Materia item ${itemId}: ${msg}`)
  });

  const definition = resolved.data;

  if (!definition.itemId) {
    report.warnings.push(`Materia item ${itemId} returned empty definition.`);
    continue;
  }

  const asset = await resolveMateriaItemAsset(itemId);
  const override = await readOptionalOverride("materia-items", itemId);
  const rarityAssets = await getRarityAssets(definition.rarityTier);

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
    generatedAt: new Date().toISOString(),
    sourceContract: CONTRACTS[network].cityMateriaItems,
    sourceReadMethod:
      resolved.sourceMode === "chain"
        ? "materiaItemDefinitionOf"
        : "data/definitions/materia-items/*.json",
    sourceMode: resolved.sourceMode,
    verificationStatus: resolved.sourceMode === "chain" ? "confirmed" : "derived",
    notes:
      resolved.sourceMode === "chain"
        ? `Generated from live CityMateriaItems materiaItemDefinitionOf(${definition.itemId}) on ${network}.`
        : `Generated from local materia item definition fallback for id ${definition.itemId}.`,
    rarityPresentation: {
      rarityTier: rarityAssets.rarityTier,
      key: rarityAssets.key,
      name: rarityAssets.name,
      frame: {
        path512: rarityAssets.frame.path512,
        publicUrl: rarityAssets.frame.publicUrl,
        transparentCenter: rarityAssets.frame.transparentCenter,
        masterSize: rarityAssets.frame.masterSize
      },
      background: {
        path512: rarityAssets.background.path512,
        publicUrl: rarityAssets.background.publicUrl,
        masterSize: rarityAssets.background.masterSize
      }
    }
  };

  if (resolved.fallbackReason) {
    metadata.sourceFallbackReason = resolved.fallbackReason;
  }

  const merged = mergeObjects(metadata, override);

  if (!dryRun) {
    const outPath = path.join("metadata", "materia-items", `${definition.itemId}.json`);
    await writeJsonFile(outPath, merged);
  }

  report.summary.materiaItemsGenerated += 1;
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
    ? `Dry run complete. Materia items checked: ${report.summary.materiaItemsGenerated}`
    : `Materia item metadata generation complete. Written: ${report.summary.materiaItemsGenerated}`
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