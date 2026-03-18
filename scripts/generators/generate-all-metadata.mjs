import { spawn } from "node:child_process";
import { hasFlag, getArgValue } from "../lib/cli-utils.mjs";

const dryRun = hasFlag("--dry-run");
const network = getArgValue("--network", null);

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

const extraArgs = [];
if (dryRun) extraArgs.push("--dry-run");
if (network) extraArgs.push(`--network=${network}`);

console.log("Starting full metadata generation pipeline...\n");

for (const command of generatorCommands) {
  console.log(`\n--- Running ${command.label} generator ---`);
  await runNodeScript(command.script, extraArgs);
}

console.log("\nAll metadata generators completed successfully.");