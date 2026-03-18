import fs from "node:fs/promises";
import path from "node:path";
import { createPublicClient, http } from "viem";
import { RPC_CONFIG } from "../config/rpc.mjs";
import { CONTRACTS } from "../config/contracts.mjs";

function getArgValue(name, fallback = null) {
  const prefix = `${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  if (!entry) return fallback;
  return entry.slice(prefix.length);
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requireArg(name) {
  const value = getArgValue(name, null);
  if (value === null || value === "") {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote: ${filePath}`);
}

function getClient(network = "base") {
  const rpcUrl = RPC_CONFIG[network]?.rpcUrl;
  if (!rpcUrl) throw new Error(`Unknown network: ${network}`);

  return createPublicClient({
    transport: http(rpcUrl)
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  const msg = String(error?.shortMessage || error?.message || error || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    details.includes("rate limit") ||
    details.includes("over rate limit")
  );
}

async function readContractWithRetry(client, params, options = {}) {
  const retries = options.retries ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 1500;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await client.readContract(params);
    } catch (error) {
      if (!isRateLimitError(error) || attempt === retries) {
        throw error;
      }

      const delay = baseDelayMs * (attempt + 1);
      console.warn(`Rate limit hit. Retry ${attempt + 1}/${retries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error("Unreachable retry state.");
}

const cityWeaponsAbi = [
  {
    type: "function",
    name: "weaponDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "class", type: "uint8" },
      { name: "damageType", type: "uint8" },
      { name: "techTier", type: "uint256" },
      { name: "requiredLevel", type: "uint256" },
      { name: "requiredTechTier", type: "uint256" },
      { name: "minDamage", type: "uint256" },
      { name: "maxDamage", type: "uint256" },
      { name: "attackSpeed", type: "uint256" },
      { name: "critChanceBps", type: "uint256" },
      { name: "critMultiplierBps", type: "uint256" },
      { name: "accuracyBps", type: "uint256" },
      { name: "range", type: "uint256" },
      { name: "maxDurability", type: "uint256" },
      { name: "armorPenBps", type: "uint256" },
      { name: "blockChanceBps", type: "uint256" },
      { name: "lifeStealBps", type: "uint256" },
      { name: "energyCost", type: "uint256" },
      { name: "heatGeneration", type: "uint256" },
      { name: "stability", type: "uint256" },
      { name: "cooldownMs", type: "uint256" },
      { name: "projectileSpeed", type: "uint256" },
      { name: "aoeRadius", type: "uint256" },
      { name: "enchantmentSlots", type: "uint256" },
      { name: "materiaSlots", type: "uint256" },
      { name: "visualVariant", type: "uint256" },
      { name: "maxUpgradeLevel", type: "uint256" },
      { name: "familySetId", type: "uint256" },
      { name: "enabled", type: "bool" }
    ]
  }
];

const cityComponentsAbi = [
  {
    type: "function",
    name: "componentDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "category", type: "uint8" },
      { name: "rarityTier", type: "uint8" },
      { name: "techTier", type: "uint8" },
      { name: "enabled", type: "bool" }
    ]
  }
];

const cityBlueprintsAbi = [
  {
    type: "function",
    name: "blueprintDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "rarityTier", type: "uint8" },
      { name: "techTier", type: "uint8" },
      { name: "factionLock", type: "uint8" },
      { name: "districtLock", type: "uint8" },
      { name: "enabled", type: "bool" }
    ]
  }
];

const cityEnchantmentsAbi = [
  {
    type: "function",
    name: "enchantmentDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "category", type: "uint8" },
      { name: "rarityTier", type: "uint8" },
      { name: "maxLevel", type: "uint8" },
      { name: "enabled", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "enchantmentBonusesOf",
    stateMutability: "view",
    inputs: [
      { name: "enchantmentId", type: "uint256" },
      { name: "level", type: "uint256" }
    ],
    outputs: [
      { name: "minDamageBonus", type: "int256" },
      { name: "maxDamageBonus", type: "int256" },
      { name: "attackSpeedBonus", type: "int256" },
      { name: "critChanceBpsBonus", type: "int256" },
      { name: "critMultiplierBpsBonus", type: "int256" },
      { name: "accuracyBpsBonus", type: "int256" },
      { name: "rangeBonus", type: "int256" },
      { name: "maxDurabilityBonus", type: "int256" },
      { name: "armorPenBpsBonus", type: "int256" },
      { name: "blockChanceBpsBonus", type: "int256" },
      { name: "lifeStealBpsBonus", type: "int256" },
      { name: "energyCostBonus", type: "int256" },
      { name: "heatGenerationBonus", type: "int256" },
      { name: "stabilityBonus", type: "int256" },
      { name: "cooldownMsBonus", type: "int256" },
      { name: "projectileSpeedBonus", type: "int256" },
      { name: "aoeRadiusBonus", type: "int256" },
      { name: "enchantmentSlotsBonus", type: "int256" },
      { name: "materiaSlotsBonus", type: "int256" }
    ]
  }
];

const cityEnchantmentItemsAbi = [
  {
    type: "function",
    name: "enchantmentItemDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [
      { name: "itemId", type: "uint256" },
      { name: "enchantmentDefinitionId", type: "uint256" },
      { name: "level", type: "uint8" },
      { name: "rarityTier", type: "uint8" },
      { name: "burnOnUse", type: "bool" },
      { name: "enabled", type: "bool" }
    ]
  }
];

const cityMateriaAbi = [
  {
    type: "function",
    name: "materiaDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "category", type: "uint8" },
      { name: "element", type: "uint8" },
      { name: "rarityTier", type: "uint8" },
      { name: "maxLevel", type: "uint8" },
      { name: "enabled", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "materiaBonusesOf",
    stateMutability: "view",
    inputs: [
      { name: "materiaId", type: "uint256" },
      { name: "level", type: "uint256" }
    ],
    outputs: [
      { name: "minDamageBonus", type: "int256" },
      { name: "maxDamageBonus", type: "int256" },
      { name: "attackSpeedBonus", type: "int256" },
      { name: "critChanceBpsBonus", type: "int256" },
      { name: "critMultiplierBpsBonus", type: "int256" },
      { name: "accuracyBpsBonus", type: "int256" },
      { name: "rangeBonus", type: "int256" },
      { name: "maxDurabilityBonus", type: "int256" },
      { name: "armorPenBpsBonus", type: "int256" },
      { name: "blockChanceBpsBonus", type: "int256" },
      { name: "lifeStealBpsBonus", type: "int256" },
      { name: "energyCostBonus", type: "int256" },
      { name: "heatGenerationBonus", type: "int256" },
      { name: "stabilityBonus", type: "int256" },
      { name: "cooldownMsBonus", type: "int256" },
      { name: "projectileSpeedBonus", type: "int256" },
      { name: "aoeRadiusBonus", type: "int256" },
      { name: "enchantmentSlotsBonus", type: "int256" },
      { name: "materiaSlotsBonus", type: "int256" }
    ]
  }
];

const cityMateriaItemsAbi = [
  {
    type: "function",
    name: "materiaItemDefinitionOf",
    stateMutability: "view",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [
      { name: "itemId", type: "uint256" },
      { name: "materiaDefinitionId", type: "uint256" },
      { name: "level", type: "uint8" },
      { name: "rarityTier", type: "uint8" },
      { name: "burnOnUse", type: "bool" },
      { name: "enabled", type: "bool" }
    ]
  }
];

const cityCraftingAbi = [
  {
    type: "function",
    name: "recipeOf",
    stateMutability: "view",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "outputKind", type: "uint8" },
      { name: "outputId", type: "uint256" },
      { name: "outputAmount", type: "uint256" },
      { name: "requiredFaction", type: "uint256" },
      { name: "requiredDistrictKind", type: "uint256" },
      { name: "requiredBuildingId", type: "uint256" },
      { name: "requiredTechTier", type: "uint256" },
      { name: "rarityTier", type: "uint256" },
      { name: "frameTier", type: "uint256" },
      { name: "requiresDiscovery", type: "bool" },
      { name: "enabled", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "getRecipeCosts",
    stateMutability: "view",
    inputs: [{ name: "recipeId", type: "uint256" }],
    outputs: [{ name: "resourceCosts", type: "uint256[10]" }]
  }
];

function normalizeWeaponDefinition(result) {
  if (Array.isArray(result)) {
    return {
      weaponDefinitionId: Number(result[0]),
      name: result[1],
      weaponClass: Number(result[2]),
      damageType: Number(result[3]),
      techTier: Number(result[4]),
      requiredLevel: Number(result[5]),
      requiredTechTier: Number(result[6]),
      minDamage: Number(result[7]),
      maxDamage: Number(result[8]),
      attackSpeed: Number(result[9]),
      critChanceBps: Number(result[10]),
      critMultiplierBps: Number(result[11]),
      accuracyBps: Number(result[12]),
      range: Number(result[13]),
      maxDurability: Number(result[14]),
      armorPenBps: Number(result[15]),
      blockChanceBps: Number(result[16]),
      lifeStealBps: Number(result[17]),
      energyCost: Number(result[18]),
      heatGeneration: Number(result[19]),
      stability: Number(result[20]),
      cooldownMs: Number(result[21]),
      projectileSpeed: Number(result[22]),
      aoeRadius: Number(result[23]),
      enchantmentSlots: Number(result[24]),
      materiaSlots: Number(result[25]),
      visualVariant: Number(result[26]),
      maxUpgradeLevel: Number(result[27]),
      familySetId: Number(result[28]),
      enabled: Boolean(result[29]),
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityWeapons."
    };
  }

  return {
    weaponDefinitionId: Number(result.id),
    name: result.name,
    weaponClass: Number(result.class),
    damageType: Number(result.damageType),
    techTier: Number(result.techTier),
    requiredLevel: Number(result.requiredLevel),
    requiredTechTier: Number(result.requiredTechTier),
    minDamage: Number(result.minDamage),
    maxDamage: Number(result.maxDamage),
    attackSpeed: Number(result.attackSpeed),
    critChanceBps: Number(result.critChanceBps),
    critMultiplierBps: Number(result.critMultiplierBps),
    accuracyBps: Number(result.accuracyBps),
    range: Number(result.range),
    maxDurability: Number(result.maxDurability),
    armorPenBps: Number(result.armorPenBps),
    blockChanceBps: Number(result.blockChanceBps),
    lifeStealBps: Number(result.lifeStealBps),
    energyCost: Number(result.energyCost),
    heatGeneration: Number(result.heatGeneration),
    stability: Number(result.stability),
    cooldownMs: Number(result.cooldownMs),
    projectileSpeed: Number(result.projectileSpeed),
    aoeRadius: Number(result.aoeRadius),
    enchantmentSlots: Number(result.enchantmentSlots),
    materiaSlots: Number(result.materiaSlots),
    visualVariant: Number(result.visualVariant),
    maxUpgradeLevel: Number(result.maxUpgradeLevel),
    familySetId: Number(result.familySetId),
    enabled: Boolean(result.enabled),
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityWeapons."
  };
}

function normalizeComponentDefinition(result) {
  if (Array.isArray(result)) {
    return {
      componentDefinitionId: Number(result[0]),
      name: result[1],
      category: Number(result[2]),
      rarityTier: Number(result[3]),
      techTier: Number(result[4]),
      enabled: Boolean(result[5]),
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityComponents."
    };
  }

  return {
    componentDefinitionId: Number(result.id),
    name: result.name,
    category: Number(result.category),
    rarityTier: Number(result.rarityTier),
    techTier: Number(result.techTier),
    enabled: Boolean(result.enabled),
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityComponents."
  };
}

function normalizeBlueprintDefinition(result) {
  if (Array.isArray(result)) {
    return {
      blueprintDefinitionId: Number(result[0]),
      name: result[1],
      rarityTier: Number(result[2]),
      techTier: Number(result[3]),
      factionLock: Number(result[4]),
      districtLock: Number(result[5]),
      enabled: Boolean(result[6]),
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityBlueprints."
    };
  }

  return {
    blueprintDefinitionId: Number(result.id),
    name: result.name,
    rarityTier: Number(result.rarityTier),
    techTier: Number(result.techTier),
    factionLock: Number(result.factionLock),
    districtLock: Number(result.districtLock),
    enabled: Boolean(result.enabled),
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityBlueprints."
  };
}

function normalizeEnchantmentDefinition(result) {
  if (Array.isArray(result)) {
    return {
      enchantmentDefinitionId: Number(result[0]),
      name: result[1],
      category: Number(result[2]),
      rarityTier: Number(result[3]),
      maxLevel: Number(result[4]),
      enabled: Boolean(result[5]),
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityEnchantments."
    };
  }

  return {
    enchantmentDefinitionId: Number(result.id),
    name: result.name,
    category: Number(result.category),
    rarityTier: Number(result.rarityTier),
    maxLevel: Number(result.maxLevel),
    enabled: Boolean(result.enabled),
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityEnchantments."
  };
}

function normalizeMateriaDefinition(result) {
  if (Array.isArray(result)) {
    return {
      materiaDefinitionId: Number(result[0]),
      name: result[1],
      category: Number(result[2]),
      element: Number(result[3]),
      rarityTier: Number(result[4]),
      maxLevel: Number(result[5]),
      enabled: Boolean(result[6]),
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityMateria."
    };
  }

  return {
    materiaDefinitionId: Number(result.id),
    name: result.name,
    category: Number(result.category),
    element: Number(result.element),
    rarityTier: Number(result.rarityTier),
    maxLevel: Number(result.maxLevel),
    enabled: Boolean(result.enabled),
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityMateria."
  };
}

function normalizeBonusTuple(result) {
  const keys = [
    "minDamageBonus",
    "maxDamageBonus",
    "attackSpeedBonus",
    "critChanceBpsBonus",
    "critMultiplierBpsBonus",
    "accuracyBpsBonus",
    "rangeBonus",
    "maxDurabilityBonus",
    "armorPenBpsBonus",
    "blockChanceBpsBonus",
    "lifeStealBpsBonus",
    "energyCostBonus",
    "heatGenerationBonus",
    "stabilityBonus",
    "cooldownMsBonus",
    "projectileSpeedBonus",
    "aoeRadiusBonus",
    "enchantmentSlotsBonus",
    "materiaSlotsBonus"
  ];

  const values = {};
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const rawValue = Array.isArray(result) ? result[i] : result[key];
    const value = Number(rawValue ?? 0);
    if (value !== 0) {
      values[key] = value;
    }
  }

  return values;
}

function normalizeEnchantmentItemDefinition(result, fallbackName) {
  if (Array.isArray(result)) {
    return {
      enchantmentItemDefinitionId: Number(result[0]),
      enchantmentDefinitionId: Number(result[1]),
      level: Number(result[2]),
      rarityTier: Number(result[3]),
      burnOnUse: Boolean(result[4]),
      enabled: Boolean(result[5]),
      name: fallbackName,
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityEnchantmentItems."
    };
  }

  return {
    enchantmentItemDefinitionId: Number(result.itemId),
    enchantmentDefinitionId: Number(result.enchantmentDefinitionId),
    level: Number(result.level),
    rarityTier: Number(result.rarityTier),
    burnOnUse: Boolean(result.burnOnUse),
    enabled: Boolean(result.enabled),
    name: fallbackName,
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityEnchantmentItems."
  };
}

function normalizeMateriaItemDefinition(result, fallbackName) {
  if (Array.isArray(result)) {
    return {
      materiaItemDefinitionId: Number(result[0]),
      materiaDefinitionId: Number(result[1]),
      level: Number(result[2]),
      rarityTier: Number(result[3]),
      burnOnUse: Boolean(result[4]),
      enabled: Boolean(result[5]),
      name: fallbackName,
      metadataRevision: 1,
      verificationStatus: "confirmed",
      notes: "Synced from live CityMateriaItems."
    };
  }

  return {
    materiaItemDefinitionId: Number(result.itemId),
    materiaDefinitionId: Number(result.materiaDefinitionId),
    level: Number(result.level),
    rarityTier: Number(result.rarityTier),
    burnOnUse: Boolean(result.burnOnUse),
    enabled: Boolean(result.enabled),
    name: fallbackName,
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityMateriaItems."
  };
}

function buildRecipeName(recipeId, outputKind, outputId, outputName = null) {
  if (outputKind === 4 && outputName) return `${outputName} Weapon Recipe`;
  if (outputKind === 2 && outputName) return `${outputName} Recipe`;
  if (outputKind === 3 && outputName) return `${outputName} Recipe`;

  if (outputKind === 4) return `Weapon Recipe ${outputId}`;
  if (outputKind === 2) return `Component Recipe ${outputId}`;
  if (outputKind === 3) return `Blueprint Recipe ${outputId}`;
  return `Recipe ${recipeId}`;
}

function normalizeRecipeDefinition(recipe, rawCosts, outputName = null) {
  const rawArray = Array.from(rawCosts, (x) => Number(x));

  const costs = rawArray
    .map((amount, resourceId) => ({ resourceId, amount }))
    .filter((entry) => entry.amount > 0);

  const recipeId = Number(Array.isArray(recipe) ? recipe[0] : recipe.id);
  const outputKind = Number(Array.isArray(recipe) ? recipe[1] : recipe.outputKind);
  const outputId = Number(Array.isArray(recipe) ? recipe[2] : recipe.outputId);

  return {
    recipeId,
    name: buildRecipeName(recipeId, outputKind, outputId, outputName),
    outputKind,
    outputId,
    outputAmount: Number(Array.isArray(recipe) ? recipe[3] : recipe.outputAmount),
    requiredFaction: Number(Array.isArray(recipe) ? recipe[4] : recipe.requiredFaction),
    requiredDistrictKind: Number(Array.isArray(recipe) ? recipe[5] : recipe.requiredDistrictKind),
    requiredBuildingId: Number(Array.isArray(recipe) ? recipe[6] : recipe.requiredBuildingId),
    requiredTechTier: Number(Array.isArray(recipe) ? recipe[7] : recipe.requiredTechTier),
    rarityTier: Number(Array.isArray(recipe) ? recipe[8] : recipe.rarityTier),
    frameTier: Number(Array.isArray(recipe) ? recipe[9] : recipe.frameTier),
    requiresDiscovery: Boolean(Array.isArray(recipe) ? recipe[10] : recipe.requiresDiscovery),
    enabled: Boolean(Array.isArray(recipe) ? recipe[11] : recipe.enabled),
    costs,
    resourceCostsRaw: rawArray,
    metadataRevision: 1,
    verificationStatus: "confirmed",
    notes: "Synced from live CityCrafting."
  };
}

function getEnchantmentItemFallbackName(itemId) {
  const map = {
    1: "Fire Edge Item",
    2: "Precision Sight Item",
    3: "Durability Seal Item"
  };
  return map[itemId] || `Enchantment Item ${itemId}`;
}

function getMateriaItemFallbackName(itemId) {
  const map = {
    1: "Fire Materia Item",
    2: "Resonance Materia Item",
    3: "Stability Materia Item"
  };
  return map[itemId] || `Materia Item ${itemId}`;
}

async function resolveRecipeOutputName(client, network, outputKind, outputId) {
  if (outputKind === 4) {
    const result = await readContractWithRetry(client, {
      address: CONTRACTS[network].cityWeapons,
      abi: cityWeaponsAbi,
      functionName: "weaponDefinitionOf",
      args: [BigInt(outputId)]
    });
    return Array.isArray(result) ? result[1] : result.name;
  }

  if (outputKind === 2) {
    const result = await readContractWithRetry(client, {
      address: CONTRACTS[network].cityComponents,
      abi: cityComponentsAbi,
      functionName: "componentDefinitionOf",
      args: [BigInt(outputId)]
    });
    return Array.isArray(result) ? result[1] : result.name;
  }

  if (outputKind === 3) {
    const result = await readContractWithRetry(client, {
      address: CONTRACTS[network].cityBlueprints,
      abi: cityBlueprintsAbi,
      functionName: "blueprintDefinitionOf",
      args: [BigInt(outputId)]
    });
    return Array.isArray(result) ? result[1] : result.name;
  }

  return null;
}

async function syncWeaponDefinition(client, network, id) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityWeapons,
    abi: cityWeaponsAbi,
    functionName: "weaponDefinitionOf",
    args: [BigInt(id)]
  });

  const normalized = normalizeWeaponDefinition(result);
  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "weapons",
    `${pad3(id)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "weaponDefinition",
    ...normalized
  });
}

async function syncComponentDefinition(client, network, id) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityComponents,
    abi: cityComponentsAbi,
    functionName: "componentDefinitionOf",
    args: [BigInt(id)]
  });

  const normalized = normalizeComponentDefinition(result);
  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "components",
    `${pad3(id)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "componentDefinition",
    ...normalized
  });
}

async function syncBlueprintDefinition(client, network, id) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityBlueprints,
    abi: cityBlueprintsAbi,
    functionName: "blueprintDefinitionOf",
    args: [BigInt(id)]
  });

  const normalized = normalizeBlueprintDefinition(result);
  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "blueprints",
    `${pad3(id)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "blueprintDefinition",
    ...normalized
  });
}

