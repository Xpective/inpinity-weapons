import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Materia",
  pattern: "data/definitions/materia/*.json",
  schemaFileName: "materia-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;