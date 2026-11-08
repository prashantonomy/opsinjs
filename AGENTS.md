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
`parts`/`tree`/`rows` data. A page reads `shipped` only when
`packages/react/src/components/<id>.tsx` exists, its demo at
`apps/www/registry/demos/<id>.tsx` renders at `/view/base/base-lyra/component/<id>`, and
`pnpm typecheck`, `pnpm lint` and `pnpm check` all pass. "It typechecks" is not "it
renders". Frontmatter `status` and the `registry/catalogue.ts` row's `status` move in
the same commit, because nothing cross-checks them for you.

**`shipped` says the component installs with `@opsinjs/react`, and it says nothing about
review.** No opsinjs component has had an accessibility review or a clinical review, so
nothing here is for a production health surface, and the API may change in any release
with a changelog entry. That sentence is authored in each component page's `<StubNotice>` rather than
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

The directory listing of `packages/react/src/components/` is the answer to "does code
exist for this id". One flat `.tsx` file per component id, with named exports only.
`apps/www/scripts/build-registry.mts` reads every direct child: the listing decides which
ids are implemented, and it is what the generated package entry point
`packages/react/src/index.ts` exports. The preview is a separate file,
`apps/www/registry/demos/<id>.tsx`, which imports the component from `@opsinjs/react` the
way a consumer does, and that file is what gets the index entry and the `/view` route. No
demo, no entry, and `<ComponentPreview>` renders `<NotBuiltYet>`. Read the directories
rather than any prose about them, including this prose.

It is not the answer to "is this ready to use". A file can be in the directory and not
be a component at all: a helper or a throwaway dropped in beside them is exported from
`@opsinjs/react` and published with no catalogue row behind it. Shared code belongs in
`packages/react/src/utils.ts` or the substrate, never in `components/`. What makes an id a
component is the catalogue row, and what would make it ready is the review nobody has
done.

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

`app/(chrome)/(docs)/docs/[[...slug]]/page.tsx` must stay statically generated. Reading
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

## 5. Pinned versions are pinned, except where a package publishes a range

Every version in `apps/www/package.json` was resolved live and corresponds to a build
that actually ran green. In particular: `typescript` is `5.9.3` and **never `^5`**,
because npm `latest` is now the 7.x native port. `next` and `eslint-config-next` are
`16.3.8` and move together, `react`/`react-dom` `19.3.0`, `zod` `4.6.5`. Do not float a
range to "get the latest". A security advisory is the exception that moves a pin without
waiting: 16.3.8 is the first release that fixes both GHSA-vcvr-r3jv-pc5j and
GHSA-mcj8-r9mp-w47p.

**The published packages are the one exception, on purpose.** In `packages/*/package.json`,
`dependencies` take caret ranges and `peerDependencies` take ranges (`react` and
`react-dom` are `^19.0.0`), because an exact pin in a library forces its version on every
project that installs it. A dependency between two opsinjs packages is `workspace:^`,
which pnpm rewrites to a caret range when it publishes. `devDependencies` in the packages
stay exact, and so does everything in the docs app and at the root.
`apps/www/scripts/check-versions.mts` enforces both halves.

`shadcn` is not a dependency of anything here. `app/globals.css` does not import
`shadcn/tailwind.css`, nothing installs through the shadcn CLI, and there is no
`components.json` ([ADR 0030](decisions/0030-opsinjs-ships-as-npm-packages.md)).

Deliberately absent, do not add: `tsx`/`ts-node` (Node 24 runs `.mts` natively),
`culori`/`apca-w3` (the colour maths is hand-written in `packages/color/src/` and
published as `@opsinjs/color`), `next-themes`
and `motion` (already transitive under `@fumadocs/base-ui`, so installing them directly
gives you two theme providers), `@tailwindcss/typography` (collides with fumadocs'
forked `prose`), `playwright` (a nightly P2 job; `capture-registry.mts` no-ops without it).

## 6. Node 24, and `.mts` scripts

`engines.node` is `>=24.0.0` at the root and in `apps/www`. Every script under
`apps/www/scripts` is a `.mts` file run by plain `node`. They must be
**erasable-syntax-only** TypeScript: no `enum`, no parameter properties, no `namespace`.
Node type stripping rejects anything that needs code generation.

