# Security policy

## Reporting a vulnerability

Report it privately through this repository's **Security** tab, under **Report a
vulnerability**, or go straight to the
[private reporting form](https://github.com/prashantonomy/opsinjs/security/advisories/new).
Never open a public issue for a vulnerability. This project has no security email
address, so anybody who offers you one is not us.

Include what you found, the smallest reproduction you can manage, what an attacker gains,
and the package version, commit or page you were looking at. If you are not sure it is a vulnerability,
report it anyway and say so.

## What to expect

This is a small, unfunded project with no service-level agreement and no bug bounty. We
aim to acknowledge a report within 7 days and to agree a fix or a plan within 30 days.
You are credited in the advisory unless you ask not to be.

## Scope

- Every published version of `@opsinjs/react`, `@opsinjs/tokens`, `@opsinjs/color` and
  `opsinjs`: injection, script execution from data, or an unsafe DOM operation.
- The release pipeline: a published tarball that differs from the source at the commit
  its provenance names, or a version after 0.1.0 that `.github/workflows/release.yml`
  did not publish. 0.1.0 is published by hand, once, as [RELEASING.md](RELEASING.md)
  describes.
- The documentation site at <https://opsinjs.pensievelabs.org>, including its API routes
  and the `/r/index.json` and `/r/docs.json` machine surfaces.
- A dependency advisory that reaches what we publish or serve.

Out of scope: an advisory in a build-time tool that never leaves this repository, and
anything that needs an attacker who already controls your machine.

## Clinical safety is not a security issue

If a component or a page could lead somebody to misread their own health data, that is
more urgent than most security reports, and it belongs where a reviewer can see it. Open a
public [safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml).

## Supported versions

opsinjs is at 0.x on a single release line. A fix ships in the next version, and because
the four packages share one version, that release covers all four.

A confirmed vulnerability is published as a
[GitHub security advisory](https://github.com/prashantonomy/opsinjs/security/advisories)
on this repository, naming the affected versions and the first fixed one. The affected
versions are deprecated with `npm deprecate`, so anyone who installs one sees a warning
pointing at the fix, and they are not unpublished, because unpublishing breaks every
lockfile that names them. To pick up the fix, upgrade and read the changelog.

A project still holding source copied through the old shadcn registry does not receive
fixes this way. Replace the copied files with `@opsinjs/react`.
