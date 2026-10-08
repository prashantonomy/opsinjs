# AGENTS.md holds the repository rules for coding agents

Read this before writing a line. Several things here contradict what you probably
learned from older Next.js, fumadocs and shadcn material.

## 1. The component layer is built, and it is not reviewed

The component pages under `apps/www/content/docs/components/` were written as
specifications before any component existed, and every one of those specifications has
since been implemented. Neither half is safe to forget: the specification still binds
the code, and the code is what the page must now describe.

**A component that exists is documented, not proposed.** Its page carries
`status: shipped`, a `<ComponentPreview>` that actually renders, and real
`parts`/`tree`/`rows` data. A page reads `shipped` only when its file under
`registry/bases/base/` renders at `/view/base/base-lyra/component/<id>` and
`pnpm typecheck`, `pnpm lint` and `pnpm check` all pass. "It typechecks" is not "it
renders". Frontmatter `status` and the `registry/catalogue.ts` row's `status` move in
the same commit, because nothing cross-checks them for you.

**`shipped` says the source installs, and it says nothing about review.** No opsinjs
component has had an accessibility review or a clinical review, so nothing here is for
a production health surface, and the API may change in any release with a changelog
entry. That sentence is authored in each component page's `<StubNotice>` rather than
generated into it, because the `.md` twins are built from page text, and `assert-ia`
rule SAFE001 fails the build on a component page that drops it. Do not soften it, and
do not move it into a generated string.

**Everything that is not a component page is doctrine or specification and must read as
one**, and that is most of the corpus. Do not "finish" a spec by writing an
implementation you were not assigned, do not generate code against a `## Proposed API`,
and never edit a page so that it reads as though something exists when it does not. The
honest vocabulary is `<NotBuiltYet>`, `<StubNotice>`, `<NoDataYet>` and `<Todo>`.
`<Todo>` is counted by the build's coverage report, so it is a measurement, not a shrug.
`<NotBuiltYet>` and `<Todo>` are removed from a page in the same commit that builds what
it describes, and not before.

The directory listing of `registry/bases/base/` is the answer to "does code exist for
this id". One flat `.tsx` file per component id; `scripts/build-registry.mts` registers
every direct child and produces the index entry, the `/view` route and the preview. No
file, no entry, and `<ComponentPreview>` renders `<NotBuiltYet>`. Read the directory
rather than any prose about it, including this prose.

It is not the answer to "is this ready to use". A file can be in the directory and not
be a component at all: a helper or a throwaway dropped in beside them picks up a `/view`
route and a preview with no catalogue row behind it. What makes an id a component is the
catalogue row, and what would make it ready is the review nobody has done.

`status` is frontmatter on a `kind: component` page and on nothing else. The three
values are `planned` (a written specification and no code), `shipped`, and `deprecated`
(still installs, on its way out, with a named replacement and a named removal version).
ADR 0023 is the record. Decision records live in `decisions/` at the repository root,
not on the site.

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
- Turbopack is the bundler. **Never add a `webpack` key to `next.config.mjs`.** It is
  a hard failure, not a warning.
- Never run `next lint`; it was removed. Run `pnpm lint` (ESLint flat config).
- Read `node_modules/next/dist/docs/` when in doubt rather than trusting recall.

## 3. Do not read `searchParams` in the docs route

`app/(chrome)/(docs)/[[...slug]]/page.tsx` must stay statically generated. Reading
`searchParams` there deoptimises the entire docs corpus out of SSG. The `?base=&style=`
switcher is a **client** component using `useSearchParams()` that re-points an
`<IframePreview>` at a `/view/[base]/[style]/…` URL.

## 4. fumadocs: version split is intentional

- `fumadocs-core` **16.15.4** and `fumadocs-ui` **16.15.4** (installed as the alias
  `npm:@fumadocs/base-ui`, so the tree contains Base UI and **zero Radix**). These two
  are exact-pinned and must be bumped together, because `fumadocs-ui` peers
  `fumadocs-core` at an exact version rather than at a range.
- `fumadocs-mdx` is on major **15**. That is correct. Do not "fix" it.
- Import the generated source map from `@/.source`, the provider from
  `fumadocs-ui/provider/next`.
- Page body text comes from `await page.data.getText('processed')`.
  **`page.data.content` does not exist** and fails typecheck (TS2339). This is why
  `source.config.ts` sets `postprocess: { includeProcessedMarkdown: true }`.

## 5. Pinned versions are pinned

Every version in `apps/www/package.json` was resolved live and corresponds to a build
that actually ran green. In particular: `typescript` is `5.9.3` and **never `^5`**,
because npm `latest` is now the 7.x native port. `next` is `16.3.4`, `react`/`react-dom`
`19.2.8`, `zod` `4.4.3`. Do not float a range to "get the latest".

