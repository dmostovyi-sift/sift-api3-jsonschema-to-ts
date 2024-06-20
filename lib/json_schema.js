import { compile } from "json-schema-to-typescript";
import { format } from "prettier";
import { checkMissingTypeImports } from "./typescript.js";
import { JSON_TEMP_DIR } from "./io.js";

/**
 * @param {Object} json
 * @param {String} name
 * @returns {Promise<String>}
 */
export async function compileJsonScheme(json, name) {
  const result = await compile(json, json.title, {
    cwd: JSON_TEMP_DIR + (name.includes("netsuite") ? "/netsuite" : ""),
    // declareExternallyReferenced: false,
    additionalProperties: false,
    format: false,
    ignoreMinAndMaxItems: true,
  });

  // const missingTypes = checkMissingTypeImports(result, name);
  //
  // const missingImports = Array.from(missingTypes)
  //   .map((dep) => `import type { ${dep} } from "./index.d.ts";`)
  //   .join("\n");
  // https://github.com/bcherny/json-schema-to-typescript/issues/193
  return format(result, {
    parser: "typescript",
    tabWidth: 2,
    singleQuote: true,
    trailingComma: "es5",
  });
}
