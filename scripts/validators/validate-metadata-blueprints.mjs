import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Metadata Blueprints",
  pattern: "metadata/blueprints/*.json",
  schemaFileName: "blueprint-metadata.schema.json"
});

process.exitCode = ok ? 0 : 1;