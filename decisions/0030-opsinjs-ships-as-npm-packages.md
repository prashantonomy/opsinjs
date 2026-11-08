# ADR 0030. opsinjs ships as npm packages

opsinjs stops shipping as a shadcn registry and publishes four packages to npm instead, so a fix reaches every consumer who upgrades.

## Status

**Accepted.** 2026-11-09. Supersedes [ADR 0002](./0002-shadcn-registry-distribution.md), [ADR 0009](./0009-default-export-is-a-demo.md) and [ADR 0010](./0010-shared-code-ships-with-every-item.md). The structure is held by `packages/` at the repository root, `.changeset/`, `.github/workflows/release.yml` and [RELEASING.md](../RELEASING.md).

## Context

ADR 0002 made opsinjs a shadcn-spec registry: a consumer ran `npx shadcn add @opsinjs/<name>` and the source landed in their own repository. That record named its own price. A fix did not propagate, so a security or safety fix reached only the people who came back for it, and the record called that a permanent cost of the decision rather than an oversight. Every component in the catalogue is now built, so the cost was no longer theoretical: every fix since the first install was one more change a consumer had to find and apply by hand.

The copy-in model carried two further costs. An install needed the shadcn CLI and a `components.json` with the `@opsinjs` namespace registered, which is a second tool and a second configuration file before the first component renders. And ADR 0009 made each component file carry a zero-prop demo as its default export, because the registry served one file per component and the preview needed something to render, so every consumer's copy carried a demo nobody asked for.

The maintainer decided that opsinjs should be fully independent, depending on no outside distribution tool, and published on npm.

## Decision

**Publish four packages to npm, built and released from this repository.**

| Package | Holds |
| --- | --- |
| `@opsinjs/react` | The components, the substrate (units, error codes, banned words, the clinical vocabulary, `cn`) and the stylesheets |
| `@opsinjs/tokens` | Every design token as CSS custom properties in `tokens.css`, as data in `tokens.json`, and as JavaScript exports |
| `@opsinjs/color` | The colour engine: OKLCH, gamut mapping, WCAG 2 and APCA contrast, ramp derivation and colour-vision-deficiency simulation |
| `opsinjs` | An unscoped umbrella that re-exports the other three |

- **`tsc` compiles each source file to its own output file, with no bundler.** Each component keeps its `"use client"` directive at the top of its own module, and a consumer's bundler can drop every component the app does not import.
- **Two ways in for styles.** `@opsinjs/react/styles.css` is precompiled for an app without Tailwind. `@opsinjs/react/tailwind.css` is the entry for an app on Tailwind CSS v4, which loads the tokens and the role layer and points Tailwind at the compiled components. `@opsinjs/react/base.css` is opt-in for either.
- **Changesets manages versions, and the four packages share one fixed version.** A change to any package carries a changeset, and Changesets writes each package's `CHANGELOG.md`.
- **Releases are published from CI with provenance.** `.github/workflows/release.yml` publishes through npm trusted publishing, so the workflow holds no long-lived npm token, and every tarball it publishes carries an attestation naming the commit and the workflow that built it. The first version, 0.1.0, is published by hand to create the packages, because trusted publishing can only be set on a package that exists, and it carries no attestation.
- **The version is 0.x.** The SAFE001 sentence on every component page says the API may change in any release, and a 1.0 would say the opposite.
- **The component file holds the component and nothing else.** It has named exports only. The demo a preview renders moves to `apps/www/registry/demos/<id>.tsx`, which imports the component from `@opsinjs/react` the way a consumer does. This replaces ADR 0009.
- **The substrate is part of `@opsinjs/react`** rather than copied into every registry item, so one copy of the unit table and the error codes exists per install. This replaces ADR 0010.

## Consequences

- **Fixes reach consumers who upgrade.** `npm update` and a read of the changelog bring a security or safety fix to every project that takes it. That is the main thing this decision buys, and it removes the permanent cost ADR 0002 accepted.
- **A consumer changes opsinjs through tokens, roles and composition** rather than by editing copied files. Theming goes through the CSS custom properties and the role layer, and different behaviour comes from wrapping or composing a component. Forking stays possible, because the source is in this repository under MIT, but it is no longer the default path.
- **The audit argument of ADR 0002 moves.** That record argued that copied source was easier to put in a design-history file than a version range. Under npm the same evidence is an exact version pinned in the product's `package.json` and lockfile, the changelog entries between two versions, and the provenance attestation on each tarball. A team that has to evidence its dependencies pins exactly and reads the changelog before it moves.
- **A semver policy is owed.** At 0.x semver allows any release to break the API, which is honest but tells a consumer nothing about which releases will. A later record has to say which changes take which bump.
- **Releasing is now work.** It needs an npm organisation, trusted publishing configured on each package, and a changeset in every pull request that touches a package. [RELEASING.md](../RELEASING.md) is the procedure.
- **The documentation site consumes the packages through the pnpm workspace** (`workspace:*`), with TypeScript paths pointing at the package sources, so the site runs in development without a package build and renders what a consumer would import.
- **Most of `/r` goes.** `/r/index.json` (the roster) and `/r/docs.json` (the offline corpus) stay, because they are opsinjs's own and not part of the shadcn protocol. Every other `/r` URL, including `/r/registry.json` and `/r/<name>.json`, answers HTTP 410 with a pointer to `npm install @opsinjs/react`. A project that registered the `@opsinjs` namespace keeps the files it copied and gets no updates through the CLI.
- **Records that predate this one still say "copy".** ADRs 0011, 0012, 0014, 0015, 0021, 0023, 0028 and 0029 describe installing as copying source. Each carries a closing note saying the wording predates this record and the substance stands, rather than being rewritten.

## Alternatives considered

**Keep the registry beside npm.** Rejected: two install paths need two sets of documentation and two upgrade stories, which is the cost ADR 0002 itself cited when it rejected shipping both. The registry half would also keep a consumer on copies that never receive a fix, which is the problem this record exists to remove.

**Bundle each package with a bundler.** Rejected for now. A bundler that merges modules has to be configured to keep each `"use client"` directive at the top of the right output file, while `tsc` emitting one file per source file keeps the directives where they were written and needs no extra tool. Revisit if a measured problem with the per-file output appears.

**Publish only the unscoped `opsinjs` package.** Rejected: the `@opsinjs` scope groups the packages under one organisation, and lets a consumer take the colour engine or the tokens without React. The unscoped name is kept as an umbrella for a reader who types `npm install opsinjs`.

## Revisiting this

Revisit the 0.x line the first time a component passes an independent accessibility review and a clinical review, because that is the first point at which a stable API could be promised for anything. Revisit the build when a consumer reports a concrete failure that per-file output causes and a bundler would not. Do not revisit in order to bring the registry back beside the packages: the reason is above, and a fork of the source is still open to anybody who wants to own a copy.
