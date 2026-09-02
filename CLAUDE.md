# CLAUDE.md

Conventions for Claude Code working in this repository. `AGENTS.md` carries the
technical rules and is the longer document — **read it first**; this file is the
working protocol on top of it.

## The one-line summary

This repo is the documentation site for a design system whose component layer is being
built, against specifications that were written first and are binding. So there are two
jobs here and you have to know which one you are on. Writing a *specification* precise
enough that the component could be built from it, and honest enough that nobody — human
or agent — mistakes it for something shipped, is still most of the work. Building a
component means building the one its specification already describes: you implement it,
you do not redesign it, and you do not promote its page past what the code actually
does.

## Before you edit

1. `AGENTS.md` §2 (Next 16 has two root layouts and no `app/layout.tsx`) and §4
   (fumadocs 16 / mdx 15 API shapes) are the two places recall will betray you.
2. Check whether the file you are about to touch is **generated**. If it is under
   `lib/generated/`, `registry/generated/`, `content/docs/reference/generated/`,
   `content/docs/reference/api/`, `public/r/`, or is `registry/__index__.ts` or
   `app/tokens.generated.css`, edit its *source* instead — `tokens/*.json`,
   `registry/catalogue.ts`, a file under `registry/bases/`, or the emitting script.
   Those seven paths are exactly what `check:generated` diffs; the authority is
   `apps/www/package.json`, not this list.
3. Check the page's `kind` frontmatter. It determines the headings exactly. Do not add
   a heading the outline for that `kind` does not have, and do not drop one it does.

## Prose bar

Aim at the density of ui.shadcn.com and the NHS service manual. Concretely, for every
required heading: at least one paragraph a working developer or designer would be glad
to have read. No filler, no "this section describes…", no lorem ipsum, no `TODO: write
this` (use `<Todo>`, which is counted). When a rule has an exception, name the exception.
When you say "don't", name what to do instead.

## The four honesty components

`<NotBuiltYet>` (nothing renders here yet), `<StubNotice>` (this page is a spec — do not
generate code against it), `<NoDataYet>` (this generated table has no source data yet,
here is the script that will fill it), `<Todo>` (a measured gap). Use them instead of
softening the truth in prose. They are still required for everything that is not built,
which is most of the corpus.

Promotion sheds exactly two of them. `<NotBuiltYet>` and `<Todo>` go in the same commit
that moves a page to `alpha`, and a promoted page carries neither. The other two stay,
for different reasons. `<StubNotice>` stays and gains its real `status` — at `alpha` it
stops saying "nothing is implemented" and starts saying "this is not stable yet", which
is the truth a reader needs, and its open safety questions are still open. `<NoDataYet>`
stays wherever a generator genuinely has no source data: an `alpha` page whose contrast
pairs have not been measured must say so rather than print a table nobody produced. The MDX vocabulary is **closed**: only the
tags listed in the anatomy contract exist, `assert-ia` fails the build on any other JSX
tag, and content work never defines a new one.

## Health writing

- Declare `evidence: cited | opinion | mixed` on every `kind: health` page and mean it.
- Never invent a citation, statistic, DOI, date or study. An opinion honestly labelled is
  worth more than a fabricated reference and is the only acceptable fallback.
- Do not copy NHS or other Crown-copyright text. Cite it; write your own words.
- opsinjs is a presentation layer. No page may state a clinical threshold as though
  opsinjs owns it, or imply the system triages, diagnoses or advises.

## Two colour axes — the invariant

Category colour (what kind of measurement this is) and status colour (how urgent it is)
are separate axes and **never mix on one element**. A red that means "cardiac" and a red
that means "act now" cannot coexist. Status is never carried by colour alone: it always
has a word and, where space allows, an icon. If you find yourself writing an example that
mixes them, the example is the bug.

## Commands

```bash
pnpm dev            # docs site, port 4000
pnpm typecheck      # fumadocs-mdx && next typegen && tsc --noEmit
pnpm lint           # never `next lint`; it no longer exists
pnpm check          # generated-file drift + IA assertions + llms.txt
pnpm --filter @opsinjs/www run generate
```

Do not run `git`, `pnpm install`, `turbo` or a build during a parallel authoring phase —
the sequential phases own those.

## Ownership

File sets are disjoint and assigned. Touching a file outside your set corrupts a worker
running at the same time. If a file outside your set is wrong, report it in your summary;
do not fix it.

## Definition of done for a page

Correct frontmatter (`status` and `kind` are mandatory) · exactly the headings its `kind`
prescribes · relative MDX links, never absolute `/docs/` · every component id matched
against the catalogue · every claim either generated, cited, or marked as opinion · and
nothing anywhere that implies a component has been built when it has not. A component
page earns `alpha` only once its file under `registry/bases/base/` renders at
`/view/base/base-lyra/component/<id>` and `pnpm typecheck`, `pnpm lint` and `pnpm check`
all pass; the page's `status` and its `registry/catalogue.ts` row move together, in one
commit.
