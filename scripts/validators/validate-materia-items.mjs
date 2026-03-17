import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Materia Items",
  pattern: "data/definitions/materia-items/*.json",
  schemaFileName: "materia-item-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;