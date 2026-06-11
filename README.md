# agent-skill-index

Generate a searchable catalog for local agent skills. The CLI scans skill folders, extracts common safety and usage metadata from `SKILL.md`, writes a JSON index for agents, and can also render a human-readable Markdown catalog.

## Quickstart

```bash
npm install
npm run smoke
node bin/agent-skill-index.js ./test/fixtures/skills --out tmp/skill-index.json --docs tmp/SKILLS.md
```

Use it against your own skills:

```bash
npx agent-skill-index ~/.codex/skills --out skill-index.json --docs SKILLS.md --fail-on-warnings
```

## What It Extracts

- Name, slug, description, and source path.
- When-to-use guidance.
- Required tools and inputs.
- Side-effect boundaries and approval requirements.
- Examples and validation workflow.
- Safety level inferred from side effects, approvals, and tools.
- Warnings for missing metadata.

## Library API

```js
import { buildSkillIndex, renderMarkdownCatalog } from "agent-skill-index";

const index = await buildSkillIndex("./skills");
const docs = renderMarkdownCatalog(index);
```

## Safety Notes

This project is local-first. It reads only under the skill root you provide and writes only the explicit `--out` and `--docs` targets. It does not install, execute, publish, or modify skills.

## Limitations

- V1 parses common Markdown headings, not every possible custom schema.
- Frontmatter support is planned but not implemented.
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

## Security

See [SECURITY.md](SECURITY.md).
