# PRD: agent-skill-index

## Status

Release candidate.

## Problem

Agent skill folders are easy to create and hard to choose from. Agents need a local catalog that captures purpose, triggers, required tools, side effects, approvals, examples, and validation notes before selecting a skill.

## Users

- Agent builders maintaining personal or team skill libraries.
- Automation agents that need a machine-readable skill index.
- Reviewers who want to spot skills with missing safety metadata.

## V1 Scope

- Scan a directory of skill folders.
- Parse each `SKILL.md` for common sections and examples.
- Emit a JSON index for tools.
- Emit a Markdown catalog for humans.
- Warn on missing descriptions, required tools, side-effect boundaries, approvals, examples, and validation workflow.

## Non-Goals

- Installing skills.
- Publishing a hosted marketplace.
- Executing skill instructions.
- Reading private data outside the provided skill root.

## Success Criteria

- Fixture-backed tests cover extraction, warnings, and catalog rendering.
- CLI works without network access.
- Output is deterministic and suitable for agent context.
