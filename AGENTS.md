# AGENTS.md — repository rules for coding agents

Read this before writing a line. Several things here contradict what you probably
learned from older Next.js, fumadocs and shadcn material.

## 1. Nothing is built

`opsinjs` has **no components yet**. `apps/www/content/docs/components/*.mdx` are
specifications, not documentation of working code. Do not "finish" them by writing an
implementation, do not generate code against a proposed API, and never edit a page so
that it reads as though the component exists. The honest vocabulary is `<NotBuiltYet>`,
`<StubNotice>`, `<NoDataYet>` and `<Todo>` — and `<Todo>` is counted by the build's
coverage report, so it is a measurement, not a shrug.

## 2. This is not the Next.js you know

Next 16 App Router. Concretely, in this repo:

- **There is no `app/layout.tsx`.** There are two *root* layouts:
  `app/(chrome)/layout.tsx` (owns `<html>`/`<body>`, imports `globals.css`, mounts the
  fumadocs `RootProvider`) and `app/(view)/layout.tsx` (owns its own `<html>`/`<body>`,
  imports only `app/product.css`, no provider). Next permits multiple root layouts only
  while no top-level `app/layout.tsx` exists. Do not add one back; it would silently
  re-nest `(view)` inside the docs chrome and defeat the whole preview isolation.
- `params` and `searchParams` are Promises. Await them.
- `middleware.ts` is now `proxy.ts`.
- Turbopack is the bundler. **Never add a `webpack` key to `next.config.mjs`** — it is a
  hard failure, not a warning.
- Never run `next lint`; it was removed. Run `pnpm lint` (ESLint flat config).
- Read `node_modules/next/dist/docs/` when in doubt rather than trusting recall.

## 3. Do not read `searchParams` in the docs route

`app/(chrome)/(docs)/docs/[[...slug]]/page.tsx` must stay statically generated. Reading
`searchParams` there deoptimises the entire docs corpus out of SSG. The `?base=&style=`
switcher is a **client** component using `useSearchParams()` that re-points an
`<IframePreview>` at a `/view/[base]/[style]/…` URL.

## 4. fumadocs: version split is intentional

- `fumadocs-core` **16.15.4** and `fumadocs-ui` **16.15.4** (installed as the alias
  `npm:@fumadocs/base-ui`, so the tree contains Base UI and **zero Radix**). These two
  are exact-pinned and must be bumped together — `fumadocs-ui` peers `fumadocs-core` at
  an exact version, not a range.
- `fumadocs-mdx` is on major **15**. That is correct. Do not "fix" it.
- Import the generated source map from `@/.source`, the provider from
  `fumadocs-ui/provider/next`.
- Page body text comes from `await page.data.getText('processed')`.
  **`page.data.content` does not exist** and fails typecheck (TS2339). This is why
  `source.config.ts` sets `postprocess: { includeProcessedMarkdown: true }`.

## 5. Pinned versions are pinned

Every version in `apps/www/package.json` was resolved live and corresponds to a build
that actually ran green. In particular: `typescript` is `5.9.3` and **never `^5`** —
npm `latest` is now the 7.x native port. `next` is `16.3.4`, `react`/`react-dom`
`19.2.8`, `zod` `4.4.3`. Do not float a range to "get the latest".

`shadcn` is a **runtime** dependency, not a CLI-only tool: `app/globals.css` does
`@import "shadcn/tailwind.css"`.

Deliberately absent, do not add: `tsx`/`ts-node` (Node 24 runs `.mts` natively),
`culori`/`apca-w3` (the colour maths is hand-written in `lib/color/`), `next-themes`
and `motion` (already transitive under `@fumadocs/base-ui` — installing them directly
gives you two theme providers), `@tailwindcss/typography` (collides with fumadocs'
forked `prose`), `playwright` (a nightly P2 job; `capture-registry.mts` no-ops without it).

## 6. Node 24, and `.mts` scripts

`engines.node` is `>=24.0.0` at the root and in `apps/www`. Every script under
`apps/www/scripts` is a `.mts` file run by plain `node`. They must be
**erasable-syntax-only** TypeScript: no `enum`, no parameter properties, no `namespace`.
Node type stripping rejects anything that needs code generation.

## 7. Generated, never hand-authored

Prop tables, token tables, data-attribute tables, CSS-variable tables, contrast numbers,
bundle sizes, catalogue rows and the glossary are **generated** into committed files.
`pnpm check:generated` regenerates and then does `git add -N . && git diff --exit-code`
over `lib/generated`, `registry/__index__.ts`, `app/tokens.generated.css`,
`content/docs/reference/generated` and `public/r`. If you hand-edit one of those, CI
fails — which is the point. Change the source (`tokens/*.json`, `registry/catalogue.ts`)
and regenerate.

`app/tokens.generated.css` is emitted by `scripts/build-tokens.mts`. `app/globals.css`
owns only the one `@import` line that pulls it in, at its fixed position.

## 8. Never hardcode `/docs/`

- In `.ts`/`.tsx`: build every path through `lib/routes.ts`. `assert-ia.mts` fails the
  build on a literal `/docs/` outside `lib/routes.ts` and `lib/source.ts`, with a short
  allowlist for `next.config.mjs`, `app/robots.ts`, `app/sitemap.ts` and
  `lib/layout.shared.tsx`.
- In `.mdx`: use **relative** file links resolved by fumadocs' `createRelativeLink`.
  Absolute `/docs/...` links are banned. The Sections rail in the root `meta.json` is the
  single allowlisted exception.

This is what keeps a future `[lang]` segment a bounded change instead of a migration.

## 9. Never invent evidence

No fabricated citation, statistic, DOI, date or study — ever. A page states either a
checkable source (`evidence: cited`) or an honest opinion (`evidence: opinion`). Prefer
`opinion` to a plausible-looking reference. Do not copy NHS or other Crown-copyright
text; cite it and write your own prose.

## 10. British prose, American code

`colour`, `behaviour`, `visualisation` in prose. `color`, `ColorScale`, `--color-*` in
code and CSS, because Tailwind and the CSS spec force it. Component ids are kebab-case
in paths and in the catalogue, PascalCase in prose.

## 11. Ownership

Files are written by workers with disjoint file sets. If a file looks wrong but is not
yours, say so — do not edit it.
