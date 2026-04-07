#!/usr/bin/env node
import { compile } from "../lib/cli.js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    input: {
      type: "string",
      short: "i",
    },
    output: {
      type: "string",
      short: "o",
    },
  },
});

const { input, output } = values;

if (!input || !output) {
  console.error("Usage: jyst -i <inputDir> -o <outputDir>");
  console.error("   or: jyst --input <inputDir> --output <outputDir>");
  process.exit(1);
}

try {
  await compile(input, output);
} catch (error) {
  console.error("An error occurred:", error);
  process.exit(1);
}
