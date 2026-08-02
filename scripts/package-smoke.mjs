#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const smokeRoot = await mkdtemp(path.join(tmpdir(), `${packageJson.name}-package-smoke-`));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", smokeRoot], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  const [packument] = JSON.parse(output);
  const packedFiles = new Set(packument.files.map((file) => file.path));
  const requiredFiles = new Set([
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "SKILL.md",
    "docs/release-readiness.md",
    "docs/RELEASE_VERIFICATION.md",
  ]);

  if (packageJson.main) {
    requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
  }

  const binEntries =
    typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {});

  for (const binEntry of binEntries) {
    requiredFiles.add(binEntry.replace(/^\.\//, ""));
  }

  const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));

  if (missing.length > 0) {
    console.error(`${packageJson.name} package smoke failed; missing packed file(s):`);
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    process.exitCode = 1;
  } else {
    await smokeInstalledPackage(smokeRoot, path.join(smokeRoot, packument.filename));
    console.log(
      `${packageJson.name} package smoke passed with ${packument.files.length} packed file(s).`,
    );
  }
} finally {
  await rm(smokeRoot, { recursive: true, force: true });
}

async function smokeInstalledPackage(smokeRoot, tarballPath) {
  const consumerRoot = path.join(smokeRoot, "consumer");
  const fixtureRoot = path.join(consumerRoot, "skills");
  const fixtureSkillRoot = path.join(fixtureRoot, "package-smoke");
  const indexPath = path.join(consumerRoot, "skill-index.json");
  const docsPath = path.join(consumerRoot, "SKILLS.md");

  await mkdir(fixtureSkillRoot, { recursive: true });
  await writeFile(
    path.join(fixtureSkillRoot, "SKILL.md"),
    `---
name: installed-frontmatter-skill
description: Verify frontmatter through the installed package surface.
---

## When To Use

Use this fixture during package verification.
`,
  );
  await writeFile(
    path.join(consumerRoot, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );

  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
    { cwd: consumerRoot, stdio: "inherit" },
  );

  const librarySmoke = `
    import assert from "node:assert/strict";
    import { buildSkillIndex, renderMarkdownCatalog } from "${packageJson.name}";

    const index = await buildSkillIndex(process.env.PACKAGE_SMOKE_FIXTURE_ROOT, {
      generatedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(index.skillCount, 1);
    assert.equal(index.skills[0].name, "installed-frontmatter-skill");
    assert.equal(index.skills[0].description, "Verify frontmatter through the installed package surface.");
    const catalog = renderMarkdownCatalog(index);
    assert.match(catalog, /## installed-frontmatter-skill/);
    assert.doesNotMatch(catalog, /description: Verify frontmatter/);
  `;
  execFileSync(process.execPath, ["--input-type=module", "--eval", librarySmoke], {
    cwd: consumerRoot,
    env: { ...process.env, PACKAGE_SMOKE_FIXTURE_ROOT: fixtureRoot },
    stdio: "inherit",
  });

  const binPath = path.join(consumerRoot, "node_modules", ".bin", "agent-skill-index");
  execFileSync(binPath, [fixtureRoot, "--out", indexPath, "--docs", docsPath], {
    cwd: consumerRoot,
    stdio: "inherit",
  });

  const cliIndex = JSON.parse(await readFile(indexPath, "utf8"));
  const cliDocs = await readFile(docsPath, "utf8");
  if (
    cliIndex.skillCount !== 1 ||
    cliIndex.skills[0].name !== "installed-frontmatter-skill" ||
    cliIndex.skills[0].description !== "Verify frontmatter through the installed package surface." ||
    !cliDocs.includes("## installed-frontmatter-skill") ||
    cliDocs.includes("description: Verify frontmatter")
  ) {
    throw new Error("installed CLI did not generate the expected catalog");
  }
}
