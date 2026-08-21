import assert from "node:assert/strict";
import { mkdtemp, stat } from "node:fs/promises";
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
