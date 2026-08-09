# Release Verification

Use this checklist before cutting a package or asking reviewers to trust the current branch.

## Local Gate

```sh
npm run release:check
```

The release gate runs the project checks, smoke coverage, and tarball consumer
check declared in `package.json`. CI mirrors the same gate so pull requests
exercise the install path and published package boundary on the minimum
supported Node.js major (20) and the current runtime (24).

`npm run package:smoke` must confirm the CLI bin, package entrypoint, skill
instructions, release-readiness docs, changelog, contribution guide, security
policy, README, and license are present in the tarball. It also installs that
tarball into an empty temporary consumer, imports and calls the documented ESM
exports, and runs the installed CLI against a fixture.
The packed CLI check includes `agent-skill-index --help`, so syntax unsupported
by the declared runtime floor is caught before release.

## Package Boundary

The `files` allowlist in `package.json` is intentionally conservative. Add new runtime directories there when future releases need them; do not rely on npm's implicit package contents.
