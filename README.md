# opsinjs

A React design system for consumer- and patient-facing health apps — the kind of
screen where somebody who is not a clinician reads their own blood pressure, HbA1c
or symptom log and has to decide what, if anything, to do next.

This repository currently contains **the documentation site only**. No component
has been built yet. Every component page in `apps/www/content/docs/components` is
a *specification*: intent, when not to use it (naming the alternative), the clinical
contract, the proposed anatomy and API, and the accessibility bar the implementation
must clear. Pages say so out loud, in machine-readable form, so that an agent asking
"does opsinjs have a RangeBar?" gets a definitive *not yet, here is the spec* instead
of a 404 it will answer by inventing an API.

## What is actually real today

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
apps/www          the documentation site (Next.js 16 App Router + fumadocs)
packages/*        reserved — the published @opsinjs/* packages will live here
skills/opsinjs    the Agent Skill: rules an assistant must follow to use opsinjs
.rawres           the research that produced the architecture decisions
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the docs site (regenerates tokens and the registry index first) |
| `pnpm build` | Generates, compiles MDX, then builds the site |
| `pnpm typecheck` | Regenerates `.source`, runs `next typegen`, then `tsc --noEmit` |
| `pnpm check` | Drift gate: generated files, information architecture, `llms.txt` |
| `pnpm lint` | ESLint flat config via `eslint-config-next` |

## Licences

Code is MIT (`LICENSE`). The documentation prose — including the health, accessibility
and content guidance — is CC BY 4.0 (`LICENSE-DOCS`), deliberately separated so that a
team can quote it inside a clinical-safety case or a regulatory file with a clear
attribution path.

## Safety

opsinjs is a presentation layer. It does not diagnose, triage, or decide what a number
means. Thresholds, reference ranges and clinical wording are always the owning product's
responsibility. See `Start here → Safety, scope and limitations` on the docs site.
