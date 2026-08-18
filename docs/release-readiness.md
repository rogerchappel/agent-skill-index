# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust the package surface.

## Package Surface

- Package: `agent-skill-index`
- Runtime: Node.js 20 or newer; CI runs this checklist on Node.js 20 and 24.
- Repository: `https://github.com/rogerchappel/agent-skill-index`
- Pack contents are constrained by the `files` allowlist in `package.json`.
- ESM library entry: `agent-skill-index` -> `src/index.js`
- Documented exports: `buildSkillIndex`, `parseSkillMarkdown`, and `renderMarkdownCatalog`

## CLI Surface

- `agent-skill-index` -> `bin/agent-skill-index.js`

## Verification Commands

- `npm ci`: installs the exact dependency tree recorded in `package-lock.json`
- `npm run check`: `node --check src/index.js && node --check bin/agent-skill-index.js`
- `npm run test`: `node --test`
- `npm run build`: `npm run check`
- `npm run smoke`: `node bin/agent-skill-index.js test/fixtures/skills --out tmp/skill-index.json --docs tmp/SKILLS.md && test -s tmp/skill-index.json && test -s tmp/SKILLS.md`
- `npm run package:smoke`: packs and installs the tarball in a temporary consumer, calls the documented ESM exports, invokes the installed CLI help and catalog paths, and verifies support files
- `npm run release:check`: `npm test && npm run check && npm run smoke && npm run package:smoke`

Start from a clean checkout with `npm ci`, then run `npm run release:check`
before opening a release PR. Record any skipped command and the reason in the
PR body.

## Reviewer Notes

- Compare README examples with the current CLI bins or module exports.
- Inspect the reported tarball contents for generated logs, caches, or private fixtures.
- Confirm CI exercises the same release check path used locally.
