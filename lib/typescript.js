import ts from "typescript";
import { format } from "prettier";
import path from "node:path";

/**
 * @param {import("./file").File} file
 * @param {Map<String, import("./file").File>} interfacesMap
 */
export function resolveInterfaceImports(file, interfacesMap) {
  const missingTypes = checkMissingTypeImports(file.typescript);

  const missingImports = Array.from(missingTypes)
    .map((dep) => {
      const targetFile = interfacesMap.get(dep);
      if (!targetFile) {
        console.warn(`Could not resolve import for type: ${dep}`);
        return "";
      }

      const currentDir = file.dirpath === "." ? "" : file.dirpath;
      const targetDir = targetFile.dirpath === "." ? "" : targetFile.dirpath;

      let relativePath = path.relative(currentDir, targetDir);

      if (relativePath === "") {
        relativePath = ".";
      } else if (!relativePath.startsWith(".")) {
        relativePath = "./" + relativePath;
      }

      return `import type { ${dep} } from "${relativePath}/${targetFile.name}.ts";`;
    })
    .join("\n");
  // https://github.com/bcherny/json-schema-to-typescript/issues/193
  return format(missingImports + "\n" + file.typescript, {
    parser: "typescript",
    tabWidth: 2,
    singleQuote: true,
    trailingComma: "es5",
  });
}

/**
 * @param {String} source
 */
export function checkMissingTypeImports(source) {
  const sourceFile = ts.createSourceFile(
    "name",
    source,
    99, //ts.ScriptTarget.Latest,
    true,
  );
  /**
   * @type {Set<String>}
   */
  const interfaceReferences = new Set();
  /**
   * @type {Set<String>}
   */
  const typeReferences = new Set();

  /**
   * @param {import("typescript").Node} node
   */
  function collectTypeReferences(node) {
    if (ts.isTypeReferenceNode(node)) {
      typeReferences.add(node.typeName.text);
    }

    if (ts.isInterfaceDeclaration(node)) {
      interfaceReferences.add(node.name.text);

      if (node.typeParameters) {
        node.typeParameters.forEach((typeParam) => {
          interfaceReferences.add(typeParam.name.text); // Capture the generic type name
        });
      }
    }

    ts.forEachChild(node, (node) => collectTypeReferences(node));
  }
  ts.forEachChild(sourceFile, (node) => collectTypeReferences(node));

  return typeReferences.difference(interfaceReferences);
}

/**
 * @param {String} source
 */
export function getInterfaceName(source) {
  const sourceFile = ts.createSourceFile(
    "name",
    source,
    99, //ts.ScriptTarget.Latest,
    true,
  );
  /**
   * @type {Array<String>}
   */
  const interfaceReferences = [];

  function collectInterfaceReferences(node) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      interfaceReferences.push(node.name.text);
    }

    node.forEachChild(collectInterfaceReferences);
  }

  ts.forEachChild(sourceFile, collectInterfaceReferences);

  return interfaceReferences;
}
