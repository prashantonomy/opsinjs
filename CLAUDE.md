# CLAUDE.md

Conventions for Claude Code working in this repository. `AGENTS.md` carries the
technical rules and is the longer document, so **read it first**. This file is the
working protocol on top of it.

## The one-line summary

This repo is the documentation site for a design system, and the component layer under
it. Every component in the catalogue is built, against a specification that was written
first and is binding, and not one of them has been reviewed. So there are two jobs here
and you have to know which one you are on. Writing a *specification* precise enough that
the component could be built from it, and honest enough that no human and no agent
mistakes it for something anybody has checked, is still most of the work. Building a
component means building the one its specification already describes: you implement it,
you do not redesign it, and you do not promote its page past what the code actually
does.

## Before you edit

1. `AGENTS.md` §2 (Next 16 has two root layouts and no `app/layout.tsx`) and §4
   (fumadocs 16 / mdx 15 API shapes) are the two places recall will betray you.
2. Check whether the file you are about to touch is **generated**. If it is, edit its
   *source* instead. The source is `tokens/*.json`, `registry/catalogue.ts`, a file
   under `registry/bases/`, or the emitting script. The authority for what is generated
   is the `check:generated` script in `apps/www/package.json`, not a prose copy of the
   list.
3. Check the page's `kind` frontmatter. Six kinds exist, one per sidebar section:
   `guide`, `foundation`, `component`, `health`, `pattern` and `reference`. Only
   `kind: component` fixes the headings: Usage, Examples, When to use it, Clinical
   meaning (on a `health-*` category only), Accessibility, Props interface, in that
   order (`apps/www/lib/status.ts`). Every other page names its own headings, the way a
   clawscale page does; do not invent a section to look complete.

## Prose bar

A `kind: component` page is lean by contract (`AGENTS.md` §13): a few hundred words
of component calls and short paragraphs, `<StubNotice>` above the first H2 with at
most three one-sentence open questions, and `assert-ia` rule LEAN001 fails the build
past 1,000 words (1,250 on a `health-*` page). On a component page, cut argument and
keep facts; link the doctrine page rather than restating it; copy the shape of
`content/docs/components/button.mdx`.

Every other page aims at the density of the clawscale docs
(`apps/docs` in github.com/prashantonomy/clawscalejs) and blueprintjs.com: a sentence or two, then a
few short sections of facts, tables where the facts are parallel, and a link to the page
that owns anything else. LEAN002 caps a hand-written page at 1,200 words (1,500 on a
health page). No filler, no "this section describes…", no lorem ipsum, no `TODO: write
this` (use `<Todo>`, which is counted). When a rule has an exception, name the exception.
When you say "don't", name what to do instead.

## No em dash, no en dash

U+2014 and U+2013 appear nowhere: not in prose, not in frontmatter, not in a table cell,
not in a heading, not in a code comment or a JSDoc line, not in a string literal, not in
a JSON description, and not in anything a reader sees on screen. `pnpm check:dashes`
fails the build on every occurrence and has no allowlist.

Take a dash out by rewriting the sentence. Moving a comma, a colon, a semicolon, a
bracket pair, a hyphen or three dots into its seat is the same sentence still reaching
for a dash, and it comes back in review. Write two sentences, spell the connective out
as a word, or make the inserted clause the main one, and keep every hedge, negation,
modal and disclaimer the dash was holding. A span between two values takes the word
"to". Name the characters as U+2014 and U+2013 when you have to write about them.
`AGENTS.md` §12 is the rule and `DASH-DOCTRINE.md` is the playbook.

## The four honesty components

`<NotBuiltYet>` (nothing renders here yet), `<StubNotice>` (this page is a spec, so do
not generate code against it), `<NoDataYet>` (this generated table has no source data yet,
here is the script that will fill it), `<Todo>` (a measured gap). Use them instead of
softening the truth in prose. They are still required for everything that is not built,
which is most of the corpus.

Building the component sheds exactly two of them. `<NotBuiltYet>` and `<Todo>` go in the
same commit that moves a page to `shipped`, and a shipped page carries neither. The other
two stay, for different reasons. `<StubNotice>` stays and gains `status="shipped"`, and it
becomes the review signal: the component is implemented and installable, the API may change
in any release, and it has had no accessibility review and no clinical review, so it is not
for a production health surface. Write that in the page's own MDX rather than reaching for
a generated string, because the `.md` twins are built from page text, and `assert-ia` rule
SAFE001 fails the build on a component page that drops it. Its open safety questions are
still open: the notice carries at most three of them, one sentence each, and the rest are
in git history rather than answered. `<NoDataYet>` stays wherever a generator genuinely has no source data: a
shipped page whose contrast pairs have not been measured must say so rather than print a
table nobody produced. The MDX
vocabulary is **closed**: only the tags listed in the anatomy contract exist, `assert-ia`
fails the build on any other JSX tag, and content work never defines a new one.

## Health writing

- Declare `evidence: cited | opinion | mixed` on every `kind: health` page and mean it.
- Never invent a citation, statistic, DOI, date or study. An opinion honestly labelled is
  worth more than a fabricated reference and is the only acceptable fallback.
- Do not copy NHS or other Crown-copyright text. Cite it; write your own words.
- opsinjs is a presentation layer. No page may state a clinical threshold as though
  opsinjs owns it, or imply the system triages, diagnoses or advises.

## The two colour axes never mix

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

When several agents work in parallel, none of them runs `git`, `pnpm install`, `turbo`
or a build. Whoever coordinates them runs those afterwards.

## Git and pull requests

Work on a branch, never on `main`. Every change reaches `main` through a pull request,
the maintainer's own included (`GOVERNANCE.md`), so a contributor's agent pushes to the
contributor's fork and opens the pull request from there. Commit, push or open a pull
request only when the person you are working for asks, or has given you standing
permission to. Fill in the pull request template, and update the docs that describe the
change in the same pull request.

## Ownership

Keep a change to the files it needs. If a file outside it is wrong, say so in the pull
request or your summary rather than fixing it in the same change. When several agents
work in parallel, each owns a disjoint set of files, and touching a file outside your
set corrupts a worker running at the same time.

## Definition of done for a page

Correct frontmatter (`kind` is mandatory everywhere, `status` only on a component page) ·
on a component page, the six sections in canonical order · relative MDX links, never
absolute `/docs/` · every component id matched against the catalogue · every claim
either generated, cited, or marked as opinion · and nothing anywhere that implies a
component has been built when it has not. A component page reads `shipped` only once its file under `registry/bases/base/`
renders at `/view/base/base-lyra/component/<id>` and `pnpm typecheck`, `pnpm lint` and
`pnpm check` all pass; the page's `status` and its `registry/catalogue.ts` row move
together, in one commit. `status` exists only on a `kind: component` page.
