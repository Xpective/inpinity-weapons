import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Metadata Weapons",
  pattern: "metadata/weapons/*.json",
  schemaFileName: "weapon-instance-metadata.schema.json"
});

process.exitCode = ok ? 0 : 1;