import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Enchantment Items",
  pattern: "data/definitions/enchantment-items/*.json",
  schemaFileName: "enchantment-item-definition.schema.json"
});

process.exitCode = ok ? 0 : 1;