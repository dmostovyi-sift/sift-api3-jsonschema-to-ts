import path from "node:path";
import yaml from "yaml";
import { readFile, safeFile, TYPES_TEMP_DIR, JSON_TEMP_DIR } from "./io.js";
import { javaTypeToModuleName } from "./utils.js";

/**
 * Represents a file that can be processed, containing JSON content and optional TypeScript definitions.
 */
export class File {
  /**
   * The generated TypeScript definitions.
   * @type {string | null}
   */
  typescript = null;

  /**
   * Creates an instance of File.
   * @param {Object} params - The initialization parameters.
   * @param {string} params.name - The name of the file (without extension).
   * @param {string} params.basename - The base name of the file.
   * @param {Object} params.json - The JSON content of the file.
   * @param {string} params.fullpath - The full path to the file's directory.
   * @param {string} params.dirpath - The relative path to the file's directory.
   * @param {string} params.module - The module name derived from javaType.
   * @param {boolean} params.generic - Indicates if the type is generic.
   */
  constructor({ name, basename, json, fullpath, dirpath, module, generic }) {
    this.name = name;
    this.basename = basename;
    this.json = json;
    this.fullpath = fullpath;
    this.dirpath = dirpath;
    this.module = module;
    this.generic = generic;
  }

  /**
   * Sets the TypeScript definitions for the file.
   * @param {string} types - The generated TypeScript definitions.
   */
  setTypeDefinitions(types) {
    this.typescript = types;
  }

  /**
   * Reads a YAML file and creates a File instance.
   * @param {string} filePath - The path to the YAML file.
   * @param {string} cwd - The current working directory.
   * @returns {Promise<File>} A promise that resolves to a new File instance.
   */
  static async readYaml(filePath, cwd) {
    const { content, details } = await readFile(path.join(cwd, filePath));
    const json = yaml.parse(content);
    const { module, generic } = javaTypeToModuleName(json.javaType);

    return new File({
      name: details.name,
      basename: details.base,
      json,
      fullpath: details.dir,
      dirpath: path.dirname(filePath),
      module,
      generic,
    });
  }

  /**
   * Saves the TypeScript definitions to a .ts file.
   * @param {string} cwd - The current working directory.
   */
  saveTS(cwd) {
    safeFile(path.join(cwd, this.dirpath, this.name + ".ts"), this.typescript);
  }

  /**
   * Saves the JSON content to a .json file.
   * @param {string} cwd - The current working directory.
   */
  saveJson(cwd) {
    safeFile(
      path.join(cwd, this.dirpath, this.name + ".json"),
      JSON.stringify(this.json, null, 2),
    );
  }

  /**
   * Returns a string representation of the file's JSON content.
   * @returns {string} The JSON string.
   */
  toString() {
    return JSON.stringify(this.json, null, 2);
  }
}
