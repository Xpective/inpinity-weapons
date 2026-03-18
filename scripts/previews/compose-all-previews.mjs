import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function getArgValue(name, fallback = null) {
  const prefix = `${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  if (!entry) return fallback;
  return entry.slice(prefix.length);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function urlToLocalPath(url) {
  const marker = "/city/";
  const idx = url.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Could not map URL to local path: ${url}`);
  }
  return url.slice(idx + marker.length);
}

function build512FallbackPath(localPath) {
  const normalized = localPath.replace(/\\/g, "/");
  if (normalized.includes("/512/")) return normalized;

  const parts = normalized.split("/");
  if (parts.length < 3) return normalized;

  const fileName = parts.pop();
  return [...parts, "512", fileName].join("/");
}

async function resolveExistingAssetPath(url) {
  const directPath = urlToLocalPath(url);
  if (await fileExists(directPath)) return directPath;

  const fallback512 = build512FallbackPath(directPath);
  if (await fileExists(fallback512)) return fallback512;

  throw new Error(`Missing local asset file. Checked: ${directPath} and ${fallback512}`);
}

async function composePreview({ metadataPath, outputPath, size = 512 }) {
  const metadata = await readJson(metadataPath);

  const itemUrl = metadata.image;
  const bgUrl = metadata?.rarityPresentation?.background?.publicUrl;
  const frameUrl = metadata?.rarityPresentation?.frame?.publicUrl;

  if (!itemUrl) throw new Error(`Metadata missing image: ${metadataPath}`);
  if (!bgUrl) throw new Error(`Metadata missing rarityPresentation.background.publicUrl: ${metadataPath}`);
  if (!frameUrl) throw new Error(`Metadata missing rarityPresentation.frame.publicUrl: ${metadataPath}`);

  const itemPath = await resolveExistingAssetPath(itemUrl);
  const bgPath = await resolveExistingAssetPath(bgUrl);
  const framePath = await resolveExistingAssetPath(frameUrl);

  const backgroundBuffer = await sharp(bgPath).resize(size, size, { fit: "contain" }).png().toBuffer();
  const itemBuffer = await sharp(itemPath).resize(size, size, { fit: "contain" }).png().toBuffer();
  const frameBuffer = await sharp(framePath).resize(size, size, { fit: "contain" }).png().toBuffer();

  await ensureDir(path.dirname(outputPath));

  await sharp(backgroundBuffer)
    .composite([
      { input: itemBuffer, top: 0, left: 0 },
      { input: frameBuffer, top: 0, left: 0 }
    ])
    .png()
    .toFile(outputPath);

  console.log(`✅ ${outputPath}`);
}

async function listJsonFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.join(dirPath, e.name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const type = getArgValue("--type", "all");
const size = Number(getArgValue("--size", "512"));

const typeMap = {
  weapons: { metadataDir: "metadata/weapons", previewDir: "previews/weapons" },
  components: { metadataDir: "metadata/components", previewDir: "previews/components" },
  blueprints: { metadataDir: "metadata/blueprints", previewDir: "previews/blueprints" },
  "materia-items": { metadataDir: "metadata/materia-items", previewDir: "previews/materia-items" },
  "enchantment-items": { metadataDir: "metadata/enchantment-items", previewDir: "previews/enchantment-items" }
};

const selectedTypes = type === "all" ? Object.keys(typeMap) : [type];

(async () => {
  for (const currentType of selectedTypes) {
    const config = typeMap[currentType];
    if (!config) throw new Error(`Unsupported type: ${currentType}`);

    console.log(`\n=== Composing ${currentType} previews ===`);

    await ensureDir(config.previewDir);
    const files = await listJsonFiles(config.metadataDir);

    for (const metadataPath of files) {
      const fileName = path.basename(metadataPath, ".json") + ".png";
      const outputPath = path.join(config.previewDir, fileName);
      await composePreview({ metadataPath, outputPath, size });
    }
  }

  console.log("\nDone.");
})().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});