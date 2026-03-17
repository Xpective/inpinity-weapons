import fg from "fast-glob";
import { readJsonFile } from "../lib/fs-utils.mjs";
import { validateAgainstSchema, formatAjvErrors } from "../lib/schema-utils.mjs";

export async function validateByPattern({ label, pattern, schemaFileName }) {
  const files = await fg(pattern, { dot: false });
  let hasErrors = false;

  console.log(`\n=== Validating ${label} ===`);

  if (files.length === 0) {
    console.log(`No files found for pattern: ${pattern}`);
    return true;
  }

  for (const file of files) {
    try {
      const json = await readJsonFile(file);
      const result = await validateAgainstSchema(schemaFileName, json);

      if (result.valid) {
        console.log(`✅ ${file}`);
      } else {
        hasErrors = true;
        console.error(`❌ ${file}`);
        for (const msg of formatAjvErrors(result.errors)) {
          console.error(`   - ${msg}`);
        }
      }
    } catch (error) {
      hasErrors = true;
      console.error(`❌ ${file}`);
      console.error(`   - ${error.message}`);
    }
  }

  return !hasErrors;
}