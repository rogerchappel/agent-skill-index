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

test("parses fenced examples consistently with LF and CRLF newlines", () => {
  const markdown = `# demo

Demo description.

## When To Use

Use for a newline compatibility test.

## Required Tools

- node

## Side-Effect Boundaries

None.

## Approval Requirements

None.

## Examples

\`\`\`bash
echo ok
\`\`\`

## Validation Workflow

Run tests.
`;
  const lf = parseSkillMarkdown(markdown, { directory: "lf-demo" });
  const crlf = parseSkillMarkdown(markdown.replaceAll("\n", "\r\n"), { directory: "crlf-demo" });

  assert.deepEqual(crlf.examples, lf.examples);
  assert.deepEqual(crlf.examples, ["echo ok"]);
  assert.doesNotMatch(crlf.warnings.join("; "), /Missing examples/);
});

test("ignores heading-like text inside fenced examples with LF and CRLF", () => {
  const markdown = `# demo

Demo description.

## Required Tools

- node

## Examples

\`\`\`markdown
## Tools
- destructive-example-only
\`\`\`

## Validation Workflow

Run tests.
`;

  for (const source of [markdown, markdown.replaceAll("\n", "\r\n")]) {
    const skill = parseSkillMarkdown(source);
    assert.deepEqual(skill.requiredTools, ["node"]);
    assert.deepEqual(skill.examples, ["## Tools\n- destructive-example-only"]);
  }
});

test("merges repeated and aliased metadata sections in source order", () => {
  const skill = parseSkillMarkdown(`# demo

Demo description.

## Required Tools

- node

## Tools

- git

## Example

\`\`\`sh
echo first
\`\`\`

## Examples

\`\`\`sh
echo second
\`\`\`
`);

  assert.deepEqual(skill.requiredTools, ["node", "git"]);
  assert.deepEqual(skill.examples, ["echo first", "echo second"]);
});

test("uses leading YAML frontmatter for skill name and description", () => {
  const skill = parseSkillMarkdown(`---
name: frontmatter-demo
description: A skill described by frontmatter.
---

## When To Use

Use it when frontmatter metadata is available.
`, { directory: "fixture-directory" });

  assert.equal(skill.name, "frontmatter-demo");
  assert.equal(skill.description, "A skill described by frontmatter.");
  assert.equal(skill.whenToUse, "Use it when frontmatter metadata is available.");
});

test("decodes quoted frontmatter scalars", () => {
  const skill = parseSkillMarkdown(`---
name: 'quoted-skill'
description: "A quoted description."
---
`);

  assert.equal(skill.name, "quoted-skill");
  assert.equal(skill.description, "A quoted description.");
});

test("falls back to Markdown metadata when frontmatter is absent or malformed", () => {
  const absent = parseSkillMarkdown(`# heading-name

Heading description.
`);
  const malformed = parseSkillMarkdown(`---
name frontmatter-name
description frontmatter-description
---

# fallback-name

Fallback description.
`);

  assert.equal(absent.name, "heading-name");
  assert.equal(absent.description, "Heading description.");
  assert.equal(malformed.name, "fallback-name");
  assert.equal(malformed.description, "Fallback description.");
});

test("builds deterministic index from fixture skills", async () => {
  const index = await buildSkillIndex("test/fixtures/skills", {
    generatedAt: "2026-06-08T00:00:00.000Z"
  });

  assert.equal(index.skillCount, 3);
  assert.equal(index.skills[0].name, "frontmatter-fixture");
  assert.equal(index.skills[0].description, "Fixture metadata from YAML frontmatter.");
  assert.equal(index.skills[0].slug, "frontmatter-skill");
  assert.equal(index.skills[1].slug, "repo-review");
  assert.equal(index.skills[2].slug, "thin-skill");
  assert.ok(index.warningCount > 0);
});

test("renders a markdown catalog with warning summaries", async () => {
  const index = await buildSkillIndex("test/fixtures/skills", {
    generatedAt: "2026-06-08T00:00:00.000Z"
  });
  const catalog = renderMarkdownCatalog(index);

  assert.match(catalog, /# Agent Skill Catalog/);
  assert.match(catalog, /## frontmatter-fixture/);
  assert.match(catalog, /Fixture metadata from YAML frontmatter\./);
  assert.doesNotMatch(catalog, /description: Fixture metadata/);
  assert.match(catalog, /## repo-review/);
  assert.match(catalog, /Missing required tools/);
});
