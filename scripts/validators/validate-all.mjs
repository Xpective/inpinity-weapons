import { validateByPattern } from "./_validate-by-pattern.mjs";

const checks = [
  {
    label: "Weapons",
    pattern: "data/definitions/weapons/*.json",
    schemaFileName: "weapon-definition.schema.json"
  },
  {
    label: "Components",
    pattern: "data/definitions/components/*.json",
    schemaFileName: "component-definition.schema.json"
  },
  {
    label: "Blueprints",
    pattern: "data/definitions/blueprints/*.json",
    schemaFileName: "blueprint-definition.schema.json"
  },
  {
    label: "Enchantments",
    pattern: "data/definitions/enchantments/*.json",
    schemaFileName: "enchantment-definition.schema.json"
  },
  {
    label: "Enchantment Items",
    pattern: "data/definitions/enchantment-items/*.json",
    schemaFileName: "enchantment-item-definition.schema.json"
  },
  {
    label: "Materia",
    pattern: "data/definitions/materia/*.json",
    schemaFileName: "materia-definition.schema.json"
  },
  {
    label: "Materia Items",
    pattern: "data/definitions/materia-items/*.json",
    schemaFileName: "materia-item-definition.schema.json"
  },
  {
    label: "Recipes",
    pattern: "data/definitions/recipes/*.json",
    schemaFileName: "recipe.schema.json"
  },
  {
    label: "Metadata Weapons",
    pattern: "metadata/weapons/*.json",
    schemaFileName: "weapon-instance-metadata.schema.json"
  },
  {
    label: "Metadata Components",
    pattern: "metadata/components/*.json",
    schemaFileName: "component-metadata.schema.json"
  },
  {
    label: "Metadata Blueprints",
    pattern: "metadata/blueprints/*.json",
    schemaFileName: "blueprint-metadata.schema.json"
  },
  {
    label: "Metadata Enchantment Items",
    pattern: "metadata/enchantment-items/*.json",
    schemaFileName: "enchantment-item-metadata.schema.json"
  },
  {
    label: "Metadata Materia Items",
    pattern: "metadata/materia-items/*.json",
    schemaFileName: "materia-item-metadata.schema.json"
  }
];

let allOk = true;

for (const check of checks) {
  const ok = await validateByPattern(check);
  if (!ok) {
    allOk = false;
  }
}

process.exitCode = allOk ? 0 : 1;