import fs from "node:fs/promises";

export function mergeObjects(base, override) {
  if (!override) return base;
  return {
    ...base,
    ...override
  };
}

export async function writeJsonFile(filePath, data) {
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(filePath, json, "utf8");
}