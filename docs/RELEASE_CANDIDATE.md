# Release Candidate Notes

## Classification

Ship.

## Included

- Local-first CLI for indexing `SKILL.md` directories.
- JSON index output for agent routing.
- Markdown catalog output for review and documentation.
- Required metadata warnings for safety and validation gaps.
- Fixture-backed parser, index, and rendering tests.

## Verification

```bash
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

The package smoke should show the CLI, source, docs, skill file, README, license,
security policy, and contribution guide in the dry-run tarball contents.

## Known Limits

- Section parsing intentionally supports common Markdown headings rather than a strict schema.
- Frontmatter is not yet parsed.
- Catalog grouping is flat in V1.
