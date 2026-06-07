import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSkillIndex, parseSkillMarkdown, renderMarkdownCatalog } from "../src/index.js";

test("parses skill sections into normalized metadata", () => {
  const skill = parseSkillMarkdown(`# demo

Demo description.

## When To Use

- When a demo is needed.

## Required Tools

- node

## Side-Effect Boundaries

- Local writes only.

## Approval Requirements

- Ask before publishing.

## Examples

\`\`\`bash
demo run
\`\`\`

## Validation Workflow

Run tests.
`);

  assert.equal(skill.name, "demo");
  assert.deepEqual(skill.requiredTools, ["node"]);
  assert.equal(skill.examples[0], "demo run");
  assert.equal(skill.safetyLevel, "high");
  assert.deepEqual(skill.warnings, []);
});

test("builds deterministic index from fixture skills", async () => {
  const index = await buildSkillIndex("test/fixtures/skills", {
    generatedAt: "2026-06-08T00:00:00.000Z"
  });

  assert.equal(index.skillCount, 2);
  assert.equal(index.skills[0].slug, "repo-review");
  assert.equal(index.skills[1].slug, "thin-skill");
  assert.ok(index.warningCount > 0);
});

test("renders a markdown catalog with warning summaries", async () => {
  const index = await buildSkillIndex("test/fixtures/skills", {
    generatedAt: "2026-06-08T00:00:00.000Z"
  });
  const catalog = renderMarkdownCatalog(index);

  assert.match(catalog, /# Agent Skill Catalog/);
  assert.match(catalog, /## repo-review/);
  assert.match(catalog, /Missing required tools/);
});
