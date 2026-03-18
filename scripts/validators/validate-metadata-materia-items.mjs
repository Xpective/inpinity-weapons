import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Metadata Materia Items",
  pattern: "metadata/materia-items/*.json",
  schemaFileName: "materia-item-metadata.schema.json"
});

process.exitCode = ok ? 0 : 1;