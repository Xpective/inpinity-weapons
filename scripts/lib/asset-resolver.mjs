import { readJsonFile } from "./fs-utils.mjs";

const manifestCache = new Map();

async function loadManifest(filePath) {
  if (manifestCache.has(filePath)) {
    return manifestCache.get(filePath);
  }

  const manifest = await readJsonFile(filePath);
  manifestCache.set(filePath, manifest);
  return manifest;
}

export async function resolveComponentAsset(componentDefinitionId) {
  const manifest = await loadManifest("assets/manifests/components-assets.json");
  return (
    manifest.items.find(
      (item) => Number(item.componentDefinitionId) === Number(componentDefinitionId)
    ) || null
  );
}

export async function resolveBlueprintAsset(blueprintDefinitionId) {
  const manifest = await loadManifest("assets/manifests/blueprints-assets.json");
  return (
    manifest.items.find(
      (item) => Number(item.blueprintDefinitionId) === Number(blueprintDefinitionId)
    ) || null
  );
}

export async function resolveWeaponAsset(weaponDefinitionId) {
  const manifest = await loadManifest("assets/manifests/weapons-assets.json");
  return (
    manifest.items.find(
      (item) => Number(item.weaponDefinitionId) === Number(weaponDefinitionId)
    ) || null
  );
}

export async function resolveEnchantmentItemAsset(enchantmentItemDefinitionId) {
  const manifest = await loadManifest("assets/manifests/enchantments-assets.json");
  return (
    manifest.items.find(
      (item) => Number(item.enchantmentItemDefinitionId) === Number(enchantmentItemDefinitionId)
    ) || null
  );
}

export async function resolveMateriaItemAsset(materiaItemDefinitionId) {
  const manifest = await loadManifest("assets/manifests/materia-assets.json");
  return (
    manifest.items.find(
      (item) => Number(item.materiaItemDefinitionId) === Number(materiaItemDefinitionId)
    ) || null
  );
}