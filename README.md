# opsinjs

[![npm version](https://img.shields.io/npm/v/@opsinjs/react)](https://www.npmjs.com/package/@opsinjs/react)
[![licence](https://img.shields.io/npm/l/@opsinjs/react)](LICENSE)

A React design system for consumer and patient-facing health apps, and its documentation
site. It is for the screen where somebody who is not a clinician reads their own blood
pressure, HbA1c or symptom log and decides what, if anything, to do next.

**Documentation:** <https://opsinjs.pensievelabs.org>

> **Status.** Every component in the catalogue is `shipped`, which means it is implemented
> and installs with `@opsinjs/react`. Its WCAG 2.2 AA audit was run by its own authors.
> No component has had an independent accessibility review or a clinical review, so none
> is for a production health surface yet, and any API may change in a release. Each
> component page says so.

## What is here

| Path | What it holds |
| --- | --- |
| `packages` | The four npm packages, listed below |
| `packages/react/src/components` | One source file per component |
| `apps/www` | The documentation site and its component previews (Next.js 16 and fumadocs) |
| `apps/www/tokens` | The design tokens, which the token package and every generated table are built from |
| `decisions` | The architecture decision records |
| `skills/opsinjs` | An Agent Skill with the rules an AI assistant follows when it uses opsinjs |

## Packages

| Package | What it is |
| --- | --- |
| [`@opsinjs/react`](packages/react) | The components, the shared substrate and the stylesheets. Most projects install only this |
| [`@opsinjs/tokens`](packages/tokens) | Every design token, as CSS custom properties, as JSON and as JavaScript exports |
| [`@opsinjs/color`](packages/color) | The colour engine: OKLCH, gamut mapping, WCAG 2 and APCA contrast, ramps and colour-vision simulation |
| [`opsinjs`](packages/opsinjs) | One install that re-exports the other three |

All four share one version, are MIT licensed and ESM-only, and need Node 20.19 or newer.
[RELEASING.md](RELEASING.md) says how a version reaches npm, and
[ADR 0030](decisions/0030-opsinjs-ships-as-npm-packages.md) says why opsinjs ships this
way.

## Use it

```bash
npm install @opsinjs/react
```

Then import the stylesheet once, at the root of your app, and use a component:

```tsx
import "@opsinjs/react/styles.css"
import { Button } from "@opsinjs/react"
```

An app on Tailwind CSS v4 imports `@opsinjs/react/tailwind.css` after `tailwindcss` in
its own stylesheet instead.
[Getting started](https://opsinjs.pensievelabs.org/docs/getting-started) has the full
setup.

## Work on it

You need Node 24 or newer.

```bash
corepack enable
pnpm install
pnpm dev        # the docs site on http://localhost:4000
```

Run `pnpm typecheck`, `pnpm lint` and `pnpm check` before you open a pull request, and
`pnpm changeset` when the change touches a package.
[CONTRIBUTING.md](CONTRIBUTING.md) has the whole process.

## Community

- [Contributing](CONTRIBUTING.md) and [governance](GOVERNANCE.md)
- [Contribute with Claude Code](https://opsinjs.pensievelabs.org/docs/contribute), a plain-language guide for clinicians and health scientists
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Support](SUPPORT.md). Questions go to [GitHub Discussions](https://github.com/prashantonomy/opsinjs/discussions)
- [Security policy](SECURITY.md). Report a vulnerability privately, never in a public issue

## Safety

opsinjs is a presentation layer. It does not diagnose, triage or decide what a number
means. Thresholds, reference ranges and clinical wording belong to the product that uses
it. If anything here could lead a person to misread their own health data, open a
[safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml).

## Licences

Code is [MIT](LICENSE). The documentation prose is [CC BY 4.0](LICENSE-DOCS), so a team can
quote the guidance in a clinical safety case with attribution.
