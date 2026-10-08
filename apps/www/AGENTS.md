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
app/(chrome)/(home)/…        the tool pages (colours, tokens, icons, showcase), with the footer
app/(chrome)/(docs)/…        DocsShell: the clawscale-style sidebar, no footer
app/(chrome)/(playground)/…  full-bleed tool chrome, with the footer
app/(view)/layout.tsx        its OWN <html>/<body>, imports ONLY product.css, no provider
```

`(view)` is the chrome-less preview surface: it renders under the **opsinjs product
theme** (squircle radii, system-ui, generous spacing) rather than the lyra docs chrome,
and `<ComponentPreview>`/`<IframePreview>` embed it. That isolation is only possible
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

A component page reads `shipped` only once its component renders at
`/view/base/base-lyra/component/<id>` with `data-opsin-view-state="ready"` and the gates
pass. Its catalogue row's `status` moves in the same commit, and `status` exists on a
`kind: component` page and nowhere else. `shipped` says the source installs and says
nothing about review: no component has had an accessibility review or a clinical review,
and each page's `<StubNotice>` carries that sentence in authored MDX. Everything not yet
built keeps the honesty vocabulary (`<NotBuiltYet>`, `<StubNotice>`, `<NoDataYet>`,
`<Todo>`).

`registry/` is where the code lands. The mechanics are app-local and easy to get wrong
from recall:

```
registry/bases/base/<id>.tsx       one flat file per component; the stem IS the
                                   catalogue id, the docs URL segment and the
                                   registry item name. There is no mapping table
registry/examples/<id>-<name>.tsx  variations rendered by <ComponentPreview kind="example">
registry/screens/<id>.tsx          whole-screen compositions
registry/__index__.ts              GENERATED from the three directories above
```

`findBuilt()` in `scripts/build-registry.mts` walks the **direct children** of those
directories and nothing deeper. Two consequences that cost an afternoon each:

- **It is not recursive, and it skips `index.*`.** `registry/bases/base/<id>/index.tsx`
  produces no index entry, no `/view` route and no preview, and every gate stays green
  while nothing works. One flat file per component.
- **Every `.ts`/`.tsx` direct child becomes a component.** A helpers file dropped in
  beside the components gets a registry entry, a live
  `/view/base/base-lyra/component/<name>` route, and no catalogue row to back it.
  Shared code goes in `lib/`, not here.

`registry/__index__.ts` is generated and drift-gated: an entry appears there the moment
a real file exists, and `getRegistryEntry()` returning null is what makes
`<ComponentPreview>` render `<NotBuiltYet>`. Never hand-edit it. `predev` and
`prebuild` both run `generate`, so a stale index cannot survive a dev start, and an
unexpected regeneration diff will appear in `git status` mid-session.

`app/globals.css:49` and `app/product.css:25` each declare
`@source "../registry/**/*.{ts,tsx}";`, so Tailwind already scans the registry from
**both** stylesheets, and utility classes written in a new component file are in the
content graph with no config change. The `product.css` one is the one that matters: it
is the sheet a component actually renders against.

**The palette a component renders against is `app/product.css`, not `app/globals.css`.**
A preview is an iframe into `(view)`, which imports only `product.css`, so anything
declared solely in `globals.css` resolves to nothing there. That is the lyra docs
chrome's `--secondary`, `--accent`, `--destructive`, `--popover`, `--sidebar*`,
`--chart-*` and the larger radii. A component using them looks correct in review and
renders unstyled in the product. `product.css`'s `@theme inline` block is the whole
list of what is available.

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

`tailwindcss` → `tw-animate-css` → `shadcn/tailwind.css` → `fumadocs-ui/css/shadcn.css`
→ `fumadocs-ui/css/preset.css` → `@source` lines → the lyra `@theme inline` / `:root` /
`.dark` blocks → `./tokens.generated.css` → the opsinjs token layer → `@layer base` and
`@media print` → `@custom-variant dark (&:where(.dark, .dark *));` **last**.

Two traps this order defuses: importing `fumadocs-ui/css/neutral.css` as well gives you
two themes fighting, and shadcn's own `@custom-variant dark (&:is(.dark *))` at the top of
the file silently loses to fumadocs' `:where` form depending on import order. The
`:where` superset is therefore pinned at the bottom where order stops mattering.

`app/tokens.generated.css` is emitted by `scripts/build-tokens.mts` from `tokens/*.json`.
Never hand-edit it. `app/globals.css` owns only the `@import` line.

`app/product.css` is the product theme and is imported **only** by `app/(view)/layout.tsx`.

## Scripts

`scripts/*.mts` run under plain `node` (Node 24 native type stripping). Erasable syntax
only: no `enum`, no parameter properties, no `namespace`. They may import `lib/color/*.ts`
with an explicit `.ts` extension, which is why `tsconfig.json` sets
`allowImportingTsExtensions`.

## Do not

- Read `searchParams` in `app/(chrome)/(docs)/[[...slug]]/page.tsx`. It deoptimises
  the whole corpus out of static generation.
- Add a `webpack` key to `next.config.mjs`. Turbopack hard-fails on it.
- Run `next lint`. It was removed; use `pnpm lint`.
- Add `@tailwindcss/typography` (collides with fumadocs' forked `prose`), `next-themes` or
  `motion` (already transitive), `culori`/`apca-w3` (hand-written in `lib/color/`).
