import { File } from "./file.js";

export class ModuleCollection extends Map {
  /**
   * @param {File[]} files
   */
  constructor(files) {
    super(files.map((file) => [file.module, file]));
  }
}
