# repo-review

Review a repository diff and return prioritized findings with file and line references.

## When To Use

- A user asks for a code review.
- A pull request needs risk-focused feedback.

## Required Tools

- git
- rg
- test runner

## Inputs

- Repository path.
- Optional branch or diff range.

## Side-Effect Boundaries

- Read-only by default.
- Do not push, merge, or rewrite history.

## Approval Requirements

- Ask before running networked dependency installation.
- Ask before applying fixes.

## Examples

```bash
repo-review --base main
```

## Validation Workflow

Run available tests and include any gaps in the review.
