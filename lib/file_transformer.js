import { File } from "./file.js";

export class FileTransformer {
  /**
   * @type {File} value
   */
  #file = null;

  /**
   * @param {File} value
   */
  constructor(value) {
    this.#file = value;
  }

  /**
   * @param {File} value
   */
  static fromFile(file) {
    return new FileTransformer(file);
  }

  /**
   * Applies a transformation function to the file content.
   * @param {function} transformFn - The transformation function.
   * @returns {FileTransformer} - A new FileTransformer instance with the transformed content.
   */
  map(transformFn) {
    const transformedFile = transformFn(this.#file);
    return new FileTransformer(transformedFile);
  }

  traverse(callback) {
    const traverse = (obj) => {
      for (const key in obj) {
        callback(obj, key, this.#file);

        if (obj[key] && typeof obj[key] === "object") {
          traverse(obj[key]);
        }
      }
    };

    this.#file.json.properties && traverse(this.#file.json.properties);

    return new FileTransformer(this.#file);
  }

  file() {
    return this.#file;
  }
}
