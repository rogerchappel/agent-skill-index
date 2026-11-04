#!/usr/bin/env node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "agent-skill-index-smoke-"));
const jsonPath = path.join(temporaryDirectory, "skill-index.json");
const docsPath = path.join(temporaryDirectory, "SKILLS.md");

try {
  const result = spawnSync(
    process.execPath,
    [path.join(repository, "bin/agent-skill-index.js"), path.join(repository, "test/fixtures/skills"), "--out", jsonPath, "--docs", docsPath],
    { cwd: repository, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exitCode = result.status ?? 1;
  } else {
    for (const output of [jsonPath, docsPath]) {
      if ((await readFile(output, "utf8")).length === 0) {
        throw new Error(`Smoke output is empty: ${output}`);
      }
    }
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
