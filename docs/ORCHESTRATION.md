# Orchestration

## Agent Flow

1. Point `agent-skill-index` at a local skill directory.
2. Review warnings for missing safety, approval, example, and validation sections.
3. Attach the generated JSON index to agent routing logic.
4. Attach the generated Markdown catalog to human-facing docs or pull requests.

## Inputs

- A directory containing one folder per skill.
- Each skill folder should contain a `SKILL.md`.
- The command reads only files below the supplied root.

## Outputs

- JSON index with normalized metadata, warnings, and source paths.
- Markdown catalog grouped as a flat list for quick review.

## Side Effects

- Writes only the files passed with `--out` and `--docs`.
- Does not call external services.
- Does not install or execute skills.

## Verification

Run:

```bash
npm test
npm run check
npm run smoke
```
