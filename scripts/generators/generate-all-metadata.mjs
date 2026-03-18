import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";

const dryRun = hasFlag("--dry-run");
const network = getArgValue("--network", null);
const source = getArgValue("--source", null);

const REPORT_PATH = path.join("reports", "sync-report.json");

const generatorCommands = [
  {
    label: "components",
    script: "scripts/generators/generate-component-metadata.mjs"
  },
  {
    label: "blueprints",
    script: "scripts/generators/generate-blueprint-metadata.mjs"
  },
  {
    label: "enchantment-items",
    script: "scripts/generators/generate-enchantment-item-metadata.mjs"
  },
  {
    label: "materia-items",
    script: "scripts/generators/generate-materia-item-metadata.mjs"
  },
  {
    label: "weapons",
    script: "scripts/generators/generate-weapon-instance-metadata.mjs"
  }
];

function runNodeScript(scriptPath, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath, ...extraArgs], {
      stdio: "inherit",
      shell: false
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptPath} exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

const extraArgs = [];
if (dryRun) extraArgs.push("--dry-run");
if (network) extraArgs.push(`--network=${network}`);
if (source) extraArgs.push(`--source=${source}`);

const aggregateReport = {
  generatedAt: new Date().toISOString(),
  generator: "generate-all-metadata",
  network: network || "default",
  sourceModeRequested: source || null,
  dryRun,
  completedGenerators: [],
  summary: {
    totalGeneratorsRun: 0,
    totalWarnings: 0,
    componentsGenerated: 0,
    blueprintsGenerated: 0,
    enchantmentItemsGenerated: 0,
    materiaItemsGenerated: 0,
    weaponsGenerated: 0,
    generatedFromChain: 0,
    generatedFromDefinitions: 0
  },
  warnings: []
};

console.log("Starting full metadata generation pipeline...\n");

for (const command of generatorCommands) {
  console.log(`\n--- Running ${command.label} generator ---`);
  await runNodeScript(command.script, extraArgs);

  const childReport = await readJsonIfExists(REPORT_PATH);

  aggregateReport.summary.totalGeneratorsRun += 1;
  aggregateReport.completedGenerators.push({
    label: command.label,
    script: command.script,
    reportFound: Boolean(childReport),
    generatedAt: childReport?.generatedAt || null,
    sourceModeRequested: childReport?.sourceModeRequested || null,
    summary: childReport?.summary || {}
  });

  if (childReport?.summary) {
    aggregateReport.summary.componentsGenerated += Number(
      childReport.summary.componentsGenerated || 0
    );
    aggregateReport.summary.blueprintsGenerated += Number(
      childReport.summary.blueprintsGenerated || 0
    );
    aggregateReport.summary.enchantmentItemsGenerated += Number(
      childReport.summary.enchantmentItemsGenerated || 0
    );
    aggregateReport.summary.materiaItemsGenerated += Number(
      childReport.summary.materiaItemsGenerated || 0
    );
    aggregateReport.summary.weaponsGenerated += Number(
      childReport.summary.weaponsGenerated || 0
    );
    aggregateReport.summary.generatedFromChain += Number(
      childReport.summary.generatedFromChain || 0
    );
    aggregateReport.summary.generatedFromDefinitions += Number(
      childReport.summary.generatedFromDefinitions || 0
    );
  }

  if (Array.isArray(childReport?.warnings) && childReport.warnings.length > 0) {
    aggregateReport.summary.totalWarnings += childReport.warnings.length;
    for (const warning of childReport.warnings) {
      aggregateReport.warnings.push(`[${command.label}] ${warning}`);
    }
  }
}

if (!dryRun) {
  await writeJsonFile(REPORT_PATH, aggregateReport);
}

console.log("\nAll metadata generators completed successfully.");

console.log("\nAggregate summary:");
console.log(`- Generators run: ${aggregateReport.summary.totalGeneratorsRun}`);
console.log(`- Components generated: ${aggregateReport.summary.componentsGenerated}`);
console.log(`- Blueprints generated: ${aggregateReport.summary.blueprintsGenerated}`);
console.log(
  `- Enchantment items generated: ${aggregateReport.summary.enchantmentItemsGenerated}`
);
console.log(`- Materia items generated: ${aggregateReport.summary.materiaItemsGenerated}`);
console.log(`- Weapons generated: ${aggregateReport.summary.weaponsGenerated}`);
console.log(`- From chain: ${aggregateReport.summary.generatedFromChain}`);
console.log(`- From definitions: ${aggregateReport.summary.generatedFromDefinitions}`);
console.log(`- Warnings: ${aggregateReport.summary.totalWarnings}`);

if (aggregateReport.warnings.length > 0) {
  console.log("\nCollected warnings:");
  for (const warning of aggregateReport.warnings) {
    console.log(`- ${warning}`);
  }
}