import ts from "typescript";
import { format } from "prettier";

/**
 * @param {String} source
 * @param {Map<String, String>} interfacesMap
 */
export function resolveInterfaceImports(source, interfacesMap) {
  const missingTypes = checkMissingTypeImports(source);

  const missingImports = Array.from(missingTypes)
    .map(
      (dep) => `import type { ${dep} } from "./${interfacesMap.get(dep)}.ts";`,
    )
    .join("\n");
  // https://github.com/bcherny/json-schema-to-typescript/issues/193
  return format(missingImports + "\n" + source, {
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
