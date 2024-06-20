import { compile } from "json-schema-to-typescript";
import { JSON_TEMP_DIR } from "./io.js";

/**
 * @param {Object} json
 * @param {String} name
 * @returns {Promise<String>}
 */
export function compileJsonScheme(json, name) {
  return compile(json, json.title, {
    cwd: JSON_TEMP_DIR + (name.includes("netsuite") ? "/netsuite" : ""),
    declareExternallyReferenced: false,
    additionalProperties: false,
    format: false,
    ignoreMinAndMaxItems: true,
  });
}
