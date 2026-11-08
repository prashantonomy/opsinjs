# Releasing

opsinjs publishes four packages to npm: `@opsinjs/react`, `@opsinjs/tokens`,
`@opsinjs/color` and `opsinjs`. They share one version, which Changesets manages, and
GitHub Actions publishes each release from `.github/workflows/release.yml` through npm
trusted publishing, with provenance.
[ADR 0030](decisions/0030-opsinjs-ships-as-npm-packages.md) records the decision. Only
the owner holds the npm organisation, so the one-time setup below is the owner's to do.

## One-time setup

1. **Create the npm organisation.** Sign in at <https://www.npmjs.com>, choose **Add
   Organization**, name it `opsinjs` and pick the free plan, which publishes public
   packages without limit. The organisation owns the `@opsinjs` scope.
2. **Turn on two-factor authentication** for the npm account that owns the
   organisation, under **Account settings**.
3. **Publish 0.1.0 by hand, once.** Trusted publishing is configured on a package that
   already exists, so the first version has to come from a person. From a clean checkout
   of the commit being released:

   ```bash
   npm login
   pnpm install
   pnpm release
   ```

   `pnpm release` builds the four packages, runs the package checks and the smoke test
   (which needs the network), and then `changeset publish` publishes every package
   whose version is not on npm yet. Check that all four appear at
   `https://www.npmjs.com/package/<name>`.

   npm signs provenance only inside a supported CI runner, so this hand-published
   0.1.0 carries none. That is why no package sets `publishConfig.provenance`:
   `release.yml` turns provenance on with `NPM_CONFIG_PROVENANCE`, so every later
   version carries it and this first one can still be published by a person.

4. **Add the trusted publisher to each of the four packages.** On npm, open the package,
   then **Settings**, then **Trusted Publisher**, and choose GitHub Actions with:

   | Field | Value |
   | --- | --- |
   | Organization or user | `prashantonomy` |
   | Repository | `opsinjs` |
   | Workflow filename | `release.yml` |
   | Environment | leave empty |

   Do this for `@opsinjs/react`, `@opsinjs/tokens`, `@opsinjs/color` and `opsinjs`.
   Trusted publishing works through the workflow's OIDC token, so `release.yml` must keep
   `id-token: write` in its permissions.
5. **Close the token route.** Once every package has its trusted publisher, set each
   package's **Publishing access** to require two-factor authentication and disallow
   tokens. From then on no npm token can publish, and a person can publish only with a
   second factor, which the routine below never asks for.

## The routine

1. **Every pull request that changes a package adds a changeset.** Run `pnpm changeset`,
   pick the packages the change touches, pick the bump, and write one or two sentences a
   consumer would want in the changelog. Commit the file it writes under `.changeset/`
   with the change. A change to the documentation site alone needs no changeset.
2. **Merging to `main` opens a release pull request.** `release.yml` runs the
   Changesets action on every push to `main`. While changesets are pending, it opens or
   updates one pull request titled `chore(release): version packages`, the repository's
   form of Changesets' "Version Packages" pull request. It raises the shared version and
   writes each package's `CHANGELOG.md`, and it updates itself as more changesets land.
3. **Merging that pull request publishes.** With no changesets left, the same workflow
   runs `pnpm release` on `main`: it builds the four packages, runs the package checks
   and the smoke test, publishes every version not yet on npm with provenance, tags it
   and creates the GitHub release.

The four packages always move together. Changesets holds them in one fixed group, so a
change to `@opsinjs/color` alone still releases a new version of all four.

### Choosing the bump

opsinjs is at 0.x, and every component page says the API may change in any release.
[ADR 0030](decisions/0030-opsinjs-ships-as-npm-packages.md) owes a semver policy that
says which change takes which bump. Until it is written, the author chooses in the
changeset and says in its summary when a change breaks an existing use.

### Before a release

The gates every pull request runs (`pnpm typecheck`, `pnpm lint` and `pnpm check`) also
cover the packages. To check the published shape of a package locally:

```bash
pnpm build:packages   # pnpm -r --filter "./packages/*" build
pnpm lint:packages    # publint and Are the Types Wrong, on each package
pnpm smoke:packages   # node scripts/smoke-pack.mts
```

`scripts/smoke-pack.mts` packs the four packages, installs the tarballs into a throwaway
project with npm, imports every entry point and subpath, server-renders a set of
components and checks that each stylesheet resolves. It needs the network, and it fails
on the first thing a consumer would trip over. `pnpm release` runs all three before it
publishes.

## A bad release

**Deprecate it. Never unpublish it.**

```bash
npm deprecate @opsinjs/react@<bad-version> "<what is wrong>. Upgrade to <fixed-version>."
```

Run it for each of the four packages at the bad version, because they share one
version. A consumer who installs a deprecated version sees the message, and an existing
lockfile keeps working. Then fix forward: land the fix with a changeset and release the
next version. `npm deprecate <package>@<version> ""` withdraws a deprecation.

npm lets a version be unpublished within 72 hours of publishing it, and later only under
narrower conditions in its [unpublish policy](https://docs.npmjs.com/policies/unpublish).
opsinjs does not use that window. An unpublished version number can never be published
again, and any project whose lockfile names it stops installing. A secret published by
mistake is revoked where it was issued first, because revoking it is what makes it
harmless. The bad version is then deprecated like any other.

A release that could lead somebody to misread their own health data is a safety issue
as well as a bad release. Deprecate it, and open a
[safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml)
so the fix and its reasoning are public.
