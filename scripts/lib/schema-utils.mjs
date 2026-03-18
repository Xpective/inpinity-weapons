import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readJsonFile } from "./fs-utils.mjs";
import { PATHS } from "../config/paths.mjs";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

addFormats(ajv);

let schemasLoaded = false;
let schemasLoadingPromise = null;

const SCHEMA_ID_MAP = {
  "common.schema.json": "https://assets.inpinity.online/city/schemas/common.schema.json",
  "weapon-definition.schema.json": "https://assets.inpinity.online/city/schemas/weapon-definition.schema.json",
  "component-definition.schema.json": "https://assets.inpinity.online/city/schemas/component-definition.schema.json",
  "blueprint-definition.schema.json": "https://assets.inpinity.online/city/schemas/blueprint-definition.schema.json",
  "enchantment-definition.schema.json": "https://assets.inpinity.online/city/schemas/enchantment-definition.schema.json",
  "enchantment-item-definition.schema.json": "https://assets.inpinity.online/city/schemas/enchantment-item-definition.schema.json",
  "materia-definition.schema.json": "https://assets.inpinity.online/city/schemas/materia-definition.schema.json",
  "materia-item-definition.schema.json": "https://assets.inpinity.online/city/schemas/materia-item-definition.schema.json",
  "recipe.schema.json": "https://assets.inpinity.online/city/schemas/recipe.schema.json",
  "weapon-instance-metadata.schema.json": "https://assets.inpinity.online/city/schemas/weapon-instance-metadata.schema.json",
  "component-metadata.schema.json": "https://assets.inpinity.online/city/schemas/component-metadata.schema.json",
  "blueprint-metadata.schema.json": "https://assets.inpinity.online/city/schemas/blueprint-metadata.schema.json",
  "enchantment-item-metadata.schema.json": "https://assets.inpinity.online/city/schemas/enchantment-item-metadata.schema.json",
  "materia-item-metadata.schema.json": "https://assets.inpinity.online/city/schemas/materia-item-metadata.schema.json"
};

async function ensureSchemasLoaded() {
  if (schemasLoaded) return;

  if (schemasLoadingPromise) {
    await schemasLoadingPromise;
    return;
  }

  schemasLoadingPromise = (async () => {
    const schemaFiles = [
      "common.schema.json",
      "weapon-definition.schema.json",
      "component-definition.schema.json",
      "blueprint-definition.schema.json",
      "enchantment-definition.schema.json",
      "enchantment-item-definition.schema.json",
      "materia-definition.schema.json",
      "materia-item-definition.schema.json",
      "recipe.schema.json",
      "weapon-instance-metadata.schema.json",
      "component-metadata.schema.json",
      "blueprint-metadata.schema.json",
      "enchantment-item-metadata.schema.json",
      "materia-item-metadata.schema.json"
    ];

    for (const fileName of schemaFiles) {
      const fullPath = path.join(PATHS.schemas, fileName);
      const schema = await readJsonFile(fullPath);
      const schemaId = schema.$id || SCHEMA_ID_MAP[fileName] || fileName;

      if (!ajv.getSchema(schemaId)) {
        ajv.addSchema(schema, schemaId);
      }
    }

    schemasLoaded = true;
  })();

  try {
    await schemasLoadingPromise;
  } finally {
    schemasLoadingPromise = null;
  }
}

export async function validateAgainstSchema(schemaFileName, jsonData) {
  await ensureSchemasLoaded();

  const schemaId = SCHEMA_ID_MAP[schemaFileName] || schemaFileName;
  const validate = ajv.getSchema(schemaId);

  if (!validate) {
    throw new Error(`Schema not found: ${schemaFileName}`);
  }

  const valid = validate(jsonData);

  return {
    valid: Boolean(valid),
    errors: validate.errors || []
  };
}

export function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => {
    const instancePath =
      error.instancePath && error.instancePath.length > 0
        ? error.instancePath
        : "/";
    return `${instancePath} ${error.message}`;
  });
}