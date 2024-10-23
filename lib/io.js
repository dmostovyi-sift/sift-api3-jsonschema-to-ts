import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import yaml from "yaml";

export const BASE_TEMP_DIR = path.join(os.tmpdir(), "sift-schema");
export const SOURCE_TEMP_DIR = path.join(BASE_TEMP_DIR, "source");
export const JSON_TEMP_DIR = path.join(BASE_TEMP_DIR, "json");
export const YAML_TEMP_DIR = path.join(BASE_TEMP_DIR, "yaml");
// export const TYPES_TEMP_DIR = path.join(BASE_TEMP_DIR, "types");
export const TYPES_TEMP_DIR = resolveHomeDir("~/sift/console/src/schema/");
console.log(SOURCE_TEMP_DIR);

/**
 * @param {String} inputPath
 */
export function readFile(inputPath) {
  const filePath = path.resolve(SOURCE_TEMP_DIR, inputPath);

  return {
    originalPath: inputPath,
    filePath: inputPath.replace(".yaml", ""),
    filename: path.basename(inputPath, ".yaml"),
    content: fs.readFileSync(filePath, "utf8"),
  };
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
 * @param {Object} data
 * @param {String} filePath
 */
export function saveType(data, filePath) {
  if (!fs.existsSync(TYPES_TEMP_DIR)) {
    fs.mkdirSync(TYPES_TEMP_DIR);
    fs.mkdirSync(path.resolve(TYPES_TEMP_DIR, "netsuite"));
  }

  fs.writeFileSync(path.resolve(TYPES_TEMP_DIR, filePath + ".ts"), data, {
    encoding: "utf8",
  });
}

/**
 * @param {Object} data
 * @param {String} filePath
 */
export function saveJson(data, filePath) {
  if (!fs.existsSync(JSON_TEMP_DIR)) {
    fs.mkdirSync(JSON_TEMP_DIR);
    fs.mkdirSync(path.resolve(JSON_TEMP_DIR, "netsuite"));
  }

  fs.writeFileSync(
    path.resolve(JSON_TEMP_DIR, filePath + ".json"),
    JSON.stringify(data, null, 2),
    { encoding: "utf8" },
  );
}

/**
 * @param {String} inputPath
 */
function resolvePath(inputPath) {
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
