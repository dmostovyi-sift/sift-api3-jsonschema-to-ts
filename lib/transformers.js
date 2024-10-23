import { javaTypeToJsonScheme, javaTypeToClassName } from "./parser.js";

/**
 * @param {Object} jsonSchema
 * @param {Map<String, String>} referencesMap
 * @returns {Object}
 */
export function normalize(jsonSchema, referencesMap) {
  if ("javaType" in jsonSchema === false) {
    throw new Error("Schema must have a javaType property");
  }

  jsonSchema.title = javaTypeToTitle(jsonSchema.javaType);

  function traverse(json) {
    for (const key in json) {
      normalizeSchemaTitle(json, key);
      normalizeSchemaInternalReferences(json, key);
      fixCircularReferences(json, key, jsonSchema, referencesMap);
      cleanupScheme(json, key);
      transformJavaTypesToJsonSchema(json, key, referencesMap);

      if (json[key] && typeof json[key] === "object") {
        traverse(json[key]);
      }
    }
  }

  normalizeRequiredFields(jsonSchema);

  "properties" in jsonSchema && traverse(jsonSchema.properties);

  normalizeTypeReference(jsonSchema, referencesMap);

  return jsonSchema;
}

function normalizeTypeReference(schema, referencesMap) {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  function traverse(json) {
    for (const key in json) {
      if (key === "$ref" && json[key].includes(".json#/prop")) {
        const [x, y] = json[key].split("#");

        delete json[key];
        json["tsType"] =
          referencesMap.get(x).replace(/json$/i, "") +
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

  traverse(schema);

  return schema;
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
 * @param {Object} schema
 */
function normalizeRequiredFields(schema) {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  function traverse(schema) {
    if (schema.properties) {
      const required = [];

      for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.required) {
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

  traverse(schema);

  return schema;
}

/**
 * @param {Object} obj
 * @param {String} key
 */
function fixCircularReferences(obj, key, jsonSchema, referencesMap) {
  if (
    key === "javaType" &&
    javaTypeToClassName(jsonSchema.javaType) === javaTypeToClassName(obj[key])
  ) {
    obj.tsType = jsonSchema.title;
    delete obj[key];
  }

  if (
    key === "$ref" &&
    referencesMap.get(obj[key])?.replace(/json$/i, "") === jsonSchema.title
  ) {
    obj.tsType = jsonSchema.title;
    delete obj[key];
  }

  if (key === "$ref" && obj[key]?.startsWith("#/")) {
    obj.tsType =
      jsonSchema.title +
      obj[key]
        .split("/")
        .splice(2)
        .filter((x) => x !== "properties" && x !== "items")
        .map((x) => `['${x}']`)
        .join("");
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
    delete obj["scope"];
    delete obj["description"];
    delete obj["default"];

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
function transformJavaTypesToJsonSchema(obj, key, referencesMap) {
  if (key === "javaType") {
    if ("enum" in obj || "properties" in obj || "additionalProperties" in obj) {
      // continue;
    } else {
      Object.assign(obj, javaTypeToJsonScheme(obj[key], referencesMap));
    }
    delete obj[key];
  } else if (key === "type" && obj[key] === "long") {
    obj[key] = "number";
  }
}

/**
 * @param {String} javaType
 * @returns {String}
 */
function javaTypeToTitle(javaType) {
  return javaType.split(".").at(-1).replace(/<T>$/g, "").replace(/json$/i, "");
}
