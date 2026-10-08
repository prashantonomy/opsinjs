# opsinjs

opsinjs is a React design system for consumer- and patient-facing health apps. It is
for the kind of screen where somebody who is not a clinician reads their own blood
pressure, HbA1c or symptom log and has to decide what, if anything, to do next.

This repository contains **the documentation site and the component layer**. Every
component in the catalogue is implemented under `apps/www/registry/bases/base/` and is
served as a shadcn-spec registry item from `/r/<name>.json`; install them through the
`@opsinjs` namespace registered in a project's `components.json`, never by pasting a
raw URL. All of them are `shipped`, which means the code exists and installs. It does
not mean any of them has been reviewed.

## What is actually real today

- **The component layer.** Every catalogue row is implemented and installable, and every
  one of them is `shipped`. Not one has had an accessibility review or a clinical review,
  so none of them is for a production health surface, and the API may change in any
  release with a changelog entry. Every component page says so in its own `<StubNotice>`.
- **Tokens.** The two colour axes, the material ladder, the motion springs and the
  type/space/shape scales are authored in `apps/www/tokens/*.json` and are the source
  for every generated table on the site.
- **Doctrine.** Health, Accessibility, Content & language and Foundations are written
  against those tokens and do not depend on any component existing.
- **Measured numbers.** Contrast figures, token tables, prop tables and catalogue rows
  are generated and committed; CI fails if a checked-in artefact drifts from its source.

## Quick start

```bash
pnpm install
pnpm dev        # docs site on http://localhost:4000
```

Node 24 or newer is required: the build scripts are `.mts` files executed directly by
`node` via native type stripping, with no `tsx` or `ts-node` in the dependency tree.

## Layout

```
apps/www          the documentation site (Next.js 16 App Router + fumadocs), in six
                  sections modelled on the clawscale and Blueprint docs
decisions         the architecture decision records (ADR 0026 is the site's shape)
packages/*        reserved and empty. Nothing is published to npm today, and
                  components never will be (ADR 0002: distribution is copy-in)
skills/opsinjs    the Agent Skill: rules an assistant must follow to use opsinjs
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the docs site (`predev` regenerates tokens, the registry index and the reference tables first) |
| `pnpm build` | Generates, compiles MDX, then builds the site |
| `pnpm typecheck` | Regenerates `.source`, runs `next typegen`, then `tsc --noEmit` |
| `pnpm check` | Drift gate: generated files, information architecture, accessibility from source, `llms.txt` |
| `pnpm lint` | ESLint flat config via `eslint-config-next` |

## Licences

Code is MIT (`LICENSE`). The documentation prose is CC BY 4.0 (`LICENSE-DOCS`), and the
health, accessibility and content guidance are part of that prose. The separation is
deliberate, so that a team can quote the documentation inside a clinical-safety case or
a regulatory file with a clear attribution path.

## Safety

opsinjs is a presentation layer. It does not diagnose, triage, or decide what a number
means. Thresholds, reference ranges and clinical wording are always the owning product's
responsibility. See the Health section of the docs site, starting at `/health`.
