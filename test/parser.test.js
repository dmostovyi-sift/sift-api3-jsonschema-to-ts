import test from "node:test";
import assert from "node:assert";
import { javaTypeToJsonScheme } from "../lib/parser.js";

test("javaType should be parsed correctly", () => {
  assert.deepEqual(javaTypeToJsonScheme(), null);
  assert.deepEqual(javaTypeToJsonScheme(""), null);
  assert.deepEqual(javaTypeToJsonScheme("Number"), { type: "integer" });
  assert.deepEqual(javaTypeToJsonScheme("String"), { type: "string" });
  assert.deepEqual(javaTypeToJsonScheme("Boolean"), { type: "boolean" });
  assert.deepEqual(javaTypeToJsonScheme("java.util.List<Number>"), {
    type: "array",
    items: { type: "integer" },
  });
  assert.deepEqual(
    javaTypeToJsonScheme("java.util.Set<java.util.Map<String, Number>>"),
    {
      type: "array",
      items: {
        type: "object",
        additionalProperties: {
          type: "integer",
        },
      },
    },
  );
  assert.deepEqual(
    javaTypeToJsonScheme(
      "java.util.SortedMap<com.sift.com.representations.AbuseTypeJson, java.util.HashMap<String, com.sift.api.representations.RateLimitWithDefaultJson>>",
    ),
    {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {},
      },
    },
  );
  assert.deepEqual(
    javaTypeToJsonScheme(
      "java.util.SortedMap<com.sift.com.representations.AbuseTypeJson, java.util.HashMap<String, com.sift.api.representations.RateLimitWithDefaultJson>>",
      new Map([["RateLimitWithDefaultJson", "rate_limit_with.yaml"]]),
    ),
    {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {
          $ref: "rate_limit_with.yaml",
        },
      },
    },
  );
  assert.deepEqual(
    javaTypeToJsonScheme("java.util.LinkedHashMap<String, Object>"),
    {
      type: "object",
      additionalProperties: {
        anyOf: [
          { type: "string" },
          { type: "integer" },
          { type: "boolean" },
          { type: "null" },
        ],
      },
    },
  );
});
