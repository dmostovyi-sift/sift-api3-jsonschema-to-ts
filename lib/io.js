import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const BASE_TEMP_DIR = path.join(os.tmpdir(), "sift-schema");
export const SOURCE_TEMP_DIR = path.join(BASE_TEMP_DIR, "source");
export const JSON_TEMP_DIR = path.join(BASE_TEMP_DIR, "json");
export const YAML_TEMP_DIR = path.join(BASE_TEMP_DIR, "yaml");
// export const TYPES_TEMP_DIR = path.join(BASE_TEMP_DIR, "types");
export const TYPES_TEMP_DIR = resolveHomeDir("~/sift/console/src/schema/");
console.log(SOURCE_TEMP_DIR);

/**
 * @param {String} filePath
 */
export async function readFile(filePath) {
  const [content, details] = await Promise.all([
    fs.readFileSync(filePath, { encoding: "utf8" }),
    path.parse(filePath),
  ]);

  return { content, details };
}

/**
 * @param {string} data
 * @param {string} filePath
 */
export function safeFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, data, {
    encoding: "utf8",
  });
}

export function deleteTempDir() {
  fs.existsSync(BASE_TEMP_DIR) && fs.rmSync(BASE_TEMP_DIR, { recursive: true });
}

/**
 * @param {String} inputPath
 */
export function copySourceDir(inputPath) {
  fs.cpSync(resolvePath(inputPath), SOURCE_TEMP_DIR, {
    recursive: true,
  });
}

/**
 * @param {String} inputPath
 */
export function resolvePath(inputPath) {
  if (!inputPath || !inputPath.trim()) {
    return inputPath;
  }

  return resolveHomeDir(inputPath);
}

/**
 * @param {String} inputPath
 */
function resolveHomeDir(inputPath) {
  return inputPath.startsWith("~")
    ? path.join(os.homedir(), inputPath.substring(1))
    : inputPath;
}
