import { File } from "./file.js";

/**
 * A class responsible for transforming and traversing file content.
 */
export class FileTransformer {
  /**
   * The file instance being transformed.
   * @type {File}
   */
  #file = null;

  /**
   * Creates an instance of FileTransformer.
   * @param {File} value - The file to transform.
   */
  constructor(value) {
    this.#file = value;
  }

  /**
   * Creates a FileTransformer from a File instance.
   * @param {File} file - The file to transform.
   * @returns {FileTransformer} A new FileTransformer instance.
   */
  static fromFile(file) {
    return new FileTransformer(file);
  }

  /**
   * Applies a transformation function to the file content.
   * @param {function(File): File} transformFn - The transformation function that takes a File and returns a transformed File.
   * @returns {FileTransformer} A new FileTransformer instance with the transformed content.
   */
  map(transformFn) {
    const transformedFile = transformFn(this.#file);
    return new FileTransformer(transformedFile);
  }

  /**
   * Traverses the file's JSON properties and applies a callback to each property.
   * @param {function(Object, string, File): void} callback - The callback function to apply to each property.
   * @returns {FileTransformer} A new FileTransformer instance containing the same file.
   */
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

  /**
   * Returns the underlying File instance.
   * @returns {File} The file instance.
   */
  file() {
    return this.#file;
  }
}
