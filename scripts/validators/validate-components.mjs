import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Components",
  pattern: "data/definitions/components/*.json",
  schemaFileName: "component-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;