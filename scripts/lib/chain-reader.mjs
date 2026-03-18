import { createPublicClient, http } from "viem";
import { RPC_CONFIG } from "../config/rpc.mjs";

const clients = new Map();

function getClient(network = "base") {
  if (clients.has(network)) {
    return clients.get(network);
  }

  const config = RPC_CONFIG[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

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

export async function readComponentDefinition({
  network = "base",
  contractAddress,
  id
}) {
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
    {
      retries: 5,
      baseDelayMs: 1500
    }
  );

  return normalizeComponentResult(result);
}

export async function readBlueprintDefinition({
  network = "base",
  contractAddress,
  id
}) {
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
    {
      retries: 5,
      baseDelayMs: 1500
    }
  );

  return normalizeBlueprintResult(result);
}

export async function readEnchantmentItemDefinition({
  network = "base",
  contractAddress,
  itemId
}) {
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
    {
      retries: 5,
      baseDelayMs: 1500
    }
  );

  return normalizeEnchantmentItemResult(result);
}