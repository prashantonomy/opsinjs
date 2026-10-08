# Contributing

Thanks for helping. opsinjs is a design system for health apps that patients read, so a
mistake here can mislead somebody about their own health. The process is short, and it is
the same for people and for AI agents.

Not a software engineer? [Contribute with Claude Code](https://opsinjs.pensievelabs.org/contribute)
is a plain-language guide for clinicians and health scientists, with every step, example
prompts and a list of what not to do.

## Ground rules

1. Read [AGENTS.md](AGENTS.md) first. It holds the technical rules, and agents read it too.
2. Keep one change to one pull request.
3. Open an issue before anything bigger than a fix. The table below says when.
4. Never write U+2014 (em dash) or U+2013 (en dash). `pnpm check` fails on both, so
   rewrite the sentence instead.
5. Never invent a citation, a statistic or a study. Label an opinion as an opinion.
6. Never put real patient data, a secret or a token in code, an issue, a screenshot or a
   prompt. Use made-up example data.
7. Never edit a generated file by hand. Change its source, then run
   `pnpm --filter @opsinjs/www run generate`.

## What needs an issue first

| Change | Before you start |
| --- | --- |
| A typo, a broken link, a small docs or code fix | Nothing. Open a pull request |
| A token change, such as a colour, a type size or a spacing step | An issue. A token is a public API, so say who it affects |
| A new component or pattern | A [proposal](https://github.com/prashantonomy/opsinjs/issues/new?template=proposal.yml) saying what it asserts about somebody's health and what happens when it is wrong |
| A change to the Health doctrine | An issue with a dated rationale and an honest `evidence` value |

## Setup

You need Node 24 or newer and Git.

```bash
corepack enable
pnpm install
pnpm dev        # http://localhost:4000
```

## Making a change

1. Fork the repository and create a branch from `main`.
2. Make the change, and update the docs page that describes it in the same pull request.
3. Run the three gates from the repository root. All three must pass.

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm check
   ```

4. Open a pull request against `main`, fill in the template, and link the issue.
5. Check the preview deployment linked on the pull request. A fork's preview waits for a
   maintainer to authorise it.
6. Answer review comments by pushing more commits to the same branch.

## Pull request titles

Pull requests are squash merged, so the title becomes the commit on `main`. Write it in
[Conventional Commits](https://www.conventionalcommits.org) form: `type(scope): summary`,
lowercase after the colon, no full stop, 72 characters or fewer. For example
`fix(www): correct the contrast table source` or `docs: explain the status ladder`. The
types are `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci` and `chore`.

## Changing the docs

- Pages are MDX files in `apps/www/content/docs`, and the sidebar order is in each
  folder's `meta.json`.
- Link another page with a relative file link, such as `../health/alerts.mdx`.
- A component page keeps its six sections in order. Every other page names its own
  headings. `apps/www/content/_templates/` has both skeletons.
- Only the tags in `apps/www/components/mdx.tsx` exist. Say what is missing with
  `<NotBuiltYet>`, `<StubNotice>`, `<NoDataYet>` or `<Todo>` rather than softening the
  prose.
- A page that moves or is renamed needs a redirect in `apps/www/lib/redirects.ts`.
- A change users will notice gets a line in `apps/www/content/docs/changelog.mdx`.
- The site deploys from `main` after a merge, and every pull request gets a preview.

## Working with AI agents

AI-assisted contributions are welcome. `AGENTS.md` and `CLAUDE.md` give an agent the
rules. You are still responsible for what you submit, so read the diff, look at the
change in a browser and run the gates before you open the pull request.

## Reviews

A maintainer reviews and merges every pull request, and [GOVERNANCE.md](GOVERNANCE.md)
says who decides what. Nobody on the project can give a clinical review today, so a
health claim stays marked as unreviewed until somebody can.

## Conduct and security

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Report a
vulnerability as [SECURITY.md](SECURITY.md) describes, never in a public issue. A
clinical safety concern is not a vulnerability, so open a public
[safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml)
for that.
