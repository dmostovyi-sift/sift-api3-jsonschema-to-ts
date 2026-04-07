import { compile } from "json-schema-to-typescript";
import { File } from "./file.js";
import { JSON_TEMP_DIR } from "./io.js";
import path from "node:path";
import { resolveInterfaceImports } from "./typescript.js";

/**
 * Compiles a JSON schema file into TypeScript definitions.
 *
 * This function handles the compilation process using `json-schema-to-typescript`,
 * processes generic types if applicable, and resolves interface imports.
 *
 * @param {File} file - The file object containing the JSON schema and metadata.
 * @param {Object} moduleCollection - A collection of modules used for resolving imports.
 * @returns {Promise<File>} The file object with updated TypeScript definitions.
 */
export async function compileJsonScheme(file, moduleCollection) {
  // Compile JSON schema to TypeScript
  let tsSource = await compile(file.json, file.module, {
    cwd: path.join(JSON_TEMP_DIR, file.dirpath),
    declareExternallyReferenced: false,
    additionalProperties: false,
    format: false,
    ignoreMinAndMaxItems: true,
  });

  // Handle generic types by replacing the interface declaration
  if (file.generic) {
    tsSource = tsSource.replace(
      /export interface (\w+) {/,
      `export interface $1<${file.generic} = unknown> {`,
    );
  }

  // Set the initial TypeScript definitions
  file.setTypeDefinitions(tsSource);

  // Resolve and update interface imports
  file.setTypeDefinitions(
    await resolveInterfaceImports(file, moduleCollection),
  );

  return file;
}
