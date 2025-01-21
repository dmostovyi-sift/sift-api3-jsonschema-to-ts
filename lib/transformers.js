import { javaTypeToJsonScheme } from "./parser.js";

/**
 * @param {Object} jsonSchema
 * @param {Map<String, String>} referencesMap
 * @returns {Object}
 */
// export function normalize(jsonSchema, referencesMap) {
//   if ("javaType" in jsonSchema === false) {
//     throw new Error("Schema must have a javaType property");
//   }
//
//   jsonSchema.title = javaTypeToModuleName(jsonSchema.javaType).module;
//
//
//   function traverse(json) {
//     for (const key in json) {
//       normalizeSchemaTitle(json, key);
//       normalizeSchemaInternalReferences(json, key);
//       fixCircularReferences(json, key, jsonSchema, referencesMap);
//       cleanupScheme(json, key);
//       transformJavaTypesToJsonSchema(json, key, referencesMap);
//
//       if (json[key] && typeof json[key] === "object") {
//         traverse(json[key]);
//       }
//     }
//   }
//
//   normalizeRequiredFields(jsonSchema);
//
//   "properties" in jsonSchema && traverse(jsonSchema.properties);
//
//   normalizeTypeReference(jsonSchema, referencesMap);
//
//   return jsonSchema;
// }

export function normalizeTypeReference(referencesMap) {
  return function (file) {
    function traverse(json) {
      for (const key in json) {
        if (key === "$ref" && json[key].includes(".json#/prop")) {
          const [x, y] = json[key].split("#");

          delete json[key];
          json["tsType"] =
            referencesMap.get(x.replace(".json", "")).module +
            y
              .split("/")
              .filter((x) => Boolean(x))
              .filter((x) => x !== "properties" && x !== "items")
              .map((x) => `['${x}']`)
              .join("");
        }

        if (json[key] && typeof json[key] === "object") {
          traverse(json[key]);
        }
      }
    }

    traverse(file.json);

    return file;
  };
}

export function removeTitleJsonSuffixe(file) {
  file.json.title = javaTypeToModuleName(file.json.javaType).module;

  return file;
}

/**
 * @param {Object} obj
 * @param {String} key
 */
export function normalizeSchemaTitle(obj, key) {
  if (key === "title") {
    if ("description" in obj === false) {
      obj.description = obj.title;
    }
    delete obj.title;
  }
}

/**
 * @param {Object} obj
 * @param {String} key
 */
export function normalizeSchemaInternalReferences(obj, key) {
  if (key === "$ref") {
    obj[key] = obj[key].replace(/\.yaml/g, ".json");
    obj[key] = obj[key].replace(/\.json#(?!\/)(.+)/g, ".json#/$1");
  }
}

/**
 * Normalizes the required fields in a JSON Schema by making all fields required
 * by default, except those explicitly marked with `required: false`.
 *
 * This function traverses the schema, collecting property names into a `required` array
 * based on the specified rules. If a property has `required: false`, it will not be
 * included in the `required` array. The individual `required` flags are removed from the
 * properties for a cleaner schema.
 *
 * @param {Object} file - The JSON Schema to normalize. This must be an object
 *                          that may contain properties and possibly nested schemas.
 * @returns {Object} The modified JSON Schema with a `required` array, which lists
 *                  the names of the properties that are required.
 *
 * @example
 * const schema = {
 *     type: "object",
 *     properties: {
 *         name: { type: "string" },
 *         age: { type: "integer", required: false },
 *         address: {
 *             type: "object",
 *             properties: {
 *                 city: { type: "string" },
 *                 zip: { type: "string", required: false }
 *             }
 *         }
 *     }
 * };
 *
 * const normalizedSchema = normalizeRequiredFields(schema);
 * console.log(normalizedSchema.required); // Output: ["name", "city"]
 */
export function normalizeRequiredFields(file) {
  function traverse(schema) {
    const required = [];

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        // Check if prop has required: false
        if (prop.required !== false) {
          required.push(key);
        }

        delete prop.required;
        traverse(prop);
      }

      if (required.length > 0) {
        schema.required = required;
      }
    } else if (schema.type === "array" && schema.items) {
      traverse(schema.items);
    }
  }

  traverse(file.json);

  return file;
}

export function fixCircularReferences(referencesMap) {
  /**
   * @param {Object} obj
   * @param {String} key
   */
  return function (obj, key, file) {
    if (
      key === "javaType" &&
      file.json.javaType &&
      typeof obj[key] === "string" &&
      javaTypeToModuleName(file.json.javaType).module ===
        javaTypeToModuleName(obj[key]).module
    ) {
      obj.tsType = file.module;
      delete obj[key];
    }

    if (
      key === "$ref" &&
      referencesMap.get(obj[key].replace(/.json$/i, ""))?.name === file.name
    ) {
      delete obj[key];
      obj.tsType = file.module;
    }

    if (key === "$ref" && obj[key]?.startsWith("#/")) {
      obj.tsType =
        file.module +
        obj[key]
          .split("/")
          .splice(2)
          .filter((x) => x !== "properties" && x !== "items")
          .map((x) => `['${x}']`)
          .join("");
      delete obj[key];
    }
  };
}

/**
 * @param {Object} obj
 * @param {String} key
 */
export function cleanupScheme(obj, key) {
  if (key === "javaType") {
    delete obj["readonly"];
    delete obj["scope"];
    delete obj["description"];
    delete obj["default"];
    delete obj["additionalProperties"];

    delete obj["type"];
    delete obj["patternProperties"];
  }
  if (key === "$ref") {
    delete obj["readonly"];
    delete obj["scope"];
    delete obj["description"];
    delete obj["default"];

    delete obj["type"];
  }
}

/**
 * @param {Object} obj
 * @param {String} key
 * @param {Map<String, String>} referencesMap
 * @returns {Object}
 */
export function transformJavaTypesToJsonSchema(referencesMap) {
  return function (obj, key) {
    if (key === "javaType") {
      if (
        "enum" in obj ||
        "properties" in obj ||
        "additionalProperties" in obj
      ) {
        // continue;
      } else {
        Object.assign(obj, javaTypeToJsonScheme(obj[key], referencesMap));
      }
      delete obj[key];
    } else if (key === "type" && obj[key] === "long") {
      obj[key] = "number";
    }
  };
}

/**
 * Converts a Java type string to a module name and extracts any generic type information.
 *
 * @param {string} javaType
 * @returns {Object} An object containing:
 * @property {string} module - The module name derived from the Java type.
 * @property {string|null} generic - The generic type if present; otherwise, null.
 *
 * @example
 * // Example usage:
 * const result = javaTypeToModuleName("com.example.MyType<T>");
 * console.log(result); // { module: "MyType", generic: "T" }
 *
 * const result2 = javaTypeToModuleName("com.example.MyTypeJson");
 * console.log(result2); // { module: "MyType", generic: null }
 */
export function javaTypeToModuleName(javaType) {
  const javaModule = javaType.split(".").at(-1);

  const generic = javaModule.match(/<(?<generic>.)>$/)?.groups.generic ?? null;
  const module = javaModule.replace(/<.>$/, "").replace(/json$/gi, "");

  return { module, generic };
}
