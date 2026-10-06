#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const output = execFileSync("npm", ["pack", "--json", "--dry-run"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const [packument] = JSON.parse(output);
const packedFiles = new Set(packument.files.map(({ path }) => path));
const requiredFiles = new Set([
  "README.md",
  "LICENSE",
  "SKILL.md",
  "src/index.js",
  "bin/agent-skill-index.js",
  "docs/PRD.md",
]);

if (packageJson.main) requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
for (const entry of Object.values(
  typeof packageJson.bin === "string" ? { cli: packageJson.bin } : packageJson.bin ?? {},
)) {
  requiredFiles.add(entry.replace(/^\.\//, ""));
}

const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));
if (missing.length) {
  console.error(`Package content check failed; missing required artifact(s):\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Package content check passed (${requiredFiles.size} required artifacts in ${packedFiles.size} packed files).`);
}
