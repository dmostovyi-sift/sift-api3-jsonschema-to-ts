import { javaTypeToJsonScheme, javaTypeToClassName } from "./parser.js";

/**
 * @param {Object} jsonSchema
 * @param {Map<String, String>} referencesMap
 * @returns {Object}
 */
export function normalize(jsonSchema, referencesMap) {
  // jsonSchema = normalizeSchemaTitle(jsonSchema);
  jsonSchema = normalizeSchemaInternalReferences(jsonSchema, referencesMap);
  jsonSchema = transformJavaTypesToJsonSchema(jsonSchema, referencesMap);

  return jsonSchema;
}

/**
 * @param {Object} jsonSchema
 * @param {Map<String, String>} referencesMap
 * @returns {Object}
 */
export function normalize2(jsonSchema, referencesMap) {
  if ("javaType" in jsonSchema === false) {
    throw new Error("Schema must have a javaType property");
  }

  jsonSchema.title = javaTypeToTitle(jsonSchema.javaType);

  function traverse(json) {
    for (const key in json) {
      normalizeSchemaTitle(json, key);
      normalizeSchemaInternalReferences(json, key);
      // fixCircularReferences(json, key, jsonSchema);
      cleanupScheme(json, key);
      transformJavaTypesToJsonSchema(json, key, referencesMap);

      if (json[key] && typeof json[key] === "object") {
        traverse(json[key]);
      }
    }
  }

  "properties" in jsonSchema && traverse(jsonSchema.properties);

  return jsonSchema;
}

/**
 * @param {Object} obj
 * @param {String} key
 */
function normalizeSchemaTitle(obj, key) {
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
function normalizeSchemaInternalReferences(obj, key) {
  if (key === "$ref") {
    obj[key] = obj[key].replace(/\.yaml/g, ".json");
    obj[key] = obj[key].replace(/\.json#(?!\/)(.+)/g, ".json#/$1");
  }
}

/**
 * @param {Object} obj
 * @param {String} key
 */
function fixCircularReferences(obj, key, jsonSchema) {
  if (
    key === "javaType" &&
    javaTypeToClassName(jsonSchema.javaType) === javaTypeToClassName(obj[key])
  ) {
    obj.tsType = jsonSchema.title;
    delete obj[key];
  }
}

/**
 * @param {Object} obj
 * @param {String} key
 */
function cleanupScheme(obj, key) {
  if (key === "javaType") {
    delete obj["readonly"];
    delete obj["required"];
    delete obj["scope"];
    delete obj["description"];
    delete obj["default"];

    delete obj["type"];
    delete obj["patternProperties"];
  }
  if (key === "$ref") {
    delete obj["readonly"];
    delete obj["required"];
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
function transformJavaTypesToJsonSchema(obj, key, referencesMap) {
  if (key === "javaType") {
    if ("enum" in obj || "properties" in obj || "additionalProperties" in obj) {
      // continue;
    } else {
      Object.assign(obj, javaTypeToJsonScheme(obj[key], referencesMap));
      delete obj[key];
    }
  } else if (key === "type" && obj[key] === "long") {
    obj[key] = "integer";
  }
}

/**
 * @param {String} javaType
 * @returns {String}
 */
function javaTypeToTitle(javaType) {
  return (
    javaType
      .split(".")
      .at(-1)
      // .replace(/<T>$/g, "")
      .replace(/json$/i, "")
  );
}
