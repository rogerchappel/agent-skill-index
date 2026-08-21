# agent-skill-index

Generate a searchable catalog for local agent skills. The CLI scans skill folders, extracts common safety and usage metadata from `SKILL.md`, writes a JSON index for agents, and can also render a human-readable Markdown catalog.

Requires Node.js 20 or newer. CI verifies the release gate on Node.js 20 and
the current Node.js runtime.

## Quickstart

```bash
npm ci
npm run smoke
node bin/agent-skill-index.js ./examples/skills --out tmp/skill-index.json --docs tmp/SKILLS.md
```

Use it against your own skills:

```bash
npx agent-skill-index ~/.codex/skills --out skill-index.json --docs SKILLS.md --fail-on-warnings
```

The CLI accepts zero or one skills directory. With no directory it scans the
current directory. Supplying more than one directory exits with status 2,
prints an error to stderr, and does not create JSON or Markdown output files.

## What It Extracts

- Name, slug, description, and source path.
- When-to-use guidance.
- Required tools and inputs.
- Side-effect boundaries and approval requirements.
- Examples and validation workflow.
- Safety level inferred from side effects, approvals, and tools.
- Warnings for missing metadata.

### Skill Metadata Forms

Skills may provide `name` and `description` as plain, single-quoted, or
double-quoted scalar values in a YAML frontmatter block at the very start of
`SKILL.md`:

```markdown
---
name: release-readiness
description: Check whether a package is ready to release.
---
```

Frontmatter values take precedence over Markdown title and description
fallbacks. The frontmatter block is metadata and is never included as catalog
prose. If the block is malformed, the parser ignores its values and uses the
existing Markdown heading and body fallbacks. Other skill fields continue to
come from their documented Markdown sections. Skill files may use either LF or
CRLF line endings, including around fenced code blocks in `Examples` sections.

## Library API

```js
import { buildSkillIndex, renderMarkdownCatalog } from "agent-skill-index";

const index = await buildSkillIndex("./skills");
const docs = renderMarkdownCatalog(index);
```

## Safety Notes

This project is local-first. It reads only under the skill root you provide and writes only the explicit `--out` and `--docs` targets. It does not install, execute, publish, or modify skills.


## Verification

Run the local quality gates before opening a pull request:

```sh
npm ci
npm run lint
npm test
npm run smoke
```

`npm run lint` is an alias for the repository static check so contributors can use the common npm workflow without guessing the project-specific command.

## Limitations

- V1 parses common Markdown headings and scalar `name` and `description`
  frontmatter, not every possible custom schema or YAML collection/block form.
- Safety level is a heuristic and should be reviewed by a human or a stricter policy engine for high-risk workflows.

## Verification

```bash
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Security

See [SECURITY.md](SECURITY.md).

## Release Verification

Before publishing or tagging a release, run the same verification path used by CI:

- `npm run release:check`
- `npm run package:smoke`

See `docs/release-readiness.md` for the package surface, CLI bins, and reviewer checklist.
