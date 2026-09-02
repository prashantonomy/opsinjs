# CLAUDE.md

Conventions for Claude Code working in this repository. `AGENTS.md` carries the
technical rules and is the longer document — **read it first**; this file is the
working protocol on top of it.

## The one-line summary

This repo is a documentation site for a design system whose components do not exist
yet. Your job is almost never to write a component. It is to write a *specification*
precise enough that the component could be built from it, and honest enough that
nobody — human or agent — mistakes it for something shipped.

## Before you edit

1. `AGENTS.md` §2 (Next 16 has two root layouts and no `app/layout.tsx`) and §4
   (fumadocs 16 / mdx 15 API shapes) are the two places recall will betray you.
2. Check whether the file you are about to touch is **generated**. If it is under
   `lib/generated/`, `content/docs/reference/generated/`, `public/r/`, or is
   `registry/__index__.ts` or `app/tokens.generated.css`, edit its *source* instead —
   `tokens/*.json`, `registry/catalogue.ts`, or the emitting script.
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
softening the truth in prose. The MDX vocabulary is **closed**: only the tags listed in
the anatomy contract exist, `assert-ia` fails the build on any other JSX tag, and content
work never defines a new one.

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
nothing anywhere that implies a component has been built.
