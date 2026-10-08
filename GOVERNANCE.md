# Governance

opsinjs is developed by Claude Code and owned by
[@prashantonomy](https://github.com/prashantonomy), who holds admin rights and the final
say.

## Roles

| Role | Who | Can |
| --- | --- | --- |
| Owner | @prashantonomy | Everything, including settings, secrets, releases and enforcing the code of conduct |
| Maintainer | Claude Code, working for the owner | Triage issues, review and merge pull requests, keep the docs current, prepare releases |
| Contributor | Anyone | Open issues, discussions and pull requests |

## Decisions

1. **Small changes**, such as a fix, a docs correction or an example, need the gates to
   pass and a maintainer review.
2. **Larger changes** need an issue first: a token change, a new component or pattern, a
   change to the Health doctrine, or a breaking API change. The approach is agreed in the
   issue before anybody writes code.
3. **Architecture decisions** are recorded in [`decisions/`](decisions/), one numbered
   record each. A new record arrives as a pull request.
4. **A clinical question nobody here can review** is answered by saying so on the page,
   never by guessing.

## Pull requests

1. Every change reaches `main` through a pull request, the maintainer's own included.
   Nobody pushes to `main` directly, and a branch ruleset enforces it.
2. CI must pass. Its Verify job runs `pnpm typecheck`, `pnpm lint`, `pnpm check`, a
   production build and the live `llms.txt` check, and its Title job checks the pull
   request title. The ruleset requires both.
3. Pull requests are squash merged, and the title becomes the commit on `main`.

## Issues and labels

| Label | Means |
| --- | --- |
| `safety` | Could lead somebody to misread their own health data. Triaged before everything else |
| `bug` | Something renders or behaves wrongly |
| `documentation` | A docs page is wrong, missing, unclear or stale |
| `proposal` | A new component, pattern or token change, waiting for agreement |
| `good first issue` | Small and well described |
| `dependencies` | Opened by Dependabot |

## Docs

The documentation is code. It lives in this repository, changes in the same pull request
as the code it describes, and deploys from `main`. `pnpm check` verifies every page's
frontmatter, outline, links and word budget, the generated tables and the machine
surfaces, and a scheduled check reports pages past their `reviewed` date.

## Dependencies

Dependabot opens pull requests every week. The versions in `apps/www/package.json` are
exact pins, as AGENTS.md section 5 explains, so a bump is merged only when the gates pass
and the pin rules allow it.

## Releases

Nothing is versioned or published to npm yet. The
[changelog](https://opsinjs.pensievelabs.org/changelog) records every change a user would
notice.

## Changing this document

A change to this document needs the owner's approval.