`shadcn` is a **runtime** dependency, not a CLI-only tool: `app/globals.css` does
`@import "shadcn/tailwind.css"`.

Deliberately absent, do not add: `tsx`/`ts-node` (Node 24 runs `.mts` natively),
`culori`/`apca-w3` (the colour maths is hand-written in `lib/color/`), `next-themes`
and `motion` (already transitive under `@fumadocs/base-ui`, so installing them directly
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
over eight paths. The eight are `lib/generated`, `lib/opsinjs.ts`, `registry/__index__.ts`,
`registry/generated`, `app/tokens.generated.css`, `content/docs/reference/generated`,
`content/docs/reference/error-codes.mdx` and `public/r`. The list here is the one in
`apps/www/package.json`'s `check:generated` script; if the two ever disagree, that script
wins and this line is the bug. If you hand-edit one of those
paths, CI fails. That is the point. Change the source (`tokens/*.json`,
`registry/catalogue.ts`, or the file under `registry/bases/` the generator reads) and
regenerate.

Two of those eight paths are hand-written files carrying one spliced generated region
each: `lib/opsinjs.ts`, the substrate `shadcn add` copies into a consumer's project, and
`content/docs/reference/error-codes.mdx`. The prose outside the markers is yours to write;
everything between them is rewritten by `build-tokens.mts` on every run. Nothing under
`content/docs/components` is generated; every page there is authored. CI also runs
`--check` on each of the three generator scripts *before* `generate`, so that each one
compares the tree as checked out against what it would write. Afterwards it would only
be comparing freshly written files with themselves.

`app/tokens.generated.css` is emitted by `scripts/build-tokens.mts`. `app/globals.css`
owns only the one `@import` line that pulls it in, at its fixed position.

## 8. The corpus is rooted, and paths come from `lib/routes.ts`

`DOCS_BASE` is **empty**. The documentation is the site: the introduction renders at `/`,
Components at `/components`, a component at `/components/button`. There is no landing page
in front of it and no `/docs` prefix behind it. The `.md` twin of a page is that page plus
`.md`, and the index twin is `/index.md`.

- In `.ts`/`.tsx`: build every path through `lib/routes.ts`, and **never by
  concatenation**. `` `${routes.docs()}/reference/api` `` is `//reference/api`, which
  matches nothing and fails silently; `routes.docs("reference", "api")` is right whatever
  the base is. `assert-ia.mts` still fails the build on a literal `/docs/` outside
  `lib/routes.ts` and `lib/source.ts`, with a short allowlist for `next.config.mjs`,
  `app/robots.ts`, `app/sitemap.ts` and `lib/layout.shared.tsx`.
- In `.mdx`: use **relative** file links resolved by fumadocs' `createRelativeLink`.
  An absolute site link is banned with no exception. IA005 still checks that a
  `[Label](/…)` Link entry in a `meta.json` resolves, for the day somebody adds one.
- **No top-level folder under `content/docs/` may be named after a real route.** Next
  resolves a static segment before the catch-all, so `content/docs/colors/` would be
  shadowed whole by `/colors` and every page under it would serve the colour browser.
  IA007 fails the build on that collision.

This is what keeps a future `[lang]` segment a bounded change instead of a migration, and
it is what made moving the corpus to the root a one-line change to `DOCS_BASE` plus the
two rewrite sources in `next.config.mjs`.

## 8a. The site has the clawscale shape

The documentation is modelled on clawscale and blueprintjs.com, and ADR 0026
(`decisions/0026-the-site-takes-the-clawscale-shape.md`) is the record. There is no top
navigation, no breadcrumb, no right-hand table of contents and no footer on a
documentation page. The sidebar is the navigation: a wordmark, a Theme row, a Search
row, then six sections, which are opsinjs (the introduction and the guides at the
root), Foundations, Components, Health, Patterns and Reference. Only the section you
are in is expanded, and the page you are on lists its own H2 and H3 headings under its
row.

The root `meta.json` and each section's `meta.json` order the pages; a `---Label---`
separator starts a labelled group. `lib/docs-nav.ts` reads the page tree into the six
sections and `components/docs/sidebar.tsx` draws them, inside
`components/docs/shell.tsx`. A section is one folder with no nested folders, apart from
`reference/generated`, which `...generated` lifts inline. The tool pages, the machine
surfaces and the licence are linked from `components/site-footer.tsx`, which the `(home)`
and `(playground)` layouts render. A URL that stopped being a page is answered by
`proxy.ts` from `lib/redirects.ts`, and so is its `.md` twin.

## 9. Never invent evidence

Never fabricate a citation, a statistic, a DOI, a date or a study. A page states either a
checkable source (`evidence: cited`) or an honest opinion (`evidence: opinion`). Prefer
`opinion` to a plausible-looking reference. Do not copy NHS or other Crown-copyright
text; cite it and write your own prose.

## 10. British prose, American code

`colour`, `behaviour`, `visualisation` in prose. `color`, `ColorScale`, `--color-*` in
code and CSS, because Tailwind and the CSS spec force it. Component ids are kebab-case
in paths and in the catalogue, PascalCase in prose.

## 11. Ownership

Files are written by workers with disjoint file sets. If a file looks wrong but is not
yours, say so in your summary rather than editing it.

## 12. Never an em dash or an en dash

U+2014 EM DASH and U+2013 EN DASH do not appear anywhere in this repository. Not in
prose, not in interface copy a patient reads, not in a heading, not in frontmatter, not
in a table cell, not in a code comment, not in JSDoc, not in a string literal, not in a
JSON description, not in a diagram label, not in anything rendered to a screen, and not
in a commit message. `pnpm check:dashes` walks the whole tree and fails the build on
every occurrence, with no allowlist and no exempt file.

**Remove one by rewriting the sentence.** A comma, a colon, a semicolon, a bracket pair,
a hyphen or three dots dropped into the hole the dash left is the same sentence still
reaching for a dash, and a reviewer sends it back. Write two sentences. Spell the
connective out as a word at the head of the second one: *because*, *so*, *therefore*,
*which is why*, *rather than*. Where the dashes wrapped an insertion, make the insertion
the main clause, because in this corpus the insertion is usually the hedge, the scope
limit or the prohibition and is the half worth keeping. A span between two values takes
the word "to", and the unit is written once after the second number.

A reframe may not change what the sentence claims. Modal verbs, thresholds and the
people who own them, hedges, negations, disclaimers and the honesty markers all come
through unaltered; a shorter disclaimer is a weaker disclaimer. If you cannot remove the
dash and keep all of that, leave the sentence alone and say so in your summary.

**Two marks are not this character and stay.** U+2212 MINUS SIGN is arithmetic notation
and is house style in front of a negative number. U+00B7 MIDDLE DOT is the field
separator in a browser-tab title template and in a machine index row, and it is
forbidden in body copy, in a heading, in a table cell and in any string a patient reads.
The ASCII hyphen keeps every job it already has in slugs, ids, custom properties,
compound modifiers, frontmatter fences, horizontal rules and table delimiter rows. One
mark is a permitted replacement in one named place: `<Term>` joins an expansion to its
gloss with a comma, because the two are an apposition and opsinjs may not write a
connective word into copy the product's glossary supplied.

Any file that has to discuss the ban names the characters as U+2014 and U+2013, or as
the escapes `\u2014` and `\u2013` inside a string or a regex. Written that way the
checker, this file and the rule pages never trip the gate, which is why the gate needs
no allowlist for anyone to grow. `DASH-DOCTRINE.md` at the repository root is the full
playbook: the recognition table, twenty-two reframing roles with worked examples, the
seven meanings a reframe may never change, and the fourteen-point self-check to run on
your own file before you declare it done.

## 13. Pages are lean

A component page is read the way a Blueprint page is read: install it, copy the
usage, see it, learn when not to use it, check the props. Its outline is the six
sections in `lib/status.ts`, in this order: Usage, Examples, When to use it, Clinical
meaning (a `health-*` category only, and required there), Accessibility, Props
interface. `assert-ia` rule LEAN001 fails the build when the body passes 1,000 words,
or 1,250 on a `health-*` page. The count is every whitespace-separated token in the
body, JSX and code included.

`<StubNotice status="shipped">` opens the page above the first H2 with the SAFE001
sentence and at most three one-sentence open questions, and C6001 fails the build when
it sits anywhere else. Usage is the install command, the import and a minimal use.
Examples opens with the default preview, then one or two sentences over each named
example. When to use it is the `<WhenToUse>` lists, one line per entry. Clinical meaning
is four bold-led facts. Accessibility is a labelled triage of a few lines above the
keyboard table and the contrast report. Props interface is the generated props table,
a short paragraph, and the data attributes table where the component has one.

Every other page names its own headings, like a clawscale page, and LEAN002 holds a
hand-written page to 1,200 words, or 1,500 on a health page; generated pages are exempt.
Doctrine is linked, never restated. The argument for a decision lives in `decisions/`
and in git history, not on the page. `content/docs/components/button.mdx` is the
exemplar for a component page; copy its shape, never its facts. `content/_templates/`
holds the two skeletons.
