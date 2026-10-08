# Security policy

## Reporting a vulnerability

Report it privately through this repository's **Security** tab, under **Report a
vulnerability**, or go straight to the
[private reporting form](https://github.com/prashantonomy/opsinjs/security/advisories/new).
Never open a public issue for a vulnerability. This project has no security email
address, so anybody who offers you one is not us.

Include what you found, the smallest reproduction you can manage, what an attacker gains,
and the commit or page you were looking at. If you are not sure it is a vulnerability,
report it anyway and say so.

## What to expect

This is a small, unfunded project with no service-level agreement and no bug bounty. We
aim to acknowledge a report within 7 days and to agree a fix or a plan within 30 days.
You are credited in the advisory unless you ask not to be.

## Scope

- Component source that the registry serves at `/r/*.json`: injection, script execution
  from data, or an unsafe DOM operation.
- The registry pipeline: serving bytes other than the ones documented, or resolving a
  component name to an unexpected file.
- The documentation site at <https://opsinjs.pensievelabs.org>, including its API routes.
- A dependency advisory that reaches what we ship or serve.

Out of scope: an advisory in a build-time tool that never leaves this repository, and
anything that needs an attacker who already controls your machine.

## Clinical safety is not a security issue

If a component or a page could lead somebody to misread their own health data, that is
more urgent than most security reports, and it belongs where a reviewer can see it. Open a
public [safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml).

## Supported versions

Nothing has been released or versioned yet. A fix lands on `main` and deploys to the site.
Because you copy the source into your own project, each advisory also names the exact
change to apply by hand.
