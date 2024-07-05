import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../lib/transformers.js";
import { title } from "node:process";

describe("transformers", () => {
  test("throws an error if there is no javaType in a top level of a schema", () => {
    assert.throws(() => {
      normalize({
        title: "",
        properties: {
          id: {
            type: "string",
          },
        },
      });
    }, new Error("Schema must have a javaType property"));
  });

  test("jsonSchema title substitutes with parsed javaType", () => {
    const expected = {
      javaType: "com.sift.AccountContentJson<T>",
      title: "AccountContent",
      properties: {},
    };

    const result = normalize({
      javaType: "com.sift.AccountContentJson<T>",
      title: "Account Content",
      properties: {},
    });

    assert.deepEqual(expected, result);
  });

  test('removes "title" from a schema', () => {
    const expected = {
      javaType: "",
      title: "",
      properties: {
        id: {
          type: "string",
          description: "User ID",
        },
        name: {
          type: "string",
          description: "User name description",
        },
      },
    };

    const result = normalize({
      javaType: "",
      properties: {
        id: {
          type: "string",
          title: "User ID",
        },
        name: {
          type: "string",
          title: "User name",
          description: "User name description",
        },
      },
    });

    assert.deepEqual(expected, result);
  });

  test("fixes property path for schema references", () => {
    const expected = {
      javaType: "",
      title: "",
      properties: {
        id: {
          $ref: "account.json#/properties/user/id",
        },
      },
    };

    const result = normalize({
      javaType: "",
      title: "",
      properties: {
        id: {
          $ref: "account.yaml#properties/user/id",
        },
      },
    });

    assert.deepEqual(expected, result);
  });

  test("moves reqired fields to an array", () => {
    const expected = {
      javaType: "",
      title: "",
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        config: {
          type: "object",
          properties: {
            language: {
              type: "string",
            },
            country: {
              type: "string",
            },
            cities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                },
                required: ["name"],
              },
            },
          },
          required: ["language", "cities"],
        },
      },
      required: ["id"],
    };

    const result = normalize({
      javaType: "",
      title: "",
      properties: {
        id: {
          type: "string",
          required: true,
        },
        name: {
          type: "string",
        },
        config: {
          type: "object",
          properties: {
            language: {
              type: "string",
              required: true,
            },
            country: {
              type: "string",
              required: false,
            },
            cities: {
              type: "array",
              required: true,
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    required: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    assert.deepEqual(expected, result);
  });

  test("converts java types to schema types", () => {
    const expected = {
      javaType: "",
      title: "",
      properties: {
        first: {
          type: "array",
          items: { type: "integer" },
        },
        second: {
          enum: ["one", "two"],
        },
        third: {
          properties: {
            subthird: {
              type: "number",
            },
          },
        },
        fourth: {
          additionalProperties: {
            subfourth: {
              type: "number",
            },
          },
        },
      },
    };

    const result = normalize({
      javaType: "",
      title: "",
      properties: {
        first: {
          javaType: "java.util.List<Number>",
        },
        second: {
          javaType: "java.util.List<Number>",
          enum: ["one", "two"],
        },
        third: {
          javaType: "java.util.List<Number>",
          properties: {
            subthird: {
              type: "number",
            },
          },
        },
        fourth: {
          javaType: "java.util.List<Number>",
          additionalProperties: {
            subfourth: {
              type: "long",
            },
          },
        },
      },
    });

    assert.deepEqual(expected, result);
  });
});
