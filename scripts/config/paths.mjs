import path from "node:path";

export const ROOT_DIR = process.cwd();

export const PATHS = {
  root: ROOT_DIR,
  schemas: path.join(ROOT_DIR, "schemas"),
  data: path.join(ROOT_DIR, "data"),
  definitions: path.join(ROOT_DIR, "data", "definitions"),
  metadata: path.join(ROOT_DIR, "metadata"),
  scripts: path.join(ROOT_DIR, "scripts")
};