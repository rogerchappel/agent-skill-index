# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust the package surface.

## Package Surface

- Package: `agent-skill-index`
- Repository: `https://github.com/rogerchappel/agent-skill-index`
- Pack contents are constrained by the `files` allowlist in `package.json`.

## CLI Surface

- `agent-skill-index` -> `bin/agent-skill-index.js`

## Verification Commands

- `npm run check`: `node --check src/index.js && node --check bin/agent-skill-index.js`
- `npm run test`: `node --test`
- `npm run build`: `npm run check`
- `npm run smoke`: `node bin/agent-skill-index.js test/fixtures/skills --out tmp/skill-index.json --docs tmp/SKILLS.md && test -s tmp/skill-index.json && test -s tmp/SKILLS.md`
- `npm run package:smoke`: `npm pack --dry-run`
- `npm run release:check`: `npm test && npm run check && npm run smoke && npm run package:smoke`

Run `npm run release:check` before opening a release PR. Record any skipped command and the reason in the PR body.

## Reviewer Notes

- Compare README examples with the current CLI bins or module exports.
- Inspect `npm pack --dry-run` output for generated logs, caches, or private fixtures.
- Confirm CI exercises the same release check path used locally.
