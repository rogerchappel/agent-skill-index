# release-readiness

Review a local package before a release candidate PR and produce verification evidence.

## When To Use

- A package has a working CLI or library and needs release-candidate polish.
- A maintainer wants a repeatable check of docs, package metadata, examples, and CI.

## Required Tools

- git
- npm
- rg

## Inputs

- Repository path.
- Optional package manager commands from the README.

## Side-Effect Boundaries

- Read local files and run local verification commands.
- Do not publish packages, tag releases, merge PRs, or push without explicit maintainer intent.

## Approval Requirements

- Ask before running commands that require network access or credentials.
- Ask before changing release automation that publishes artifacts.

## Examples

```bash
release-readiness --repo ./my-package --verify "npm run release:check"
```

## Validation Workflow

Run the documented release check and confirm the package dry run includes only intended files.