async function syncEnchantmentDefinition(client, network, id) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityEnchantments,
    abi: cityEnchantmentsAbi,
    functionName: "enchantmentDefinitionOf",
    args: [BigInt(id)]
  });

  const normalized = normalizeEnchantmentDefinition(result);
  const bonuses = [];

  for (let level = 1; level <= normalized.maxLevel; level += 1) {
    const bonusResult = await readContractWithRetry(client, {
      address: CONTRACTS[network].cityEnchantments,
      abi: cityEnchantmentsAbi,
      functionName: "enchantmentBonusesOf",
      args: [BigInt(id), BigInt(level)]
    });

    bonuses.push({
      level,
      values: normalizeBonusTuple(bonusResult)
    });
  }

  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "enchantments",
    `${pad3(id)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "enchantmentDefinition",
    ...normalized,
    bonuses
  });
}

async function syncEnchantmentItemDefinition(client, network, itemId) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityEnchantmentItems,
    abi: cityEnchantmentItemsAbi,
    functionName: "enchantmentItemDefinitionOf",
    args: [BigInt(itemId)]
  });

  const normalized = normalizeEnchantmentItemDefinition(
    result,
    getEnchantmentItemFallbackName(itemId)
  );

  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "enchantment-items",
    `${pad3(itemId)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "enchantmentItemDefinition",
    ...normalized
  });
}

