#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSkillIndex, renderMarkdownCatalog } from "../src/index.js";

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const root = args.positionals[0] ?? ".";
  const index = await buildSkillIndex(root);
  const json = `${JSON.stringify(index, null, 2)}\n`;

  if (args.out) {
    await writeOutput(args.out, json);
  } else {
    process.stdout.write(json);
  }

  if (args.docs) {
    await writeOutput(args.docs, renderMarkdownCatalog(index));
  }

  if (args.failOnWarnings && index.warningCount > 0) {
    throw new CliError(`Found ${index.warningCount} skill metadata warning(s).`, 2);
  }
}

function parseArgs(argv) {
  const parsed = { positionals: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") parsed.help = true;
    else if (value === "--out") parsed.out = requireValue(argv, index += 1, "--out");
    else if (value === "--docs") parsed.docs = requireValue(argv, index += 1, "--docs");
    else if (value === "--fail-on-warnings") parsed.failOnWarnings = true;
    else if (value.startsWith("--")) throw new CliError(`Unknown option: ${value}`, 2);
    else parsed.positionals.push(value);
  }
  return parsed;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new CliError(`${flag} requires a value`, 2);
  return value;
}

async function writeOutput(filePath, contents) {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await writeFile(filePath, contents);
}

function printHelp() {
  process.stdout.write(`agent-skill-index

Usage:
  agent-skill-index <skills-dir> [--out skill-index.json] [--docs SKILLS.md] [--fail-on-warnings]

Options:
  --out <path>          Write JSON index to a file.
  --docs <path>         Write Markdown catalog to a file.
  --fail-on-warnings    Exit with code 2 if any required metadata is missing.
  --help                Show this help.
`);
}

class CliError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code ?? 1;
});
