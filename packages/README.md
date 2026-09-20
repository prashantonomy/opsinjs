# packages/

This directory is reserved and intentionally empty.

## Why there is nothing here

Per [ADR 0002](../apps/www/content/docs/project/decisions/0002-shadcn-registry-distribution.mdx),
opsinjs is distributed as a shadcn registry: components ship as source you copy
into your own repository through `npx shadcn add`, and nothing is published to
npm. A health product modifies these components as a matter of course, so the
distribution model hands you auditable source rather than a versioned tarball.
Because of that decision there are no published workspace packages today, and so
there is nothing under `packages/` to build or install.

## Why the directory still exists

The pnpm workspace globs `packages/*` (see `pnpm-workspace.yaml`). Keeping this
directory present, with a tracked `.gitkeep`, means that glob resolves cleanly
even while the directory is empty. The slot is held open for future internal
tooling: a linter, a codemod, a token compiler, or another workspace-only helper
that opsinjs uses to build itself. Anything that lands here is internal and stays
unpublished. It does not change the copy-in distribution model that ADR 0002 set,
and it is not a step toward shipping opsinjs on npm.
