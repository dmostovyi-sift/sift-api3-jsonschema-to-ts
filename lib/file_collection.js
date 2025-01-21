import { File } from "./file.js";

/**
 */
export class FileCollection extends Map {
  /**
   * @param {File[]} files
   */
  constructor(files) {
    super(files.map((file) => [file.name, file]));
  }
}
