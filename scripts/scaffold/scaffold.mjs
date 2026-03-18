import fs from "node:fs/promises";
import path from "node:path";

function getArgValue(name, fallback = null) {
  const prefix = `${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  if (!entry) return fallback;
  return entry.slice(prefix.length);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonIfMissing(filePath, data, { force = false } = {}) {
  await ensureDir(path.dirname(filePath));

  if (!force && (await fileExists(filePath))) {
    console.log(`⏭️  Exists, skipped: ${filePath}`);
    return false;
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote: ${filePath}`);
  return true;
}

function requireArg(name) {
  const value = getArgValue(name, null);
  if (value === null || value === "") {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function intArg(name, fallback = null) {
  const value = getArgValue(name, fallback === null ? null : String(fallback));
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric argument for ${name}: ${value}`);
  }
  return parsed;
}

function buildWeaponDefinition({
  weaponId,
  weaponName,
  weaponSlug
}) {
  return {
    schemaVersion: "1.0.0",
    kind: "weaponDefinition",
    weaponDefinitionId: weaponId,
    slug: weaponSlug,
    name: weaponName,
    weaponClass: 0,
    damageType: 0,
    techTier: 1,
    requiredLevel: 1,
    requiredTechTier: 1,
    minDamage: 1,
    maxDamage: 2,
    attackSpeed: 1,
    critChanceBps: 0,
    critMultiplierBps: 15000,
    accuracyBps: 9000,
    range: 1,
    maxDurability: 100,
    armorPenBps: 0,
    blockChanceBps: 0,
    lifeStealBps: 0,
    energyCost: 0,
    heatGeneration: 0,
    stability: 100,
    cooldownMs: 1000,
    projectileSpeed: 0,
    aoeRadius: 0,
    enchantmentSlots: 0,
    materiaSlots: 0,
    visualVariant: 1,
    maxUpgradeLevel: 5,
    familySetId: weaponId,
    enabled: false,
    verificationStatus: "draft",
    notes: "Scaffolded weapon definition. Fill with live onchain-compatible values before use."
  };
}

function buildComponentDefinition({
  componentId,
  componentName,
  componentSlug
}) {
  return {
    schemaVersion: "1.0.0",
    kind: "componentDefinition",
    componentDefinitionId: componentId,
    slug: componentSlug,
    name: componentName,
    category: 0,
    rarityTier: 1,
    techTier: 1,
    enabled: false,
    verificationStatus: "draft",
    notes: "Scaffolded component definition. Fill with live onchain-compatible values before use."
  };
}

function buildBlueprintDefinition({
  blueprintId,
  blueprintName,
  blueprintSlug
}) {
  return {
    schemaVersion: "1.0.0",
    kind: "blueprintDefinition",
    blueprintDefinitionId: blueprintId,
    slug: blueprintSlug,
    name: blueprintName,
    rarityTier: 1,
    techTier: 1,
    factionLock: 0,
    districtLock: 0,
    enabled: false,
    verificationStatus: "draft",
    notes: "Scaffolded blueprint definition. Fill with live onchain-compatible values before use."
  };
}

function buildRecipeDefinition({
  recipeId,
  recipeName,
  outputKind,
  outputId
}) {
  return {
    schemaVersion: "1.0.0",
    kind: "recipeDefinition",
    recipeId,
    name: recipeName,
    outputKind,
    outputId,
    outputAmount: 1,
    requiredFaction: 0,
    requiredDistrictKind: 0,
    requiredBuildingId: 0,
    requiredTechTier: 1,
    rarityTier: 0,
    frameTier: 0,
    requiresDiscovery: false,
    enabled: false,
    costs: [
      {
        resourceId: 0,
        amount: 0
      }
    ],
    resourceCostsRaw: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    verificationStatus: "draft",
    notes: "Scaffolded recipe definition. Fill with live onchain-compatible values before use."
  };
}

function buildOverrideSkeleton({ name }) {
  return {
    name,
    description: "",
    display: {},
    extraAttributes: []
  };
}

function buildManifestHint({
  idField,
  id,
  name,
  assetBasePath
}) {
  return {
    [idField]: id,
    name,
    image: `https://assets.inpinity.online/city/assets/${assetBasePath}/${id}.png`,
    thumbnail: `https://assets.inpinity.online/city/assets/${assetBasePath}/${id}-thumb.png`,
    sourceHint: `assets/export/${assetBasePath}/${id}.png`,
    enabled: true
  };
}

async function scaffoldWeapon({ force = false }) {
  const weaponId = intArg("--id");
  const weaponName = requireArg("--name");
  const weaponSlug = getArgValue("--slug", slugify(weaponName));

  const defPath = path.join(
    "data",
    "definitions",
    "weapons",
    `${pad3(weaponId)}-${weaponSlug}.json`
  );
  const overridePath = path.join("data", "overrides", "weapons", `${weaponId}.json`);

  await writeJsonIfMissing(
    defPath,
    buildWeaponDefinition({ weaponId, weaponName, weaponSlug }),
    { force }
  );

  await writeJsonIfMissing(
    overridePath,
    buildOverrideSkeleton({ name: `${weaponName} #TOKEN_ID` }),
    { force }
  );

  console.log("\nManifest hint for assets/manifests/weapons-assets.json:");
  console.log(
    JSON.stringify(
      buildManifestHint({
        idField: "weaponDefinitionId",
        id: weaponId,
        name: weaponName,
        assetBasePath: "weapons"
      }),
      null,
      2
    )
  );
}

async function scaffoldComponent({ force = false }) {
  const componentId = intArg("--id");
  const componentName = requireArg("--name");
  const componentSlug = getArgValue("--slug", slugify(componentName));

  const defPath = path.join(
    "data",
    "definitions",
    "components",
    `${pad3(componentId)}-${componentSlug}.json`
  );
  const overridePath = path.join("data", "overrides", "components", `${componentId}.json`);

  await writeJsonIfMissing(
    defPath,
    buildComponentDefinition({ componentId, componentName, componentSlug }),
    { force }
  );

  await writeJsonIfMissing(
    overridePath,
    buildOverrideSkeleton({ name: componentName }),
    { force }
  );

  console.log("\nManifest hint for assets/manifests/components-assets.json:");
  console.log(
    JSON.stringify(
      buildManifestHint({
        idField: "componentDefinitionId",
        id: componentId,
        name: componentName,
        assetBasePath: "components"
      }),
      null,
      2
    )
  );
}

async function scaffoldBlueprint({ force = false }) {
  const blueprintId = intArg("--id");
  const blueprintName = requireArg("--name");
  const blueprintSlug = getArgValue("--slug", slugify(blueprintName));

  const defPath = path.join(
    "data",
    "definitions",
    "blueprints",
    `${pad3(blueprintId)}-${blueprintSlug}.json`
  );
  const overridePath = path.join("data", "overrides", "blueprints", `${blueprintId}.json`);

  await writeJsonIfMissing(
    defPath,
    buildBlueprintDefinition({ blueprintId, blueprintName, blueprintSlug }),
    { force }
  );

  await writeJsonIfMissing(
    overridePath,
    buildOverrideSkeleton({ name: blueprintName }),
    { force }
  );

  console.log("\nManifest hint for assets/manifests/blueprints-assets.json:");
  console.log(
    JSON.stringify(
      buildManifestHint({
        idField: "blueprintDefinitionId",
        id: blueprintId,
        name: blueprintName,
        assetBasePath: "blueprints"
      }),
      null,
      2
    )
  );
}

async function scaffoldRecipe({ force = false }) {
  const recipeId = intArg("--id");
  const recipeName = requireArg("--name");
  const recipeSlug = getArgValue("--slug", slugify(recipeName));
  const outputKind = intArg("--outputKind", 0);
  const outputId = intArg("--outputId", 0);

  const defPath = path.join(
    "data",
    "definitions",
    "recipes",
    `${pad3(recipeId)}-${recipeSlug}.json`
  );

  await writeJsonIfMissing(
    defPath,
    buildRecipeDefinition({ recipeId, recipeName, outputKind, outputId }),
    { force }
  );
}

async function scaffoldWeaponSet({ force = false }) {
  const weaponId = intArg("--weaponId");
  const weaponName = requireArg("--weaponName");
  const weaponSlug = getArgValue("--weaponSlug", slugify(weaponName));

  const blueprintId = intArg("--blueprintId");
  const blueprintName = getArgValue(
    "--blueprintName",
    `${weaponName} Blueprint`
  );
  const blueprintSlug = getArgValue("--blueprintSlug", slugify(blueprintName));

  const recipeId = intArg("--recipeId");

  const componentIdsRaw = getArgValue("--componentIds", "");
  const componentNamesRaw = getArgValue("--componentNames", "");
  const componentSlugsRaw = getArgValue("--componentSlugs", "");

  const componentIds = componentIdsRaw
    ? componentIdsRaw.split(",").map((x) => Number(x.trim())).filter(Boolean)
    : [];

  const componentNames = componentNamesRaw
    ? componentNamesRaw.split("|").map((x) => x.trim()).filter(Boolean)
    : [];

  const componentSlugs = componentSlugsRaw
    ? componentSlugsRaw.split(",").map((x) => x.trim()).filter(Boolean)
    : [];

  await writeJsonIfMissing(
    path.join("data", "definitions", "weapons", `${pad3(weaponId)}-${weaponSlug}.json`),
    buildWeaponDefinition({ weaponId, weaponName, weaponSlug }),
    { force }
  );

  await writeJsonIfMissing(
    path.join("data", "overrides", "weapons", `${weaponId}.json`),
    buildOverrideSkeleton({ name: `${weaponName} #TOKEN_ID` }),
    { force }
  );

  await writeJsonIfMissing(
    path.join("data", "definitions", "blueprints", `${pad3(blueprintId)}-${blueprintSlug}.json`),
    buildBlueprintDefinition({
      blueprintId,
      blueprintName,
      blueprintSlug
    }),
    { force }
  );

  await writeJsonIfMissing(
    path.join("data", "overrides", "blueprints", `${blueprintId}.json`),
    buildOverrideSkeleton({ name: blueprintName }),
    { force }
  );

  await writeJsonIfMissing(
    path.join(
      "data",
      "definitions",
      "recipes",
      `${pad3(recipeId)}-${slugify(`${weaponName} weapon recipe`)}.json`
    ),
    buildRecipeDefinition({
      recipeId,
      recipeName: `${weaponName} Weapon Recipe`,
      outputKind: 4,
      outputId: weaponId
    }),
    { force }
  );

  for (let i = 0; i < componentIds.length; i += 1) {
    const componentId = componentIds[i];
    const componentName = componentNames[i] || `Component ${componentId}`;
    const componentSlug = componentSlugs[i] || slugify(componentName);

    await writeJsonIfMissing(
      path.join(
        "data",
        "definitions",
        "components",
        `${pad3(componentId)}-${componentSlug}.json`
      ),
      buildComponentDefinition({
        componentId,
        componentName,
        componentSlug
      }),
      { force }
    );

    await writeJsonIfMissing(
      path.join("data", "overrides", "components", `${componentId}.json`),
      buildOverrideSkeleton({ name: componentName }),
      { force }
    );
  }

  console.log("\nManifest hint for assets/manifests/weapons-assets.json:");
  console.log(
    JSON.stringify(
      buildManifestHint({
        idField: "weaponDefinitionId",
        id: weaponId,
        name: weaponName,
        assetBasePath: "weapons"
      }),
      null,
      2
    )
  );

  console.log("\nManifest hint for assets/manifests/blueprints-assets.json:");
  console.log(
    JSON.stringify(
      buildManifestHint({
        idField: "blueprintDefinitionId",
        id: blueprintId,
        name: blueprintName,
        assetBasePath: "blueprints"
      }),
      null,
      2
    )
  );

  if (componentIds.length > 0) {
    console.log("\nManifest hints for assets/manifests/components-assets.json:");
    for (let i = 0; i < componentIds.length; i += 1) {
      console.log(
        JSON.stringify(
          buildManifestHint({
            idField: "componentDefinitionId",
            id: componentIds[i],
            name: componentNames[i] || `Component ${componentIds[i]}`,
            assetBasePath: "components"
          }),
          null,
          2
        )
      );
    }
  }
}

function printUsage() {
  console.log(`
Usage examples:

  npm run scaffold -- --type=weapon --id=4 --name="Laser Blade" --slug=laser-blade
  npm run scaffold -- --type=component --id=10 --name="Laser Emitter" --slug=laser-emitter
  npm run scaffold -- --type=blueprint --id=4 --name="Laser Blade Blueprint" --slug=laser-blade-blueprint
  npm run scaffold -- --type=recipe --id=104 --name="Laser Blade Weapon Recipe" --outputKind=4 --outputId=4

  npm run scaffold -- \\
    --type=weapon-set \\
    --weaponId=4 \\
    --weaponName="Laser Blade" \\
    --weaponSlug=laser-blade \\
    --blueprintId=4 \\
    --blueprintName="Laser Blade Blueprint" \\
    --blueprintSlug=laser-blade-blueprint \\
    --recipeId=104 \\
    --componentIds=10,11 \\
    --componentNames="Laser Emitter|Stabilized Hilt" \\
    --componentSlugs=laser-emitter,stabilized-hilt

Optional:
  --force
`);
}

const type = getArgValue("--type", null);
const force = hasFlag("--force");

if (!type) {
  printUsage();
  process.exit(1);
}

try {
  if (type === "weapon") {
    await scaffoldWeapon({ force });
  } else if (type === "component") {
    await scaffoldComponent({ force });
  } else if (type === "blueprint") {
    await scaffoldBlueprint({ force });
  } else if (type === "recipe") {
    await scaffoldRecipe({ force });
  } else if (type === "weapon-set") {
    await scaffoldWeaponSet({ force });
  } else {
    throw new Error(`Unsupported scaffold type: ${type}`);
  }

  console.log("\nDone.");
} catch (error) {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
}