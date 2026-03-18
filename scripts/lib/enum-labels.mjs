import { readJsonFile } from "./fs-utils.mjs";

let cache = null;

async function loadEnumCache() {
  if (cache) return cache;

  const [
    weaponClasses,
    damageTypes,
    rarityTiers,
    frameTiers,
    techTiers,
    resonanceTypes,
    resourceTypes,
    recipeTypes
  ] = await Promise.all([
    readJsonFile("data/enums/weapon-classes.json"),
    readJsonFile("data/enums/damage-types.json"),
    readJsonFile("data/enums/rarity-tiers.json"),
    readJsonFile("data/enums/frame-tiers.json"),
    readJsonFile("data/enums/tech-tiers.json"),
    readJsonFile("data/enums/resonance-types.json"),
    readJsonFile("data/enums/resource-types.json"),
    readJsonFile("data/enums/recipe-types.json")
  ]);

  cache = {
    weaponClasses,
    damageTypes,
    rarityTiers,
    frameTiers,
    techTiers,
    resonanceTypes,
    resourceTypes,
    recipeTypes
  };

  return cache;
}

function findLabel(list, id, fallback = `Unknown (${id})`) {
  const match = list.values.find((x) => Number(x.id) === Number(id));
  return match ? match.name : fallback;
}

export async function getWeaponClassLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.weaponClasses, id);
}

export async function getDamageTypeLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.damageTypes, id);
}

export async function getRarityLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.rarityTiers, id);
}

export async function getFrameTierLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.frameTiers, id);
}

export async function getTechTierLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.techTiers, id);
}

export async function getResonanceTypeLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.resonanceTypes, id);
}

export async function getResourceLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.resourceTypes, id);
}

export async function getRecipeOutputKindLabel(id) {
  const enums = await loadEnumCache();
  return findLabel(enums.recipeTypes, id);
}