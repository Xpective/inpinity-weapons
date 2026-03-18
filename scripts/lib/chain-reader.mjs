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
      console.warn(
        `Rate limit hit. Retry ${attempt + 1}/${retries} after ${delay}ms...`
      );
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