import ts from "typescript";
// import fs from "node:fs";

/**
 * @param {String} src
 */
export function checkMissingTypeImports(src) {
  const sourceFile = ts.createSourceFile(
    "name",
    src,
    99, //ts.ScriptTarget.Latest,
    true,
  );
  /**
   * @type {Set<String>}
   */
  const typeReferences = new Set();
  function collectTypeReferences(node) {
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.text;
      typeReferences.add(typeName);
    }

    ts.forEachChild(node, (node) => collectTypeReferences(node));
  }
  ts.forEachChild(sourceFile, (node) => collectTypeReferences(node));

  return typeReferences;
}

// function addTypeImports(sourceFile, typeNames) {
//   // Create import specifiers for each type name
//   const importSpecifiers = typeNames.map((typeName) =>
//     ts.factory.createImportSpecifier(
//       false,
//       undefined,
//       ts.factory.createIdentifier(typeName),
//     ),
//   );
//
//   // Create a NamedImports node with the import specifiers
//   const namedImports = ts.factory.createNamedImports(importSpecifiers);
//
//   // Create an ImportClause for the named imports (type-only)
//   const importClause = ts.factory.createImportClause(
//     false,
//     undefined,
//     namedImports,
//   );
//
//   // Create the ImportDeclaration with the ImportClause and module path
//
//   const importDeclaration = ts.factory.createImportDeclaration(
//     undefined,
//     undefined,
//     importClause,
//     ts.factory.createStringLiteral("./user.d.ts"),
//     true, // isTypeOnly
//   );
//
//   // Create a new array of statements, with the type import added
//   const newStatements = ts.factory.createNodeArray([
//     importDeclaration,
//     ...sourceFile.statements,
//   ]);
//   console.log({ newStatements });
//
//   // Create a new source file with the updated statements
//   return ts.factory.updateSourceFile(sourceFile, newStatements);
// }

// const src = `export interface AddPromotion {
//   promotions?: Promotion[];
// }
// `;
//
// const sourceFile = ts.createSourceFile(
//   "name",
//   src,
//   99, //ts.ScriptTarget.Latest,
//   true,
// );
//
// console.log(checkMissingTypeImports(sourceFile));
//
// const printer = ts.createPrinter({ newLine: 1 /*ts.NewLineKind.LineFeed*/ });
// console.log(addTypeImports(sourceFile, checkMissingTypeImports(sourceFile)));
