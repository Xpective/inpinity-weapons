import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Blueprints",
  pattern: "data/definitions/blueprints/*.json",
  schemaFileName: "blueprint-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;