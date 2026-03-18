import { createPublicClient, http } from "viem";
import { RPC_CONFIG } from "../config/rpc.mjs";

const clients = new Map();

function getClient(network = "base") {
  if (clients.has(network)) return clients.get(network);

  const config = RPC_CONFIG[network];
  if (!config) throw new Error(`Unknown network: ${network}`);

  const client = createPublicClient({
    transport: http(config.rpcUrl)
  });

  clients.set(network, client);
  return client;
}

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

const cityWeaponsAbi = [
  {
    type: "function",
    name: "weaponInstanceOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "weaponDefinitionId", type: "uint256" },
      { name: "rarityTier", type: "uint256" },
      { name: "frameTier", type: "uint256" },
      { name: "durability", type: "uint256" },
      { name: "upgradeLevel", type: "uint256" },
      { name: "metadataRevision", type: "uint256" },
      { name: "originPlotId", type: "uint256" },
      { name: "originFaction", type: "uint256" },
      { name: "originDistrictKind", type: "uint256" },
      { name: "craftedAt", type: "uint256" },
      { name: "visualVariant", type: "uint256" },
      { name: "resonanceType", type: "uint8" },
      { name: "craftSeed", type: "bytes32" },
      { name: "provenanceHash", type: "bytes32" },
      { name: "genesisEra", type: "bool" },
      { name: "usedAether", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  }
];

function normalizeComponentResult(result) {
  if (Array.isArray(result)) {
    return {
      id: Number(result[0]),
      name: result[1],
      category: Number(result[2]),
      rarityTier: Number(result[3]),
      techTier: Number(result[4]),
      enabled: Boolean(result[5])
    };
  }

  return {
    id: Number(result.id),
    name: result.name,
    category: Number(result.category),
    rarityTier: Number(result.rarityTier),
    techTier: Number(result.techTier),
    enabled: Boolean(result.enabled)
  };
}

function normalizeBlueprintResult(result) {
  if (Array.isArray(result)) {
    return {
      id: Number(result[0]),
      name: result[1],
      rarityTier: Number(result[2]),
      techTier: Number(result[3]),
      factionLock: Number(result[4]),
      districtLock: Number(result[5]),
      enabled: Boolean(result[6])
    };
  }

  return {
    id: Number(result.id),
    name: result.name,
    rarityTier: Number(result.rarityTier),
    techTier: Number(result.techTier),
    factionLock: Number(result.factionLock),
    districtLock: Number(result.districtLock),
    enabled: Boolean(result.enabled)
  };
}

function normalizeEnchantmentItemResult(result) {
  if (Array.isArray(result)) {
    return {
      itemId: Number(result[0]),
      enchantmentDefinitionId: Number(result[1]),
      level: Number(result[2]),
      rarityTier: Number(result[3]),
      burnOnUse: Boolean(result[4]),
      enabled: Boolean(result[5])
    };
  }

  return {
    itemId: Number(result.itemId),
    enchantmentDefinitionId: Number(result.enchantmentDefinitionId),
    level: Number(result.level),
    rarityTier: Number(result.rarityTier),
    burnOnUse: Boolean(result.burnOnUse),
    enabled: Boolean(result.enabled)
  };
}

function normalizeMateriaItemResult(result) {
  if (Array.isArray(result)) {
    return {
      itemId: Number(result[0]),
      materiaDefinitionId: Number(result[1]),
      level: Number(result[2]),
      rarityTier: Number(result[3]),
      burnOnUse: Boolean(result[4]),
      enabled: Boolean(result[5])
    };
  }

  return {
    itemId: Number(result.itemId),
    materiaDefinitionId: Number(result.materiaDefinitionId),
    level: Number(result.level),
    rarityTier: Number(result.rarityTier),
    burnOnUse: Boolean(result.burnOnUse),
    enabled: Boolean(result.enabled)
  };
}

function normalizeWeaponInstanceResult(result) {
  if (Array.isArray(result)) {
    return {
      tokenId: Number(result[0]),
      weaponDefinitionId: Number(result[1]),
      rarityTier: Number(result[2]),
      frameTier: Number(result[3]),
      durability: Number(result[4]),
      upgradeLevel: Number(result[5]),
      metadataRevision: Number(result[6]),
      originPlotId: Number(result[7]),
      originFaction: Number(result[8]),
      originDistrictKind: Number(result[9]),
      craftedAt: Number(result[10]),
      visualVariant: Number(result[11]),
      resonanceType: Number(result[12]),
      craftSeed: result[13],
      provenanceHash: result[14],
      genesisEra: Boolean(result[15]),
      usedAether: Boolean(result[16])
    };
  }

  return {
    tokenId: Number(result.tokenId),
    weaponDefinitionId: Number(result.weaponDefinitionId),
    rarityTier: Number(result.rarityTier),
    frameTier: Number(result.frameTier),
    durability: Number(result.durability),
    upgradeLevel: Number(result.upgradeLevel),
    metadataRevision: Number(result.metadataRevision),
    originPlotId: Number(result.originPlotId),
    originFaction: Number(result.originFaction),
    originDistrictKind: Number(result.originDistrictKind),
    craftedAt: Number(result.craftedAt),
    visualVariant: Number(result.visualVariant),
    resonanceType: Number(result.resonanceType),
    craftSeed: result.craftSeed,
    provenanceHash: result.provenanceHash,
    genesisEra: Boolean(result.genesisEra),
    usedAether: Boolean(result.usedAether)
  };
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
  const baseDelayMs = options.baseDelayMs ?? 1200;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await client.readContract(params);
    } catch (error) {
      if (!isRateLimitError(error) || attempt === retries) throw error;
      const delay = baseDelayMs * (attempt + 1);
      console.warn(`Rate limit hit. Retry ${attempt + 1}/${retries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error("Unreachable retry state.");
}

export async function readComponentDefinition({ network = "base", contractAddress, id }) {
  const client = getClient(network);
  await sleep(250);

  const result = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityComponentsAbi,
      functionName: "componentDefinitionOf",
      args: [BigInt(id)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  return normalizeComponentResult(result);
}

export async function readBlueprintDefinition({ network = "base", contractAddress, id }) {
  const client = getClient(network);
  await sleep(250);

  const result = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityBlueprintsAbi,
      functionName: "blueprintDefinitionOf",
      args: [BigInt(id)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  return normalizeBlueprintResult(result);
}

export async function readEnchantmentItemDefinition({ network = "base", contractAddress, itemId }) {
  const client = getClient(network);
  await sleep(250);

  const result = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityEnchantmentItemsAbi,
      functionName: "enchantmentItemDefinitionOf",
      args: [BigInt(itemId)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  return normalizeEnchantmentItemResult(result);
}

export async function readMateriaItemDefinition({ network = "base", contractAddress, itemId }) {
  const client = getClient(network);
  await sleep(250);

  const result = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityMateriaItemsAbi,
      functionName: "materiaItemDefinitionOf",
      args: [BigInt(itemId)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  return normalizeMateriaItemResult(result);
}

export async function readWeaponInstance({ network = "base", contractAddress, tokenId }) {
  const client = getClient(network);
  await sleep(250);

  const instance = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityWeaponsAbi,
      functionName: "weaponInstanceOf",
      args: [BigInt(tokenId)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  const owner = await readContractWithRetry(
    client,
    {
      address: contractAddress,
      abi: cityWeaponsAbi,
      functionName: "ownerOf",
      args: [BigInt(tokenId)]
    },
    { retries: 5, baseDelayMs: 1500 }
  );

  return {
    ...normalizeWeaponInstanceResult(instance),
    owner
  };
}