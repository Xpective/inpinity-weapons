import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Weapons",
  pattern: "data/definitions/weapons/*.json",
  schemaFileName: "weapon-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;