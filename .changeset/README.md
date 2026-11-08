# Changesets

Every pull request that changes a published package (`@opsinjs/react`,
`@opsinjs/tokens`, `@opsinjs/color` or `opsinjs`) adds a changeset:

```bash
pnpm changeset
```

Pick the packages, pick the bump, and write one or two sentences for the changelog.
The four packages share one version, so a bump to any of them moves all four.
`RELEASING.md` at the repository root describes what happens after merge.
