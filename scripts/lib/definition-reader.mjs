import path from "node:path";
import { readJsonFile } from "./fs-utils.mjs";

export async function readComponentDefinitionFromFile(id) {
  const filePath = path.join(
    "data",
    "definitions",
    "components",
    `${String(id).padStart(3, "0")}-${getComponentSlug(id)}.json`
  );

  const json = await readJsonFile(filePath);

  return {
    id: Number(json.componentDefinitionId),
    name: json.name,
    category: Number(json.category),
    rarityTier: Number(json.rarityTier),
    techTier: Number(json.techTier),
    enabled: Boolean(json.enabled),
    _sourceFile: filePath
  };
}

function getComponentSlug(id) {
  const map = {
    1: "iron-blade",
    2: "reinforced-hilt",
    3: "crystal-core",
    4: "bow-limb",
    5: "bow-string",
    6: "plasma-chamber",
    7: "energy-coil",
    8: "stabilizer",
    9: "resonance-grip"
  };

  const slug = map[Number(id)];
  if (!slug) {
    throw new Error(`No component slug mapping found for id ${id}`);
  }
  return slug;
}