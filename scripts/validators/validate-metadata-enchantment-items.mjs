import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Metadata Enchantment Items",
  pattern: "metadata/enchantment-items/*.json",
  schemaFileName: "enchantment-item-metadata.schema.json"
});

process.exitCode = ok ? 0 : 1;