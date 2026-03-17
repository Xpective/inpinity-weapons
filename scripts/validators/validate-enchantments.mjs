import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Enchantments",
  pattern: "data/definitions/enchantments/*.json",
  schemaFileName: "enchantment-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;