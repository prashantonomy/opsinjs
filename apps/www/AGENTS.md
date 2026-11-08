<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`. Verify that at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/www is the opsinjs documentation site

The repository-wide rules are in `../../AGENTS.md`. This file is the app-local detail
that recall gets wrong.

## Route structure with two root layouts and no `app/layout.tsx`

```
app/(chrome)/layout.tsx      <html>/<body>, imports globals.css, mounts RootProvider
app/(chrome)/(landing)/…     the landing page at /, with its own banner and footer
app/(chrome)/(home)/…        the tool pages (colours, tokens, icons, showcase), with the footer
app/(chrome)/(docs)/…        DocsShell: the clawscale-style sidebar, no footer
app/(chrome)/(playground)/…  full-bleed tool chrome, with the footer
app/(chrome)/(stage)/…       /showcase/<slug>: one screen and a floating bar, no chrome
app/(view)/layout.tsx        its OWN <html>/<body>, imports ONLY product.css, no provider
```

`(view)` is the chrome-less preview surface: it renders under the **opsinjs product
theme** (squircle radii, system-ui, generous spacing) rather than the docs chrome,
and `<ComponentPreview>`/`<IframePreview>` embed it, as does `<ShowcaseStage>` on
`/showcase/<slug>`. That isolation is only possible
because there is no top-level `app/layout.tsx`. Adding one back re-nests `(view)` under
the docs stylesheet and silently destroys the distinction the site is built to
demonstrate. Sibling root layouts force a full page load when navigating between the two
groups; that is acceptable because `(view)` is only ever entered by iframe or direct URL.

Non-page files (`app/icon.svg`, `app/robots.ts`, `app/sitemap.ts`, `app/proxy.ts`, all
route handlers) stay at `app/` and are unaffected by the grouping.

## Where a built component lives

The component layer was built against the specifications under
`content/docs/components/`, and every one of those pages is now a built component.
Those specifications are binding: you implement against them, you do not redesign them,
and where one genuinely contradicts itself you resolve it deliberately with an ADR and
fix the losing side in the same commit. Every page under `content/docs/components/` is
hand-written. Nothing in that directory is generated.

A component page reads `shipped` only once
`../../packages/react/src/components/<id>.tsx` exists, its demo renders at
`/view/base/base-lyra/component/<id>` with `data-opsin-view-state="ready"`, and the gates
pass. Its catalogue row's `status` moves in the same commit, and `status` exists on a
`kind: component` page and nowhere else. `shipped` says the component installs with
`@opsinjs/react` and says nothing about review: no component has had an accessibility
review or a clinical review, and each page's `<StubNotice>` carries that sentence in
authored MDX. Everything not yet built keeps the honesty vocabulary (`<NotBuiltYet>`,
`<StubNotice>`, `<NoDataYet>`, `<Todo>`).

The component itself lives in the package, and everything the site renders around it
lives in `registry/`. The mechanics are easy to get wrong from recall:

```
../../packages/react/src/components/<id>.tsx
                                   one flat file per component, named exports only;
                                   the stem IS the catalogue id, the docs URL segment
                                   and the package subpath. There is no mapping table
registry/demos/<id>.tsx            the zero-prop demo /view/.../component/<id> renders
registry/examples/<id>-<name>.tsx  variations rendered by <ComponentPreview kind="example">
registry/screens/<id>.tsx          whole-screen compositions
registry/__index__.ts              GENERATED from demos, examples and screens
../../packages/react/src/index.ts  GENERATED from the components listing
```

A demo, an example and a screen import from `@opsinjs/react` the way a consumer does.
`tsconfig.json` maps `@opsinjs/react` and `@opsinjs/react/*` onto the package sources,
so the site needs no package build in development.

`scripts/build-registry.mts` reads **direct children** only, and nothing deeper. Two
consequences that cost an afternoon each:

- **It is not recursive, and `findBuilt()` skips `index.*`.**
  `registry/demos/<id>/index.tsx` produces no index entry, no `/view` route and no
  preview, and every gate stays green while nothing works. One flat file per demo, and
  one flat file per component.
- **Every `.tsx` direct child of `packages/react/src/components/` becomes a component.**
  A helpers file dropped in beside the components is exported from the generated entry
  point and published in `@opsinjs/react`, with no catalogue row to back it. Shared code
  goes in `packages/react/src/utils.ts` or the substrate, not there.

`registry/__index__.ts` and `packages/react/src/index.ts` are generated and
drift-gated. An index entry appears the moment a demo exists, and `getRegistryEntry()`
returning null is what makes `<ComponentPreview>` render `<NotBuiltYet>`. Never
hand-edit either. `predev` and `prebuild` both run `generate`, so a stale index cannot
survive a dev start, and an unexpected regeneration diff will appear in `git status`
mid-session.

`app/globals.css` and `app/product.css` both declare
`@source "../registry/**/*.{ts,tsx}";` and
`@source "../../../packages/react/src/**/*.{ts,tsx}";`, so utility classes written in a
component file or a demo are in the content graph with no config change. The
`product.css` lines are the ones that matter: it is the sheet a component actually
renders against.