The published packages declare `engines.node` `>=20.19.0`. That is the floor for a
project that installs them, not for working in this repository.

## 7. Generated, never hand-authored

Prop tables, token tables, data-attribute tables, CSS-variable tables, contrast numbers,
bundle sizes, catalogue rows and the glossary are **generated** into committed files.
`pnpm check:generated` regenerates and then does `git add -N . && git diff --exit-code`
over a fixed list of paths. **The `check:generated` script in `apps/www/package.json` is
the authority for that list**; if this paragraph and that script ever disagree, the
script wins and this paragraph is the bug. In the docs app the list is `lib/generated`,
`registry/__index__.ts`, `registry/generated`, `content/docs/reference/generated` and
`content/docs/reference/error-codes.mdx`. In the packages it is
`packages/react/src/index.ts`, `packages/react/src/opsinjs.ts`,
`packages/tokens/tokens.css`, `packages/tokens/tokens.json`,
`packages/tokens/src/index.ts` and `packages/tokens/src/accents.ts`. If you hand-edit one
of those paths, CI fails. That is the point. Change the source (`tokens/*.json`,
`registry/catalogue.ts`, or the component file under `packages/react/src/components/`
the generator reads) and regenerate.

Two of those paths are hand-written files carrying spliced generated regions:
`packages/react/src/opsinjs.ts`, the substrate every component imports, holds three (the
error table, the unit table and the banned words), and
`content/docs/reference/error-codes.mdx` holds one. The prose and code outside the
markers are yours to write; everything between them is rewritten by `build-tokens.mts`
on every run. Nothing under
`content/docs/components` is generated; every page there is authored. CI also runs
`--check` on each of the three generator scripts *before* `generate`, so that each one
compares the tree as checked out against what it would write. Afterwards it would only
be comparing freshly written files with themselves.

`packages/tokens/tokens.css` is emitted by `scripts/build-tokens.mts`. `app/globals.css`
and `app/product.css` each own only the one `@import "@opsinjs/tokens/tokens.css"` line
that pulls it in, at its fixed position.

## 7a. The packages build and release from here

opsinjs publishes four packages from `packages/`: `@opsinjs/react`, `@opsinjs/tokens`,
`@opsinjs/color` and the unscoped umbrella `opsinjs`. They share one fixed version on
the 0.x line, are MIT licensed and ESM-only, and
[ADR 0030](decisions/0030-opsinjs-ships-as-npm-packages.md) is the record.

- **Build:** `pnpm -r --filter "./packages/*" build`. `tsc` compiles each source file to
  its own output file, with no bundler, so every `"use client"` directive stays at the
  top of its own module and a consumer's bundler can drop what it does not import.
  `@opsinjs/react` also compiles `dist/styles.css` from `styles/standalone.css` with the
  Tailwind CLI. Do not add a bundler to a package build without a new decision record.
  The root script `pnpm build:packages` runs the same command.
- **Check the published shape:** `pnpm -r --filter "./packages/*" lint:package`
  (`pnpm lint:packages`) runs publint and Are the Types Wrong on each package, and
  `node scripts/smoke-pack.mts` (`pnpm smoke:packages`) packs the four, installs the
  tarballs into a throwaway project with npm and imports, renders and resolves what a
  consumer would. It needs the network.
- **Changesets:** a pull request that changes anything under `packages/` carries a
  changeset from `pnpm changeset`. Merging to `main` opens the
  `chore(release): version packages` pull request, and merging that runs `pnpm release`
  from `.github/workflows/release.yml`, which publishes with provenance. Nobody runs
  `npm publish` by hand after the first release. [RELEASING.md](RELEASING.md) is the
  procedure.
- **The docs app consumes the packages through the workspace** (`workspace:*`), and its
  TypeScript paths point at the package sources, so `pnpm dev` needs no package build.
  A demo, an example or a screen imports from `@opsinjs/react` exactly as a consumer
  does, never by a relative path into `packages/`.

## 8. The corpus lives under `/docs`, and paths come from `lib/routes.ts`

`DOCS_BASE` is **`/docs`**. The landing page renders at `/`, the introduction at `/docs`,
Components at `/docs/components`, a component at `/docs/components/button`. The `.md` twin
of a page is that page plus `.md`, and the index twin is `/docs.md`. ADR 0027
(`decisions/0027-the-site-gets-a-landing-page.md`) is the record.

