import path from "node:path";
import yaml from "yaml";
import { readFile, safeFile, TYPES_TEMP_DIR, JSON_TEMP_DIR } from "./io.js";
import { javaTypeToModuleName } from "./transformers.js";

export class File {
  /**
   * @type {string | null}
   */
  typescript = null;

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
   * @param {string} types
   */
  setTypeDefinitions(types) {
    this.typescript = types;
  }

  /**
   * @param {string} filePath
   * @param {string} cwd
   * @returns {File}
   */
  static async readYaml(filePath, cwd) {
    filePath = filePath.startsWith("/") ? filePath : `/${filePath}`;
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
   * @param {string} cwd
   */
  saveTS(cwd) {
    safeFile(path.join(cwd, this.dirpath, this.name + ".ts"), this.typescript);
  }

  /**
   * @param {string} cwd
   */
  saveJson(cwd) {
    safeFile(
      path.join(cwd, this.dirpath, this.name + ".json"),
      JSON.stringify(this.json, null, 2),
    );
  }

  toString() {
    return JSON.stringify(this.json, null, 2);
  }
}
