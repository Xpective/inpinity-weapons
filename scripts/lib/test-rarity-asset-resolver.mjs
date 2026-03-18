import { getRarityAssets, listRarityAssetMappings } from "./rarity-asset-resolver.mjs";

const mappings = await listRarityAssetMappings();
console.log("All rarity mappings:");
console.log(JSON.stringify(mappings, null, 2));

console.log("\nTier 3 example:");
const tier3 = await getRarityAssets(3);
console.log(JSON.stringify(tier3, null, 2));