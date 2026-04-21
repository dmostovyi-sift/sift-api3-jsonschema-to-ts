import { javaTypeToJsonScheme } from "./parser.js";
import { javaTypeToModuleName } from "./utils.js";
import nodePath from "node:path";

/**
 * Creates a function to normalize reference types in a JSON schema file.
 *
 * This function traverses the JSON schema and replaces `$ref` properties
 * pointing to `.json#/prop` with TypeScript type references (`tsType`).
 * It resolves the referenced file from the provided `referencesMap` and
 * constructs the corresponding TypeScript type access string.
 *
 * @param {Map<string, File>} referencesMap - A map where keys are file basenames (without extension)
 *                                            and values are File objects.
 * @returns {function(File): File} A function that accepts a File object and returns it with normalized type references.
 */
export function normalizeTypeReference(referencesMap) {
  return function (file) {
    function traverse(json) {
      for (const key in json) {
        if (key === "$ref" && json[key].includes(".json#/prop")) {
          const [x, y] = json[key].split("#");

          delete json[key];
          // x is like "subdir/file.json"
          // referencesMap is fileCollection (Map<name, File>)
          // name is basename without extension (e.g. "file")
          const fileName = nodePath.basename(x, ".json");
          const referencedFile = referencesMap.get(fileName);

          if (!referencedFile) {
            console.error(`Could not resolve file for reference: ${x}`);
            continue;
          }

          json["tsType"] =
            referencedFile.module +
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

/**
 * Removes the suffix from the title in the JSON schema based on the javaType.
 *
 * @param {File} file - The file object containing the JSON schema.
 * @returns {File} The updated file object with the modified title.
 */
export function removeTitleJsonSuffixe(file) {
  file.json.title = javaTypeToModuleName(file.json.javaType).module;

  return file;
}

/**
 * Normalizes the schema title by ensuring a description exists if a title is present,
 * and then removing the title.
 *
 * @param {Object} obj - The schema object.
 * @param {String} key - The property key being inspected (expected to be "title").
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
 * Normalizes internal references within the schema.
 * It converts .yaml extensions to .json and fixes the reference path format.
 *
 * @param {Object} obj - The schema object.
 * @param {String} key - The property key being inspected (expected to be "$ref").
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

/**
 * Creates a function to fix circular references in the schema.
 * It detects self-references or references to the current file and replaces them
 * with a `tsType` corresponding to the file's module.
 *
 * @param {Map<string, File>} referencesMap - A map of file names to File objects.
 * @returns {function(Object, String, File): void} A callback function for traversing the schema.
 */
export function fixCircularReferences(referencesMap) {
  /**
   * @param {Object} obj
   * @param {String} key
   * @param {File} file
   */
  return function (obj, key, file) {
    if (
      key === "javaType" &&
      !("enum" in obj) &&
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
 * Cleans up schema properties by removing unnecessary fields when `javaType` or `$ref` is present.
 *
 * @param {Object} obj - The schema object.
 * @param {String} key - The property key being inspected.
 */
export function cleanupScheme(obj, key) {
  if (key === "default" && typeof obj[key] !== "object") {
    delete obj[key];
  }
  if (key === "javaType") {
    delete obj["readonly"];
    delete obj["scope"];
    delete obj["description"];
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
 * Collapses array properties whose items share a javaType with a sibling array
 * that defines the type inline (with enum values). Instead of generating a
 * duplicate inline type, the property is replaced with a $ref pointing to the
 * canonical sibling array property.
 *
 * Example: `card` defines the enum inline, so `narrow` and `wide` (which share
 * the same items javaType but have no inline enum) collapse to reference `card`:
 *   narrow: HomepageWidgetsConfigV2['card']
 *
 * @returns {function(File): File}
 */
export function collapseArrayTypeReferences() {
  return function (file) {
    function hasInlineEnums(itemsSchema) {
      if (!itemsSchema?.properties) return false;
      return Object.values(itemsSchema.properties).some((prop) => "enum" in prop);
    }

    function processProperties(properties) {
      for (const [propName, propSchema] of Object.entries(properties)) {
        if (propSchema.type === "array" && propSchema.items?.javaType) {
          // Find a sibling array property that: shares the same items javaType AND
          // defines enum values inline → it is the canonical source.
          const canonicalName = Object.entries(properties).find(
            ([siblingName, siblingSchema]) =>
              siblingName !== propName &&
              siblingSchema.type === "array" &&
              siblingSchema.items?.javaType === propSchema.items.javaType &&
              hasInlineEnums(siblingSchema.items),
          )?.[0];

          if (canonicalName) {
            for (const k of Object.keys(propSchema)) {
              delete propSchema[k];
            }
            propSchema.$ref =
              file.name + ".json#/properties/" + canonicalName;
            continue;
          }
        }

        if (propSchema.properties) {
          processProperties(propSchema.properties);
        }
      }
    }

    if (file.json.properties) {
      processProperties(file.json.properties);
    }

    return file;
  };
}

/**
 * Transforms Java types within the schema to JSON Schema types using a reference map.
 *
 * @param {Map<String, String>} referencesMap - A map used for type resolution.
 * @param {File} file - The current file being processed, used for resolving relative paths.
 * @returns {function(Object, String): void} A callback function for traversing the schema.
 */
export function transformJavaTypesToJsonSchema(referencesMap, file) {
  return function (obj, key) {
    if (key === "javaType") {
      if (
        "enum" in obj ||
        "properties" in obj ||
        "additionalProperties" in obj
      ) {
        // continue;
      } else {
        const schema = javaTypeToJsonScheme(obj[key], referencesMap);
        if (file) {
          const currentDir = file.dirpath === "." ? "" : file.dirpath;

          function relativizeRefs(node) {
            if (!node || typeof node !== "object") return;
            if ("$ref" in node) {
              const [filePath, hash] = node.$ref.split("#");
              const relativeFilePath =
                currentDir === "" || currentDir === "."
                  ? filePath
                  : nodePath.relative(currentDir, filePath);
              if (!hash && relativeFilePath === file.name + ".json") {
                delete node.$ref;
                node.tsType = file.module;
              } else {
                node.$ref = hash
                  ? `${relativeFilePath}#${hash}`
                  : relativeFilePath;
              }
            }
            for (const k in node) {
              if (k !== "$ref") relativizeRefs(node[k]);
            }
          }

          relativizeRefs(schema);
        }
        Object.assign(obj, schema);
      }
      delete obj[key];
    } else if (key === "type" && obj[key] === "long") {
      obj[key] = "number";
    }
  };
}