**The palette a component renders against is `app/product.css`, not `app/globals.css`.**
A preview is an iframe into `(view)`, which imports only `product.css`, and
`product.css` imports `@opsinjs/tokens/tokens.css` and the `roles.css`, `theme.css` and
`base.css` that `@opsinjs/react` ships. Anything declared solely in `globals.css`
resolves to nothing there. That is the docs chrome's `--secondary`, `--accent`,
`--destructive`, `--popover`, `--sidebar*`, `--chart-*` and the larger radii. A
component using them looks correct in review and renders unstyled in the product, and
unstyled in a consumer's app as well. The `@theme inline` block in
`packages/react/styles/theme.css` is the whole list of what is available.

## fumadocs 16 API, as used here

- Source map: `import { docs } from "@/.source"` → `loader()` in `lib/source.ts`.
  `.source/` is gitignored and regenerated by `postinstall` (`fumadocs-mdx`), which is why
  `typecheck` is `fumadocs-mdx && next typegen && tsc --noEmit`. A clean clone would
  otherwise fail typecheck pointing at your own `lib/source.ts`.
- Provider: `import { RootProvider } from "fumadocs-ui/provider/next"`. It already mounts
  next-themes; there is **no** `components/theme-provider.tsx` and there must never be
  two theme providers.
- Page text: `await page.data.getText('processed')`. **`page.data.content` does not
  exist.** `source.config.ts` sets `postprocess: { includeProcessedMarkdown: true }` to
  make `getText('processed')` available; the `.md` twin routes and `/r/docs.json` depend
  on it.
- Links inside MDX go through `createRelativeLink`, which takes a relative file path
  and never `/docs/…`.
- `fumadocs-ui` is the alias `npm:@fumadocs/base-ui`. The primitive layer is Base UI, not
  Radix. Do not install `@radix-ui/*`.

## The CSS order in `app/globals.css` is load-bearing

`tailwindcss` → `fumadocs-ui/css/shadcn.css` → `fumadocs-ui/css/preset.css` → `@source`
lines → the chrome theme's `@theme inline` / `:root` / `.dark` blocks → the opsinjs token
layer of authored fallbacks → `@opsinjs/tokens/tokens.css` → `@layer base` and
`@media print` → `@custom-variant dark (&:where(.dark, .dark *));` **last**. The comment
at the head of `app/globals.css` is the authority for this order. `fumadocs-ui/css/shadcn.css`
belongs to fumadocs, not to the `shadcn` package, which this repository no longer
depends on.

Two traps this order defuses: importing `fumadocs-ui/css/neutral.css` as well gives you
two themes fighting, and the `@custom-variant dark (&:is(.dark *))` that shadcn-style
stylesheets put at the top of a file silently loses to fumadocs' `:where` form depending
on import order. The
`:where` superset is therefore pinned at the bottom where order stops mattering.

`packages/tokens/tokens.css` is emitted by `scripts/build-tokens.mts` from
`tokens/*.json`. Never hand-edit it. `app/globals.css` and `app/product.css` each own
only their `@import "@opsinjs/tokens/tokens.css"` line.

`app/product.css` is the product theme and is imported **only** by `app/(view)/layout.tsx`.

## Scripts

`scripts/*.mts` run under plain `node` (Node 24 native type stripping). Erasable syntax
only: no `enum`, no parameter properties, no `namespace`. They may import the colour
engine's sources, `../../../packages/color/src/*.ts`, with an explicit `.ts` extension,
which is why `tsconfig.json` sets `allowImportingTsExtensions`. The generators write into
the packages as well as into the site; `../../AGENTS.md` §7 lists every generated path.

## Do not

- Read `searchParams` in `app/(chrome)/(docs)/docs/[[...slug]]/page.tsx`. It deoptimises
  the whole corpus out of static generation.
- Add a `webpack` key to `next.config.mjs`. Turbopack hard-fails on it.
- Run `next lint`. It was removed; use `pnpm lint`.
- Add `@tailwindcss/typography` (collides with fumadocs' forked `prose`), `next-themes` or
  `motion` (already transitive), `culori`/`apca-w3` (hand-written in
  `packages/color/src/`), or `shadcn` (ADR 0030 removed it).
- Import a component by a relative path into `packages/`. Use `@opsinjs/react`, as a
  consumer would.
