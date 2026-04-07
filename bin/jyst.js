#!/usr/bin/env node
import { compile } from "../lib/cli.js";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version, description } = require("../package.json");

const TAGLINE = "Java YAML Schema → TypeScript";

const HELP = `
jyst · ${TAGLINE}
${description}

Usage: jyst -i <inputDir> -o <outputDir>

Options:
  -i, --input   Input directory containing YAML schema files
  -o, --output  Output directory for TypeScript files
  -v, --version Print version
  -h, --help    Show this help message
`.trim();

const { values } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o" },
    version: { type: "boolean", short: "v" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.version) {
  console.log(`jyst v${version}`);
  process.exit(0);
}

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const { input, output } = values;

if (!input || !output) {
  console.error("Error: --input and --output are required.\n");
  console.error(HELP);
  process.exit(1);
}

console.log(`jyst · ${TAGLINE}`);
console.log(`${description}\n`);
console.log(`  input   ${input}`);
console.log(`  output  ${output}\n`);

const start = Date.now();

function onProgress(current, total, fileName) {
  const pad = String(total).length;
  process.stdout.write(
    `\r  [${String(current).padStart(pad)}/${total}] ${fileName}`.padEnd(72),
  );
}

try {
  const { count } = await compile(input, output, { onProgress });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  process.stdout.write("\r" + " ".repeat(72) + "\r");
  console.log(`✓  ${count} files generated in ${elapsed}s`);
} catch (error) {
  process.stdout.write("\n");
  console.error(`\n✗  ${error.message}`);
  if (process.env.DEBUG) console.error(error);
  process.exit(1);
}
