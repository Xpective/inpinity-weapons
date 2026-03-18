import fs from "node:fs/promises";
import path from "node:path";
import { readJsonFile } from "./fs-utils.mjs";

export async function readOptionalOverride(folder, id) {
  const fullPath = path.join("data", "overrides", folder, `${id}.json`);

  try {
    await fs.access(fullPath);
    return await readJsonFile(fullPath);
  } catch {
    return null;
  }
}