import { writeJsonFile } from "./metadata-builder.mjs";

export async function writeSyncReport(filePath, report) {
  await writeJsonFile(filePath, report);
}