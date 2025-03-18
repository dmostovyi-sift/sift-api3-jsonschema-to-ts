import { glob } from "tinyglobby";
import {
  resolvePath,
  copySourceDir,
  deleteTempDir,
  SOURCE_TEMP_DIR,
  JSON_TEMP_DIR,
} from "./io.js";
import {
  cleanupScheme,
  fixCircularReferences,
  javaTypeToModuleName,
  normalizeRequiredFields,
  normalizeSchemaInternalReferences,
  normalizeSchemaTitle,
  normalizeTypeReference,
  removeTitleJsonSuffixe,
  transformJavaTypesToJsonSchema,
} from "./transformers.js";
import { compileJsonScheme } from "./json_schema.js";
import { File } from "./file.js";
import { FileTransformer } from "./file_transformer.js";

export async function compile(input, output) {
  const inputDir = resolvePath(input);
  const outputDir = resolvePath(output);

  deleteTempDir();
  copySourceDir(inputDir);

  const paths = await glob("**/*.yaml", { cwd: SOURCE_TEMP_DIR });
  const files = await Promise.all(
    paths.map((path) => File.readYaml(path, SOURCE_TEMP_DIR)),
  );

  // account -> File
  const filesCollection = new Map(files.map((file) => [file.name, file]));
  // AbuseTypeJsonAbuseType -> abuse_type.json#/properties/abuse_type
  const referenceCollection = buildReferencesMap(files);

  for (const file of files) {
    FileTransformer.fromFile(file)
      .map(removeTitleJsonSuffixe)
      .map(normalizeRequiredFields)
      .traverse(normalizeSchemaTitle)
      .traverse(normalizeSchemaInternalReferences)
      .traverse(fixCircularReferences(filesCollection))
      .traverse(cleanupScheme)
      .traverse(transformJavaTypesToJsonSchema(referenceCollection))
      .map(normalizeTypeReference(filesCollection))
      .file();
  }

  for (const file of files) {
    file.saveJson(JSON_TEMP_DIR);
  }

  // Account -> File
  const moduleCollection = new Map(files.map((file) => [file.module, file]));
  for await (const file of files) {
    await compileJsonScheme(file, moduleCollection);
  }

  for await (const file of files) {
    file.saveTS(outputDir);
  }
}

/**
 * @param {ProcessedFile[]} files
 * @returns {Map<String, String>}
 */
function buildReferencesMap(files) {
  const referencesMap = new Map();

  /**
   * @param {Object} obj
   * @param {String} currentPath
   * @returns {String[]}
   */
  function traverse(obj, currentPath = "") {
    /**
     * @type {String[]}
     */
    let paths = [];

    function shouldSkipPathSegment(key) {
      return key === "items" || key === "properties";
    }

    function buildNextPath(currentPath, key) {
      if (shouldSkipPathSegment(key)) {
        return currentPath;
      }
      return currentPath ? `${currentPath}/${key}` : key;
    }

    for (const key in obj) {
      const nextPath = buildNextPath(currentPath, key);
      const value = obj[key];
      const isNestedObject = value && typeof value === "object";

      const hasJavaType = isNestedObject && "javaType" in value;
      const hasEnumOrProperties =
        isNestedObject && ("enum" in value || "properties" in value);

      if (hasJavaType && hasEnumOrProperties) {
        paths.push(`${nextPath}#${value.javaType}`);
      } else if (obj[key] && typeof obj[key] === "object") {
        const nestedPaths = traverse(value, nextPath);
        paths = paths.concat(nestedPaths);
      }
    }

    return paths;
  }

  for (const file of files) {
    referencesMap.set(
      javaTypeToModuleName(file.json.javaType).module,
      file.name + ".json",
    );

    const nestedRefs = traverse(file.json.properties);
    for (const nestedRef of nestedRefs) {
      const [path, type] = nestedRef.split("#");
      referencesMap.set(
        javaTypeToModuleName(type).module,
        `${file.name}.json#/properties/${path}`,
      );
    }
  }

  return referencesMap;
}
