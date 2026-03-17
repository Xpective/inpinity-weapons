import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Recipes",
  pattern: "data/definitions/recipes/*.json",
  schemaFileName: "recipe.schema.json"
});

process.exitCode = ok ? 0 : 1;