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
