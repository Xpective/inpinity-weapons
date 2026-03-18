import { validateByPattern } from "./_validate-by-pattern.mjs";

const ok = await validateByPattern({
  label: "Metadata Components",
  pattern: "metadata/components/*.json",
  schemaFileName: "component-metadata.schema.json"
});

process.exitCode = ok ? 0 : 1;