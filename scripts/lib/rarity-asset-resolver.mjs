import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();

const FRAMES_MANIFEST_PATH = path.join(
  ROOT_DIR,
  "assets",
  "manifests",
  "rarity-frames.json"
);

const BACKGROUNDS_MANIFEST_PATH = path.join(
  ROOT_DIR,
  "assets",
  "manifests",
  "rarity-backgrounds.json"
);

let framesManifestCache = null;
let backgroundsManifestCache = null;

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function loadFramesManifest() {
  if (!framesManifestCache) {
    framesManifestCache = await readJson(FRAMES_MANIFEST_PATH);
  }
  return framesManifestCache;
}

async function loadBackgroundsManifest() {
  if (!backgroundsManifestCache) {
    backgroundsManifestCache = await readJson(BACKGROUNDS_MANIFEST_PATH);
  }
  return backgroundsManifestCache;
}

function normalizeRarityTier(rarityTier) {
  const value = Number(rarityTier);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid rarityTier: ${rarityTier}`);
  }
  return value;
}

function findEnabledEntryByTier(manifest, rarityTier) {
  const values = Array.isArray(manifest?.values) ? manifest.values : [];
  return values.find(
    (entry) => Number(entry.rarityTier) === rarityTier && entry.enabled === true
  );
}

export async function getRarityFrame(rarityTier) {
  const normalizedTier = normalizeRarityTier(rarityTier);
  const manifest = await loadFramesManifest();
  const entry = findEnabledEntryByTier(manifest, normalizedTier);

  if (!entry) {
    throw new Error(`No enabled rarity frame found for tier ${normalizedTier}`);
  }

  return {
    rarityTier: Number(entry.rarityTier),
    key: entry.key,
    name: entry.name,
    path512: entry.path512,
    publicUrl: entry.publicUrl,
    transparentCenter: Boolean(entry.transparentCenter),
    masterSize: Number(entry.masterSize)
  };
}

export async function getRarityBackground(rarityTier) {
  const normalizedTier = normalizeRarityTier(rarityTier);
  const manifest = await loadBackgroundsManifest();
  const entry = findEnabledEntryByTier(manifest, normalizedTier);

  if (!entry) {
    throw new Error(`No enabled rarity background found for tier ${normalizedTier}`);
  }

  return {
    rarityTier: Number(entry.rarityTier),
    key: entry.key,
    name: entry.name,
    path512: entry.path512,
    publicUrl: entry.publicUrl,
    masterSize: Number(entry.masterSize)
  };
}

export async function getRarityAssets(rarityTier) {
  const [frame, background] = await Promise.all([
    getRarityFrame(rarityTier),
    getRarityBackground(rarityTier)
  ]);

  return {
    rarityTier: normalizeRarityTier(rarityTier),
    key: frame.key,
    name: frame.name,
    frame,
    background
  };
}

export async function listRarityAssetMappings() {
  const framesManifest = await loadFramesManifest();
  const backgroundsManifest = await loadBackgroundsManifest();

  const frameValues = Array.isArray(framesManifest?.values) ? framesManifest.values : [];
  const backgroundValues = Array.isArray(backgroundsManifest?.values)
    ? backgroundsManifest.values
    : [];

  const tiers = new Set([
    ...frameValues.map((entry) => Number(entry.rarityTier)),
    ...backgroundValues.map((entry) => Number(entry.rarityTier))
  ]);

  return [...tiers]
    .filter((tier) => Number.isInteger(tier) && tier > 0)
    .sort((a, b) => a - b)
    .map((tier) => {
      const frame = frameValues.find(
        (entry) => Number(entry.rarityTier) === tier && entry.enabled === true
      ) || null;

      const background = backgroundValues.find(
        (entry) => Number(entry.rarityTier) === tier && entry.enabled === true
      ) || null;

      return {
        rarityTier: tier,
        key: frame?.key || background?.key || null,
        frame,
        background
      };
    });
}

export function clearRarityAssetResolverCache() {
  framesManifestCache = null;
  backgroundsManifestCache = null;
}