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
  console.error("Usage: sift-schema -i <inputDir> -o <outputDir>");
  console.error("   or: sift-schema --input <inputDir> --output <outputDir>");
  process.exit(1);
}

try {
  await compile(input, output);
} catch (error) {
  console.error("An error occurred:", error);
  process.exit(1);
}