async function syncMateriaDefinition(client, network, id) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityMateria,
    abi: cityMateriaAbi,
    functionName: "materiaDefinitionOf",
    args: [BigInt(id)]
  });

  const normalized = normalizeMateriaDefinition(result);
  const bonuses = [];

  for (let level = 1; level <= normalized.maxLevel; level += 1) {
    const bonusResult = await readContractWithRetry(client, {
      address: CONTRACTS[network].cityMateria,
      abi: cityMateriaAbi,
      functionName: "materiaBonusesOf",
      args: [BigInt(id), BigInt(level)]
    });

    bonuses.push({
      level,
      values: normalizeBonusTuple(bonusResult)
    });
  }

  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "materia",
    `${pad3(id)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "materiaDefinition",
    ...normalized,
    bonuses
  });
}

async function syncMateriaItemDefinition(client, network, itemId) {
  const result = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityMateriaItems,
    abi: cityMateriaItemsAbi,
    functionName: "materiaItemDefinitionOf",
    args: [BigInt(itemId)]
  });

  const normalized = normalizeMateriaItemDefinition(
    result,
    getMateriaItemFallbackName(itemId)
  );

  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "materia-items",
    `${pad3(itemId)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "materiaItemDefinition",
    ...normalized
  });
}

async function syncRecipeDefinition(client, network, recipeId) {
  const recipe = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityCrafting,
    abi: cityCraftingAbi,
    functionName: "recipeOf",
    args: [BigInt(recipeId)]
  });

  const rawCostsResult = await readContractWithRetry(client, {
    address: CONTRACTS[network].cityCrafting,
    abi: cityCraftingAbi,
    functionName: "getRecipeCosts",
    args: [BigInt(recipeId)]
  });

  let rawCosts;
  if (Array.isArray(rawCostsResult)) {
    rawCosts = Array.isArray(rawCostsResult[0]) ? rawCostsResult[0] : rawCostsResult;
  } else if (rawCostsResult?.resourceCosts) {
    rawCosts = rawCostsResult.resourceCosts;
  } else {
    rawCosts = rawCostsResult;
  }

  const outputKind = Number(Array.isArray(recipe) ? recipe[1] : recipe.outputKind);
  const outputId = Number(Array.isArray(recipe) ? recipe[2] : recipe.outputId);
  const outputName = await resolveRecipeOutputName(client, network, outputKind, outputId);

  const normalized = normalizeRecipeDefinition(recipe, rawCosts, outputName);
  const slug = slugify(normalized.name);
  const filePath = path.join(
    "data",
    "definitions",
    "recipes",
    `${pad3(recipeId)}-${slug}.json`
  );

  await writeJson(filePath, {
    schemaVersion: "1.0.0",
    kind: "recipeDefinition",
    ...normalized
  });
}

