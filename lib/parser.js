import { javaTypeToModuleName } from "./utils.js";
import nodePath from "node:path";

const JAVA_NUMERIC_TYPES = [
  "int",
  "Number",
  "Float",
  "Long",
  "Integer",
  "double",
  "Double",
  "BigDecimal",
  "BigInteger",
  "java.lang.Integer",
];
const JAVA_STRING_TYPES = ["String"];
const JAVA_LISTLIKE_CLASSES = [
  "java.util.List",
  "java.util.ArrayList",
  "java.util.Set",
];
const JAVA_MAPLIKE_CLASSES = [
  "java.util.Map",
  "java.util.HashMap",
  "java.util.LinkedHashMap",
  "java.util.SortedMap",
];
const JAVA_OBJECTLIKE_CLASSES = [
  "Object",
  "java.lang.Object",
  "com.sift.json.RawJson",
  "com.fasterxml.jackson.databind.JsonNode",
];

/**
 * @param {String} javaType
 * @param {Map<String, String>} referencesMap
 * @param {String} currentDir
 * @returns {Object}
 */
export function javaTypeToJsonScheme(javaType, referencesMap = new Map()) {
  /**
   * A recurcive function
   *
   * @param {String} typeStr
   * @returns {Object}
   */
  function parseType(typeStr) {
    if (!typeStr || typeStr.length === 0) {
      return null;
    }

    if (JAVA_LISTLIKE_CLASSES.some((type) => typeStr.startsWith(type))) {
      return {
        type: "array",
        items: parseType(
          typeStr.substring(typeStr.indexOf("<") + 1, typeStr.length - 1),
        ),
      };
    } else if (JAVA_MAPLIKE_CLASSES.some((type) => typeStr.startsWith(type))) {
      const innerTypes = typeStr
        .substring(typeStr.indexOf("<") + 1, typeStr.lastIndexOf(">"))
        .trim();
      const [_keyType, valueType] = splitGenericTypes(innerTypes);

      return {
        type: "object",
        additionalProperties: parseType(valueType),
      };
    } else if (JAVA_STRING_TYPES.includes(typeStr)) {
      return {
        type: "string",
      };
    } else if (JAVA_NUMERIC_TYPES.includes(typeStr)) {
      return {
        type: "integer",
      };
    } else if (JAVA_OBJECTLIKE_CLASSES.includes(typeStr)) {
      return {
        anyOf: [
          { type: "string" },
          { type: "integer" },
          { type: "boolean" },
          { type: "null" },
        ],
      };
    } else if (typeStr === "Boolean") {
      return {
        type: "boolean",
      };
    } else if (typeStr.length === 1 && typeStr === typeStr.toUpperCase()) {
      // Generic type
      return {
        tsType: typeStr,
      };
    } else {
      if (referencesMap.has(javaTypeToModuleName(typeStr).module)) {
        // console.log("✓", typeStr);

        return {
          $ref: referencesMap.get(javaTypeToModuleName(typeStr).module),
        };
      } else {
        // Try to handle inner classes (e.g. Com.Example.Outer.Inner)
        // We attempt to find the parent class in the references map
        const parts = typeStr.split(".");
        // Only try if it looks like a nested class (at least one dot)
        // and we can potentially strip the last part
        if (parts.length > 1) {
          const innerClass = parts[parts.length - 1];
          const parentTypeStr = parts.slice(0, parts.length - 1).join(".");
          const parentModule = javaTypeToModuleName(parentTypeStr).module;

          if (referencesMap.has(parentModule)) {
            const fullPath = referencesMap.get(parentModule);
            const [filePath] = fullPath.split("#");

            // let relativePath = nodePath.relative(currentDir, filePath);
            // if (!relativePath.startsWith(".")) {
            //   relativePath = "./" + relativePath;
            // }

            // Heuristic: assume inner class Name maps to property name
            // e.g. Category -> category
            const propName =
              innerClass.charAt(0).toLowerCase() + innerClass.slice(1);

            return {
              $ref: `${filePath}#/properties/${propName}`,
            };
          }
        }

        console.log("⨯", typeStr, javaTypeToModuleName(typeStr).module);
        return {};
      }
    }
  }

  return parseType(javaType);
}

/**
 * @param {String} innerTypes
 * @returns {[String, String]}
 */
function splitGenericTypes(innerTypes) {
  let depth = 0;
  let splitIndex = 0;

  for (let i = 0; i < innerTypes.length; i++) {
    if (innerTypes[i] === "<") {
      depth++;
    } else if (innerTypes[i] === ">") {
      depth--;
    } else if (innerTypes[i] === "," && depth === 0) {
      splitIndex = i;
      break;
    }
  }

  return [
    innerTypes.substring(0, splitIndex).trim(),
    innerTypes.substring(splitIndex + 1).trim(),
  ];
}

/**
 * @template T
 * @param {T} javaType
 * @returns {T}
 */
// export function javaTypeToClassName(javaType) {
//   return typeof javaType === "string" ? javaType.split(".").at(-1) : javaType;
// }
