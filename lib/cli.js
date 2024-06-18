/**
 * @typedef {Object} ProcessedFile
 * @property {String} path
 * @property {Object} json
 * @property {string} filename
 */

import { glob } from "glob";
import yaml from "yaml";
import {
  readFile,
  copySourceDir,
  deleteTempDir,
  saveJson,
  saveType,
  SOURCE_TEMP_DIR,
} from "./io.js";
import { normalize2 } from "./transformers.js";
import { javaTypeToClassName } from "./parser.js";
import { compileJsonScheme } from "./json_schema.js";

async function main() {
  deleteTempDir();
  copySourceDir("/Users/dmostovyi/code/java/sift-json/src/main/json");

  const files = await findFiles();
  const processedFiles = await processFiles(files);
  const referencesMap = buildReferencesMap(processedFiles);
  const normalizedFiles = normalizeFiles(processedFiles, referencesMap);

  for (const file of normalizedFiles) {
    saveJson(file.json, file.path);
  }

  for await (const file of normalizedFiles) {
    const content = await compileJsonScheme(file.json, file.path);
    // console.log(content);
    saveType(content, file.path);
  }
  // console.log(referencesMap)
}
main();

/**
 * @param {String[]} files
 * @returns {Promise<ProcessedFile[]>}
 */
async function processFiles(files) {
  /**
   * @type {ProcessedFile[]}
   */
  const result = [];
  for await (const file of files) {
    const { filename, path, content } = readFile(file);
    const json = parseYaml(content);

    result.push({ json, path, filename });
  }

  return result;
}

/**
 * @param {ProcessedFile[]} files
 * @returns {Map<String, String>}
 */
function buildReferencesMap(files) {
  const referencesMap = new Map();

  /**
   * @param {Object} obj
   * @param {String} currentPath
   * @returns {String[]}
   */
  function traverse(obj, currentPath = "") {
    /**
     * @type {String[]}
     */
    let paths = [];

    for (const key in obj) {
      const nextPath = currentPath ? `${currentPath}/${key}` : key;
      if (
        obj[key] &&
        typeof obj[key] === "object" &&
        "javaType" in obj[key] &&
        ("enum" in obj[key] || "properties" in obj[key])
      ) {
        paths.push(`${nextPath}#${obj[key].javaType}`);
      } else if (obj[key] && typeof obj[key] === "object") {
        const nestedPaths = traverse(obj[key], nextPath);
        paths = paths.concat(nestedPaths);
      }
    }

    return paths;
  }

  for (const file of files) {
    referencesMap.set(
      javaTypeToClassName(file.json.javaType),
      file.path.replace(".yaml", ".json"),
    );

    const nestedRefs = traverse(file.json.properties);
    for (const nestedRef of nestedRefs) {
      const [path, type] = nestedRef.split("#");
      referencesMap.set(
        javaTypeToClassName(type),
        `${file.path}#/properties/${path}`.replace(/\.yaml/gi, ".json"),
      );
    }
  }

  return referencesMap;
}

/**
 * @param {ProcessedFile[]} files
 * @param {Map<String, String>} referencesMap
 * @returns {ProcessedFile[]}
 */
function normalizeFiles(files, referencesMap) {
  for (const file of files) {
    file.json = normalize2(file.json, referencesMap);
  }
  return files;
}

function findFiles() {
  return glob("**/*.yaml", { cwd: SOURCE_TEMP_DIR });
}

/**
 * @param {String} fileContent
 * @returns {Object}
 */
function parseYaml(fileContent) {
  return yaml.parse(fileContent);
}
