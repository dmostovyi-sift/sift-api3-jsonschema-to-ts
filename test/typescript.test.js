import { describe, it } from "node:test";
import assert from "node:assert";
import {
  checkMissingTypeImports,
  getInterfaceName,
  resolveInterfaceImports,
} from "../lib/typescript.js";

describe("typescript", () => {
  describe("getInterfaceName", () => {
    it("should extract interface name", () => {
      const source = "export interface MyInterface { prop: string; }";
      const names = getInterfaceName(source);
      assert.deepStrictEqual(names, ["MyInterface"]);
    });

    it("should extract type alias name", () => {
      const source = "export type MyType = string;";
      const names = getInterfaceName(source);
      assert.deepStrictEqual(names, ["MyType"]);
    });

    it("should extract multiple names", () => {
      const source = `
        export interface Interface1 {}
        export type Type1 = number;
      `;
      const names = getInterfaceName(source);
      assert.deepStrictEqual(names, ["Interface1", "Type1"]);
    });
  });

  describe("checkMissingTypeImports", () => {
    it("should return empty set if no missing imports", () => {
      const source = "export interface MyInterface { prop: string; }";
      const missing = checkMissingTypeImports(source);
      assert.strictEqual(missing.size, 0);
    });

    it("should identify missing type reference", () => {
      const source = "export interface MyInterface { prop: MissingType; }";
      const missing = checkMissingTypeImports(source);
      assert.deepStrictEqual(Array.from(missing), ["MissingType"]);
    });

    it("should not report internal interfaces as missing", () => {
      const source = `
        interface InternalType {}
        export interface MyInterface { prop: InternalType; }
      `;
      const missing = checkMissingTypeImports(source);
      assert.strictEqual(missing.size, 0);
    });

    it("should handle generic type parameters", () => {
      const source = `
        export interface MyInterface<T> { prop: T; }
      `;
      const missing = checkMissingTypeImports(source);
      assert.strictEqual(missing.size, 0);
    });
  });

  describe("resolveInterfaceImports", () => {
    it("should add import for missing type", async () => {
      const file = {
        typescript: "export interface MyInterface { prop: OtherInterface; }",
        dirpath: ".",
      };
      const otherFile = {
        name: "other_interface",
        dirpath: ".",
      };
      const interfacesMap = new Map([["OtherInterface", otherFile]]);

      const result = await resolveInterfaceImports(file, interfacesMap);
      assert.match(
        result,
        /import type \{ OtherInterface \} from ['"]\.\/other_interface.ts['"]/,
      );
    });

    it("should handle imports from different directories", async () => {
      const file = {
        typescript: "export interface MyInterface { prop: OtherInterface; }",
        dirpath: "subdir",
      };
      const otherFile = {
        name: "other_interface",
        dirpath: ".",
      };
      const interfacesMap = new Map([["OtherInterface", otherFile]]);

      const result = await resolveInterfaceImports(file, interfacesMap);
      assert.match(
        result,
        /import type \{ OtherInterface \} from ['"]\.\.\/other_interface.ts['"]/,
      );
    });

    it("should handle imports from same subdirectory", async () => {
      const file = {
        typescript: "export interface MyInterface { prop: OtherInterface; }",
        dirpath: "subdir",
      };
      const otherFile = {
        name: "other_interface",
        dirpath: "subdir",
      };
      const interfacesMap = new Map([["OtherInterface", otherFile]]);

      const result = await resolveInterfaceImports(file, interfacesMap);
      assert.match(
        result,
        /import type \{ OtherInterface \} from ['"]\.\/other_interface.ts['"]/,
      );
    });

    it("should ignore unresolvable types", async () => {
      const file = {
        typescript: "export interface MyInterface { prop: UnresolvableType; }",
        dirpath: ".",
      };
      const interfacesMap = new Map();

      // Mock console.warn to suppress output during test
      const originalWarn = console.warn;
      let warned = false;
      console.warn = (msg) => {
        if (
          msg.includes("Could not resolve import for type: UnresolvableType")
        ) {
          warned = true;
        }
      };

      const result = await resolveInterfaceImports(file, interfacesMap);

      console.warn = originalWarn;

      assert.ok(warned, "Should verify that warning was logged");
      assert.doesNotMatch(result, /import type { UnresolvableType }/);
    });
  });
});
