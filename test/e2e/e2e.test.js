import test, { describe, before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import { compile } from "../../lib/cli.js";
import { glob } from "tinyglobby";

const FIXTURES_DIR = path.resolve("test/e2e/fixtures");
const GOLDEN_DIR = path.resolve("test/e2e/golden");
const OUTPUT_DIR = path.resolve("test/e2e/output");

describe("E2E Compilation", () => {
  before(async () => {
    // Ensure output dir is empty
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  });

  test("should generate typescript files matching golden standard", async () => {
    await compile(FIXTURES_DIR, OUTPUT_DIR);

    const goldenFiles = await glob("**/*.ts", { cwd: GOLDEN_DIR });
    const outputFiles = await glob("**/*.ts", { cwd: OUTPUT_DIR });

    assert.equal(
      goldenFiles.length,
      outputFiles.length,
      "Number of generated files should match",
    );

    // Sort to ensure order matches
    goldenFiles.sort();
    outputFiles.sort();

    for (let i = 0; i < goldenFiles.length; i++) {
      assert.equal(outputFiles[i], goldenFiles[i], "File list should match");

      const goldenContent = await fs.readFile(
        path.join(GOLDEN_DIR, goldenFiles[i]),
        "utf-8",
      );
      const outputContent = await fs.readFile(
        path.join(OUTPUT_DIR, outputFiles[i]),
        "utf-8",
      );

      assert.equal(
        outputContent,
        goldenContent,
        `Content of ${outputFiles[i]} should match golden standard`,
      );
    }
  });
});
