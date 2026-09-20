# Security policy

opsinjs is distributed as source you copy into your own repository, so the threat
model is not that of a runtime dependency. This policy says how to report a
vulnerability, what counts as one here, and what you can expect from a small,
unfunded project in return.

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.** Once the repository
is public, use GitHub private vulnerability reporting on the canonical repository,
<https://github.com/prashantonomy/opsinjs>, reached through the repository
Security tab at "Report a vulnerability". The report is then visible only to the
maintainers until there is a fix.

There is no security email address for this project, and anybody who gives you one
is not us.

Private vulnerability reporting is a feature of public repositories, so it is not
available while this repository is private. It will be enabled when the repository
is made public, which is a release blocker for exactly this reason. Until then the
repository is not reachable by an outside reporter at all.

In the report, please include what you found, the smallest reproduction you can
manage, what an attacker gets from it, and which version or commit you were
looking at. If you are not sure whether something is a vulnerability, report it
anyway and say you are not sure. A false positive costs a short conversation. An
unreported real one does not.

## What to expect

This is a small, unfunded project and it will not pretend otherwise. There is no
service-level agreement, no bug bounty, and no payment. What you get is an
acknowledgement, a genuine assessment, and credit in the advisory unless you ask
not to be named.

## What counts as a vulnerability here

- **Code the registry emits** that leads to injection, script execution from
  data, or an unsafe DOM operation. A component that renders patient-supplied
  text is the obvious place to look.
- **The registry pipeline**, where it could serve a consumer different bytes from
  the ones documented, or resolve a component name to an unexpected file path.
- **The documentation site** itself, including its API routes.
- **A dependency advisory** that actually reaches consumers through what we ship,
  as opposed to one in a build-time tool that never leaves this repository.

## What is not a security issue

**A clinical safety concern is not a vulnerability.** If a component, a piece of
guidance, or an example could lead a person to misread their own health data,
that is more urgent than most security reports, and it belongs in a public issue
where a clinical reviewer can see it. Say clearly that it is a safety concern.
Routing it through the private security channel only delays it.

Also not vulnerabilities: a missing hardening header on a documentation page with
no accounts and no data, the absence of a feature, a dependency advisory that
does not reach consumers, and anything requiring an attacker who already controls
the developer's machine.

## Advisories

No advisory has been published and no version has been released, so there is no
released version to attach one to. Every component in the catalogue is built and
installable, and its source is served through the registry for anybody to copy in, so
a defect in one would be handled exactly as described above. It would simply have no
version number to name. When there are advisories, each will name the affected
versions and the fix, and because you own the copied source, each will also name
the exact change to apply by hand if you are not taking a full upgrade.
