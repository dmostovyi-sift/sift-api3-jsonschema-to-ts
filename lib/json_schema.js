import { compile } from "json-schema-to-typescript";
import { File } from "./file.js";
import { JSON_TEMP_DIR } from "./io.js";
import path from "node:path";
import { resolveInterfaceImports } from "./typescript.js";

/**
 * @param {File} file
 */
export async function compileJsonScheme(file, moduleCollection) {
  let tsSource = await compile(file.json, file.module, {
    cwd: path.join(JSON_TEMP_DIR, file.dirpath),
    declareExternallyReferenced: false,
    additionalProperties: false,
    format: false,
    ignoreMinAndMaxItems: true,
  });

  if (file.generic) {
    tsSource = tsSource.replace(
      /export interface (\w+) {/,
      `export interface $1<${file.generic} = unknown> {`,
    );
  }

  file.setTypeDefinitions(tsSource);

  file.setTypeDefinitions(
    await resolveInterfaceImports(file, moduleCollection),
  );

  return file;
}