From 2026-09-20 to 2026-10-12 the corpus was rooted and those URLs were public, so
`proxy.ts` sends any path whose first segment is in `LEGACY_ROOT_SEGMENTS`
(`lib/redirects.ts`) to the same path under `/docs`, and `/index.md` to `/docs.md`. That
list is frozen: it records URLs that existed, so a new section never joins it.

- In `.ts`/`.tsx`: build every path through `lib/routes.ts`, and **never by
  concatenation**. `routes.docs("reference", "api")` is right whatever the base is, and
  the base has moved twice. `assert-ia.mts` fails the build on a literal `/docs/` outside
  `lib/routes.ts` and `lib/source.ts`, with a short allowlist for `next.config.mjs`,
  `app/robots.ts`, `app/sitemap.ts` and `lib/layout.shared.tsx`.
- In `.mdx`: use **relative** file links resolved by fumadocs' `createRelativeLink`.
  An absolute site link is banned with no exception. IA005 still checks that a
  `[Label](/…)` Link entry in a `meta.json` resolves, for the day somebody adds one.
- **No app route may take a name in `LEGACY_ROOT_SEGMENTS`.** The proxy would send it into
  `/docs` before it rendered, so a tool page at `/components` would never be seen. IA007
  fails the build on that collision; name the route something else.

This is what keeps a future `[lang]` segment a bounded change instead of a migration.
Moving the base is `DOCS_BASE`, the two rewrite sources and the tracing key in
`next.config.mjs`, and the route folder `app/(chrome)/(docs)/docs/`.

## 8a. The site has the clawscale shape

The documentation is modelled on clawscale and blueprintjs.com, and ADR 0026
(`decisions/0026-the-site-takes-the-clawscale-shape.md`) is the record. The landing page
at `/` (`app/(chrome)/(landing)/`) is the blueprintjs.com banner: the mark, the name, the
tagline, and links to Documentation, Showcase and GitHub, over a dark backdrop, then a
footer with the Pensieve lockup, a "Pensieve Labs" link to pensievelabs.org and a link to its
open source hub. It states nothing the documentation states.
There is no top navigation, no breadcrumb, no right-hand table of contents and no footer
on a documentation page. The sidebar is the navigation: a wordmark, a Theme row, a Search
row, then seven sections, which are opsinjs (the introduction and the guides at the
root), Foundations, Components, Health, Patterns, Reference and Contribute, the
plain-language guide to contributing with Claude Code. Only the section you
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

A showcase screen at `/showcase/<slug>` (`app/(chrome)/(stage)/`) has the shape of the
clawscale showcase pages: the screen and nothing else. It has no header, no footer, no
search and no prose, only a floating bar that leads back to `/showcase` and switches the
theme and the screen size.
The screen fills the window, except that on a window narrower than 1024px it starts
below the bar, so the bar cannot cover the screen's own top row. The screen renders in
a frame onto its `/view` route, because product.css loads nowhere else. A new screen is
an entry in `lib/showcases.ts`, which gives it a card on `/showcase` and a page under
it. Put what a screen refuses and what it composes on a pattern page, never back on its
showcase page.

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

Keep a change to the files it needs, and reach `main` only through a pull request. When
several agents work in parallel, each owns a disjoint set of files. If a file outside
your change looks wrong, say so in the pull request or your summary rather than editing
it.

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
separator in a machine index row, and it is forbidden in body copy, in a heading, in a
table cell, in any string a patient reads, and in any page title or description (§14).
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

## 14. Google Search (SEO)

Any change to a title, a description, metadata, a canonical, robots, the sitemap, a
redirect, structured data, a slug, the host or a name changes what Google shows for this
site. Read `SEO.md` at the repository root and `~/pensievelabs/seo/MASTER.md` first. The
files that decide these carry an `SEO-CRITICAL` comment at the top and are listed in
`SEO.md`. Titles carry no suffix, and no title or description holds a pipe, U+2014, U+2013
or U+00B7. Every company value comes from `apps/www/seo/registry.json`, never typed by
hand, and that file is changed only in `~/pensievelabs/seo` and synced. After the change,
build and run `pnpm --filter @opsinjs/www seo:check`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
