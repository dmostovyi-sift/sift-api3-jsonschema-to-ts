import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Base temporary directory for sift-schema operations.
 */
export const BASE_TEMP_DIR = path.join(os.tmpdir(), "sift-schema");

/**
 * Temporary directory for source files.
 */
export const SOURCE_TEMP_DIR = path.join(BASE_TEMP_DIR, "source");

/**
 * Temporary directory for JSON files.
 */
export const JSON_TEMP_DIR = path.join(BASE_TEMP_DIR, "json");

/**
 * Temporary directory for YAML files.
 */
export const YAML_TEMP_DIR = path.join(BASE_TEMP_DIR, "yaml");
// export const TYPES_TEMP_DIR = path.join(BASE_TEMP_DIR, "types");

/**
 * Temporary directory for TypeScript types.
 * Note: Currently hardcoded to a local path.
 */
export const TYPES_TEMP_DIR = resolveHomeDir("~/sift/console/src/schema/");
console.log(SOURCE_TEMP_DIR);

/**
 * Reads a file and returns its content and details.
 * @param {String} filePath - The path to the file to read.
 * @returns {Promise<{content: string, details: path.ParsedPath}>} An object containing the file content and path details.
 */
export async function readFile(filePath) {
  const [content, details] = await Promise.all([
    fs.readFileSync(filePath, { encoding: "utf8" }),
    path.parse(filePath),
  ]);

  return { content, details };
}

/**
 * Safely writes data to a file, creating directories if they don't exist.
 * @param {string} filePath - The path to the file to write.
 * @param {string} data - The data to write to the file.
 */
export function safeFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, data, {
    encoding: "utf8",
  });
}

/**
 * Deletes the base temporary directory and all its contents.
 */
export function deleteTempDir() {
  fs.existsSync(BASE_TEMP_DIR) && fs.rmSync(BASE_TEMP_DIR, { recursive: true });
}

/**
 * Copies the source directory to the temporary source directory.
 * @param {String} inputPath - The path to the source directory.
 */
export function copySourceDir(inputPath) {
  fs.cpSync(resolvePath(inputPath), SOURCE_TEMP_DIR, {
    recursive: true,
  });
}

/**
 * Resolves a file path, handling home directory expansion if necessary.
 * @param {String} inputPath - The path to resolve.
 * @returns {String} The resolved absolute path.
 */
export function resolvePath(inputPath) {
  if (!inputPath || !inputPath.trim()) {
    return inputPath;
  }

  return resolveHomeDir(inputPath);
}

/**
 * Resolves the home directory alias (~) in a path.
 * @param {String} inputPath - The path containing the home directory alias.
 * @returns {String} The path with the home directory expanded.
 */
function resolveHomeDir(inputPath) {
  return inputPath.startsWith("~")
    ? path.join(os.homedir(), inputPath.substring(1))
    : inputPath;
}