async function syncRange(from, to, fn) {
  for (let id = from; id <= to; id += 1) {
    await fn(id);
  }
}

function printUsage() {
  console.log(`
Usage:

  npm run sync -- --type=weapon-definition --id=4
  npm run sync -- --type=component-definition --id=10
  npm run sync -- --type=blueprint-definition --id=4
  npm run sync -- --type=enchantment-definition --id=1
  npm run sync -- --type=enchantment-item-definition --id=1
  npm run sync -- --type=materia-definition --id=1
  npm run sync -- --type=materia-item-definition --id=1
  npm run sync -- --type=recipe --id=104

  npm run sync -- --type=weapon-definition-range --from=4 --to=6
  npm run sync -- --type=component-definition-range --from=1 --to=9
  npm run sync -- --type=blueprint-definition-range --from=1 --to=3
  npm run sync -- --type=enchantment-definition-range --from=1 --to=3
  npm run sync -- --type=enchantment-item-definition-range --from=1 --to=3
  npm run sync -- --type=materia-definition-range --from=1 --to=3
  npm run sync -- --type=materia-item-definition-range --from=1 --to=3
  npm run sync -- --type=recipe-range --from=104 --to=106

  npm run sync -- --type=all-core

all-core syncs:
  - components 1..9
  - blueprints 1..3
  - enchantments 1..3
  - enchantment-items 1..3
  - materia 1..3
  - materia-items 1..3
  - weapons 1..6
  - recipes 1..9 and 101..106
`);
}

