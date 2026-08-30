import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const cli = path.resolve("bin/agent-skill-index.js");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd,
    encoding: "utf8"
  });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

test("accepts zero or one skills directory", () => {
  const defaultResult = runCli([]);
  const explicitResult = runCli(["test/fixtures/skills"]);

  assert.equal(defaultResult.status, 0, defaultResult.stderr);
  assert.equal(JSON.parse(defaultResult.stdout).root, process.cwd());
  assert.equal(explicitResult.status, 0, explicitResult.stderr);
  assert.equal(JSON.parse(explicitResult.stdout).skillCount, 3);
});

test("rejects surplus skills directories before producing output", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "agent-skill-index-cli-"));
  const jsonPath = path.join(outputDir, "index.json");
  const docsPath = path.join(outputDir, "SKILLS.md");
  const result = runCli([
    "test/fixtures/skills",
    "another-skills-directory",
    "--out",
    jsonPath,
    "--docs",
    docsPath
  ]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Expected at most one skills directory, received 2\./);
  assert.equal(await exists(jsonPath), false);
  assert.equal(await exists(docsPath), false);
});

test("rejects colliding output paths without creating or overwriting output", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "agent-skill-index-cli-"));
  const existingPath = path.join(outputDir, "catalog");
  await writeFile(existingPath, "keep me\n");

  const existingResult = runCli([
    "test/fixtures/skills",
    "--out",
    existingPath,
    "--docs",
    path.join(outputDir, ".", "catalog")
  ]);
  const missingPath = path.join(outputDir, "missing");
  const missingResult = runCli([
    "test/fixtures/skills",
    "--out",
    missingPath,
    "--docs",
    missingPath
  ]);

  for (const result of [existingResult, missingResult]) {
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /--out and --docs must resolve to distinct paths\./);
  }
  assert.equal(await readFile(existingPath, "utf8"), "keep me\n");
  assert.equal(await exists(missingPath), false);
});

test("writes valid JSON and Markdown to distinct output paths", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "agent-skill-index-cli-"));
  const jsonPath = path.join(outputDir, "index.json");
  const docsPath = path.join(outputDir, "SKILLS.md");
  const result = runCli([
    "test/fixtures/skills",
    "--out",
    jsonPath,
    "--docs",
    docsPath
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(await readFile(jsonPath, "utf8")).skillCount, 3);
  assert.match(await readFile(docsPath, "utf8"), /^# Agent Skill Catalog/m);
});
