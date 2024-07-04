/**
 * @typedef {Object} ProcessedFile
 * @property {String} originalPath
 * @property {String} filePath
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
import { normalize } from "./transformers.js";
import { javaTypeToClassName } from "./parser.js";
import { compileJsonScheme } from "./json_schema.js";
import { getInterfaceName, resolveInterfaceImports } from "./typescript.js";

async function main() {
  deleteTempDir();
  copySourceDir("/Users/dmostovyi/code/java/sift-json/src/main/json");

  const files = await findFiles();
  const processedFiles = await processFiles(files);
  const referencesMap = buildReferencesMap(processedFiles);
  const normalizedFiles = normalizeFiles(processedFiles, referencesMap);

  for (const file of normalizedFiles) {
    saveJson(file.json, file.filePath);
  }

  const a = new Map();
  for await (const file of normalizedFiles) {
    const content = await compileJsonScheme(file.json, file.filePath);
    file.jsonSchema = content;

    a.set(getInterfaceName(content)[0], file.filePath);
    // console.log(content);
  }

  for await (const file of normalizedFiles) {
    file.jsonSchema = await resolveInterfaceImports(file.jsonSchema, a);
    saveType(file.jsonSchema, file.filePath);
  }
  // console.log(normalizedFiles);
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
    const { filename, originalPath, filePath, content } = readFile(file);
    const json = parseYaml(content);

    result.push({ json, originalPath, filename, filePath });
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
      file.filePath + ".json",
    );

    const nestedRefs = traverse(file.json.properties);
    for (const nestedRef of nestedRefs) {
      const [path, type] = nestedRef.split("#");
      referencesMap.set(
        javaTypeToClassName(type),
        `${file.filePath}.json#/properties/${path}`,
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
    file.json = normalize(file.json, referencesMap);
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
