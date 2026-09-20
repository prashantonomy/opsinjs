# Contributing to opsinjs

opsinjs is a React design system for consumer- and patient-facing health apps, and
this repository is two things at once: the documentation site and the component layer
built underneath it. The component pages were written as specifications first, and
those specifications are binding. When you build a component you build the one its
specification already describes. You implement it, you do not redesign it, and you do
not promote its page past what the code actually does.

This file is the practical starting point. The fuller guide, including the component
intake questions and the four routes a change can take, lives in the handbook at
[Contributing](https://opsinjs.pensievelabs.org/docs/handbook/contributing). That
address is being attached to a fresh deployment and does not resolve yet.

## Repository

The canonical repository is <https://github.com/prashantonomy/opsinjs>. It is private
today, so some public addresses do not resolve yet and only collaborators can reach the
repository Security tab.

## Running the site

You need Node 24 or newer. The build scripts are `.mts` files run directly by `node`
through native type stripping, so there is no `tsx` or `ts-node` in the dependency
tree, and an older Node cannot run them.

```bash
pnpm install
pnpm dev        # docs site on http://localhost:4000
```

The `predev` step regenerates tokens, the registry index and the reference tables
before the server starts, so the first `pnpm dev` after a pull can take a moment.

## The gates a change must pass

Every change clears three commands before it lands. Run them from the repository root.

```bash
pnpm typecheck   # regenerates .source, runs next typegen, then tsc --noEmit
pnpm lint        # ESLint flat config; never run `next lint`, it was removed
pnpm check       # drift and integrity gate, described below
```

`pnpm check` bundles several gates into one:

- **Generated-file drift.** Every checked-in generated artefact is diffed against its
  source. If they disagree the gate fails.
- **Information architecture.** Each page must carry the frontmatter its `kind`
  prescribes and exactly the headings that `kind` prescribes, no more and no fewer.
- **Accessibility from source.** The accessibility tables are checked against the token
  source rather than against hand-written copies.
- **llms.txt.** The machine-readable index stays in step with the corpus.
- **Dashes.** The no-dash rule below is enforced here with no allowlist.

## No em dash, no en dash

U+2014 and U+2013 appear nowhere in this repository: not in prose, not in frontmatter,
not in a table cell, not in a heading, not in a code comment, not in a string literal,
and not in anything a reader sees on screen. `pnpm check` fails on every occurrence.

Take a dash out by rewriting the sentence rather than by sliding a comma, a colon or a
hyphen into its seat. Write two sentences, spell the connective out as a word, or make
the inserted clause the main one. A span between two values takes the word "to".
`DASH-DOCTRINE.md` is the full playbook.

## The honesty vocabulary is closed

Most of the corpus documents work that is specified but not yet shipped, and it has to
say so plainly. Four components carry that truth:

- `<NotBuiltYet>` for a page where nothing renders yet.
- `<StubNotice>` for a page that is a specification, so no code should be generated
  against it.
- `<NoDataYet>` for a generated table whose source data does not exist yet.
- `<Todo>` for a measured gap, which the coverage report counts.

Use these instead of softening the truth in prose. The MDX vocabulary is closed. Only
the tags listed in the anatomy contract exist, the `assert-ia` gate fails on any other
JSX tag, and content work never defines a new one.

## Never hand-edit generated files

Files under `lib/generated/`, `registry/generated/`, `content/docs/reference/generated/`,
`content/docs/reference/api/` and `public/r/`, along with `registry/__index__.ts`,
`lib/opsinjs.ts`, `app/tokens.generated.css` and `content/docs/handbook/error-codes.mdx`,
are produced by scripts. Edit the source instead. The source is a file under `tokens/`,
`registry/catalogue.ts`, a file under `registry/bases/`, or the emitting script itself.
Then regenerate. The authoritative list of what the drift gate diffs is in the www
package manifest, not in any prose copy of it.

## What is real today

Every component in the catalogue is built and installable, and every one of them is
`shipped`. That word means the code exists and installs as source. It does not mean
anybody has checked it: no opsinjs component has had an accessibility review or a
clinical review, so none of them is for a production health surface, and any API may
change in a release without a deprecation cycle. Read each component page's
`<StubNotice>`, which carries that sentence and names the questions still open on that
component in particular.

Components install through the `@opsinjs` namespace registered in a project's
`components.json`. Nothing is published to npm, and the `packages/*` workspace glob
points at a directory that is reserved and empty.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org) for the subject line,
for example `fix(www): correct the contrast table source`. Explain in the body why the
change is needed, not what the diff already shows. A component page reads `shipped` only
once its file under `registry/bases/base/` renders and all three gates pass, and the
page's `status` moves together with its `registry/catalogue.ts` row in one commit. Only
a component page has a status.

## Reporting a security issue

Report a security vulnerability through the repository Security tab on GitHub, using
"Report a vulnerability". There is no security email. While the repository is private
only collaborators can reach that tab, and it opens to everyone once the repository
becomes public. A clinical-safety concern is not a security vulnerability. Raise it as
a public issue instead.