const network = getArgValue("--network", "base");
const type = getArgValue("--type", null);

if (!type) {
  printUsage();
  process.exit(1);
}

const client = getClient(network);

try {
  if (type === "weapon-definition") {
    const id = Number(requireArg("--id"));
    await syncWeaponDefinition(client, network, id);
  } else if (type === "component-definition") {
    const id = Number(requireArg("--id"));
    await syncComponentDefinition(client, network, id);
  } else if (type === "blueprint-definition") {
    const id = Number(requireArg("--id"));
    await syncBlueprintDefinition(client, network, id);
  } else if (type === "enchantment-definition") {
    const id = Number(requireArg("--id"));
    await syncEnchantmentDefinition(client, network, id);
  } else if (type === "enchantment-item-definition") {
    const id = Number(requireArg("--id"));
    await syncEnchantmentItemDefinition(client, network, id);
  } else if (type === "materia-definition") {
    const id = Number(requireArg("--id"));
    await syncMateriaDefinition(client, network, id);
  } else if (type === "materia-item-definition") {
    const id = Number(requireArg("--id"));
    await syncMateriaItemDefinition(client, network, id);
  } else if (type === "recipe") {
    const id = Number(requireArg("--id"));
    await syncRecipeDefinition(client, network, id);
  } else if (type === "weapon-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncWeaponDefinition(client, network, id));
  } else if (type === "component-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncComponentDefinition(client, network, id));
  } else if (type === "blueprint-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncBlueprintDefinition(client, network, id));
  } else if (type === "enchantment-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncEnchantmentDefinition(client, network, id));
  } else if (type === "enchantment-item-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncEnchantmentItemDefinition(client, network, id));
  } else if (type === "materia-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncMateriaDefinition(client, network, id));
  } else if (type === "materia-item-definition-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncMateriaItemDefinition(client, network, id));
  } else if (type === "recipe-range") {
    const from = Number(requireArg("--from"));
    const to = Number(requireArg("--to"));
    await syncRange(from, to, (id) => syncRecipeDefinition(client, network, id));
  } else if (type === "all-core") {
    await syncRange(1, 9, (id) => syncComponentDefinition(client, network, id));
    await syncRange(1, 3, (id) => syncBlueprintDefinition(client, network, id));
    await syncRange(1, 3, (id) => syncEnchantmentDefinition(client, network, id));
    await syncRange(1, 3, (id) => syncEnchantmentItemDefinition(client, network, id));
    await syncRange(1, 3, (id) => syncMateriaDefinition(client, network, id));
    await syncRange(1, 3, (id) => syncMateriaItemDefinition(client, network, id));
    await syncRange(1, 6, (id) => syncWeaponDefinition(client, network, id));
    await syncRange(1, 9, (id) => syncRecipeDefinition(client, network, id));
    await syncRange(101, 106, (id) => syncRecipeDefinition(client, network, id));
  } else {
    throw new Error(`Unsupported sync type: ${type}`);
  }

  console.log("\nDone.");
} catch (error) {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
}