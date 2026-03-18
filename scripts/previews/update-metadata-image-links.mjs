import fs from "node:fs/promises";
import path from "node:path";

const BASE_PUBLIC_URL = "https://assets.inpinity.online/city";

const TYPE_CONFIG = {
  weapons: {
    metadataDir: "metadata/weapons",
    previewUrlBase: `${BASE_PUBLIC_URL}/previews/weapons`
  },
  components: {
    metadataDir: "metadata/components",
    previewUrlBase: `${BASE_PUBLIC_URL}/previews/components`
  },
  blueprints: {
    metadataDir: "metadata/blueprints",
    previewUrlBase: `${BASE_PUBLIC_URL}/previews/blueprints`
  },
  "materia-items": {
    metadataDir: "metadata/materia-items",
    previewUrlBase: `${BASE_PUBLIC_URL}/previews/materia-items`
  },
  "enchantment-items": {
    metadataDir: "metadata/enchantment-items",
    previewUrlBase: `${BASE_PUBLIC_URL}/previews/enchantment-items`
  }
};

function getArgValue(name, fallback = null) {
  const prefix = `${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  if (!entry) return fallback;
  return entry.slice(prefix.length);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listJsonFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.join(dirPath, e.name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getIdFromMetadata(type, metadata) {
  if (type === "weapons") return metadata.tokenId;
  if (type === "components") return metadata.componentDefinitionId;
  if (type === "blueprints") return metadata.blueprintDefinitionId;
  if (type === "materia-items") return metadata.materiaItemDefinitionId;
  if (type === "enchantment-items") return metadata.enchantmentItemDefinitionId;
  return null;
}

function getPreviewUrl(type, id) {
  return `${TYPE_CONFIG[type].previewUrlBase}/${id}.png`;
}

function getPreviewLocalPath(type, id) {
  return path.join("previews", type, `${id}.png`);
}

async function updateType(type) {
  const config = TYPE_CONFIG[type];
  if (!config) throw new Error(`Unsupported type: ${type}`);

  const files = await listJsonFiles(config.metadataDir);
  let updated = 0;

  console.log(`\n=== Updating ${type} metadata image links ===`);

  for (const filePath of files) {
    const metadata = await readJson(filePath);
    const id = getIdFromMetadata(type, metadata);

    if (!id) {
      console.warn(`- Skipped ${filePath}: missing expected id field`);
      continue;
    }

    const previewLocalPath = getPreviewLocalPath(type, id);
    if (!(await fileExists(previewLocalPath))) {
      console.warn(`- Skipped ${filePath}: missing preview ${previewLocalPath}`);
      continue;
    }

    const previewUrl = getPreviewUrl(type, id);
    metadata.image = previewUrl;

    if ("renderLayers" in metadata) {
      delete metadata.renderLayers;
    }

    await writeJson(filePath, metadata);
    updated += 1;
    console.log(`✅ ${filePath} -> ${previewUrl}`);
  }

  console.log(`Updated ${updated} file(s) for ${type}.`);
}

const typeArg = getArgValue("--type", "all");

(async () => {
  const types = typeArg === "all" ? Object.keys(TYPE_CONFIG) : [typeArg];

  for (const type of types) {
    await updateType(type);
  }

  console.log("\nDone.");
})().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});