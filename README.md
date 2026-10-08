# opsinjs

A React design system for consumer and patient-facing health apps, and its documentation
site. It is for the screen where somebody who is not a clinician reads their own blood
pressure, HbA1c or symptom log and decides what, if anything, to do next.

**Documentation:** <https://opsinjs.pensievelabs.org>

> **Status.** Every component in the catalogue is `shipped`, which means its source exists
> and installs. Its WCAG 2.2 AA audit was run by its own authors. No component has had an
> independent accessibility review or a clinical review, so none is for a production
> health surface yet, and any API may change in a release. Each component page says so.

## What is here

| Path | What it holds |
| --- | --- |
| `apps/www` | The documentation site and the component registry (Next.js 16 and fumadocs) |
| `apps/www/registry/bases/base` | One source file per component |
| `apps/www/tokens` | The design tokens, which every generated table on the site is built from |
| `decisions` | The architecture decision records |
| `skills/opsinjs` | An Agent Skill with the rules an AI assistant follows when it uses opsinjs |
| `packages` | Reserved and empty. Nothing is published to npm (ADR 0002) |

## Use it

Components install as source through the shadcn CLI, so you own the code you copy.
Register the `@opsinjs` namespace in `components.json` once, then add a component:

```bash
npx shadcn@latest add @opsinjs/button
```

[Getting started](https://opsinjs.pensievelabs.org/getting-started) has the full setup.

## Work on it

You need Node 24 or newer.

```bash
corepack enable
pnpm install
pnpm dev        # the docs site on http://localhost:4000
```

Run `pnpm typecheck`, `pnpm lint` and `pnpm check` before you open a pull request.
[CONTRIBUTING.md](CONTRIBUTING.md) has the whole process.

## Community

- [Contributing](CONTRIBUTING.md) and [governance](GOVERNANCE.md)
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
