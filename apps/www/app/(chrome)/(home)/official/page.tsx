import type { Metadata } from "next"
import Link from "next/link"

import { Container, Mono, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import { absoluteUrl, agentRoutes, routes, site } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Official resources",
  description:
    "The canonical domain, repository and the four npm packages opsinjs publishes. A package under any other name, or one without provenance, is not ours.",
  path: routes.official(),
  type: "website",
  section: "Trust",
})

/**
 * `/official` is the anti-impersonation page.
 *
 * Every design system eventually gets a typo-squatted npm package or a mirrored
 * documentation site. The defence is a short, stable list of what is real:
 * four package names, one scope, one repository, and a provenance statement
 * that a reader can check against the registry before installing. Keep the
 * list exact. A page that named a package that does not exist, or missed one
 * that does, would send a developer towards the impostor it exists to stop.
 */
const PACKAGES = [
  { name: "@opsinjs/react", note: "The components and the shared substrate. This is the one most apps install." },
  { name: "@opsinjs/tokens", note: "The design tokens, as CSS custom properties and as data." },
  { name: "@opsinjs/color", note: "The colour engine: OKLCH, WCAG and APCA contrast, ramps and colour-vision simulation." },
  { name: "opsinjs", note: "An umbrella that re-exports the other three under one name." },
] as const

export default function OfficialPage() {
  return (
    <>
      {/*
        The trail Google prints in place of a truncated URL. The site
        entity and the publisher are declared once on the root layout and
        referred to by `@id`, so this block carries only what is local to
        this page.
      */}
      <JsonLd
        data={graph([
          breadcrumbLd([
            { name: "Introduction", path: routes.home() },
            { name: "Official resources", path: routes.official() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Trust"
        title="Official resources"
        lead="Where opsinjs actually lives. If you found it somewhere else, it is not ours."
      />

      <Container className="py-10">
        <Panel className="border border-status-attention bg-status-attention-surface text-status-attention-ink">
          <h2 className="font-medium">
            opsinjs publishes four packages on npm, and no others.
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            They are listed below. Every release after the first, 0.1.0, is
            published from this repository&rsquo;s own GitHub workflow with npm
            provenance, so npm shows which commit built it. 0.1.0 was published
            by hand to create the packages and carries none. A package under
            another name, or a later version of one of these four without
            provenance, did not come from us. Do not install it, and please
            report it. Installing a package
            says nothing about review: every component has been audited against
            WCAG 2.2 AA by its own authors, in a static source pass and a
            rendered pass, and the findings were fixed. That is an author-run
            audit, not an independent review, and none of it has had a clinical
            review, so nothing here is for a production health surface until a
            clinician signs it.
          </p>
        </Panel>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Canonical locations
          </h2>
          <dl className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
            <Row
              term="Documentation"
              value={site.url}
              note="The only site this documentation is published from. Mirrors are not endorsed; a mirror that is not obviously a mirror is a supply-chain problem."
            />
            <Row
              term="Repository"
              value={site.github}
              note="Source, issues, releases and the public decision record. Every package is built from this repository."
            />
            <Row
              term="npm scope"
              value={site.npmScope}
              note="Every scoped opsinjs package is published under it, and nothing published under any other scope is ours."
            />
            {PACKAGES.map((pkg) => (
              <Row key={pkg.name} term="Package" value={pkg.name} note={pkg.note} />
            ))}
            <Row
              term="Agent index"
              value={absoluteUrl(agentRoutes.llms())}
              note="The curated machine-readable index. Assistants that read this get the real status of every component."
            />
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            Why a page like this exists at all
          </h2>
          <Prose className="mt-3">
            <p>
              A package name is a trust boundary. One mistyped letter in an
              install command can fetch code from somebody else, and that code
              runs in your build and ships to your users.
            </p>
            <p>
              The health context sharpens this. Code that renders
              somebody&rsquo;s blood pressure and decides what colour to make it
              is a bad place for an unreviewed third-party edit. That is not
              because it is likely, but because the failure is quiet and the
              consequence is somebody misreading their own result.
            </p>
          </Prose>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            How to check what you have
          </h2>
          <Prose className="mt-3">
            <p>
              <strong>Check the name before you install.</strong> It should be
              one of the four above, spelled exactly. A near miss, an extra
              word or a different scope is a reason to stop.
            </p>
            <p>
              <strong>Check the provenance.</strong> Run{" "}
              <Mono>npm audit signatures</Mono> in your project, or open the
              package on npmjs.com, where the provenance panel names this
              repository and the workflow run that published the version.
              Every version after 0.1.0 has one.
            </p>
            <p>
              <strong>Pin and read the changelog.</strong> Your lockfile records
              the exact version and its integrity hash. Upgrade on purpose, and
              read the changelog entry for the version you move to.
            </p>
            <p>
              <strong>Check the licence.</strong> The code is MIT and the
              guidance prose is CC BY 4.0. A copy that claims different terms is
              not this project, least of all one that claims the prose is
              unrestricted.
            </p>
            <p>
              <strong>Report anything that looks wrong.</strong> Impersonation
              of a health-adjacent project is worth reporting even when it looks
              harmless, because the audience for the impersonation is people
              building software that shows patients their own data.{" "}
              <Link href={routes.docs()}>
                How to report a security issue
              </Link>{" "}
              is in the Introduction.
            </p>
          </Prose>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            What opsinjs is not
          </h2>
          <Prose className="mt-3">
            <p>
              It is not affiliated with, endorsed by or derived from any
              national health service, clinical body or regulator. Where this
              documentation cites the NHS service manual, WCAG or a published
              study, it cites it: the text here is original, and the reference
              is a link rather than a copy.
            </p>
            <p>
              It is not a medical device, and it does not confer any regulatory
              status on software built with it.{" "}
              <Link href={routes.docs("health")}>
                Health
              </Link>{" "}
              states the boundary precisely, and{" "}
              <Link href={routes.docs("health", "safety-review")}>
                Safety review
              </Link>{" "}
              explains what the consuming product still owes its regulator.
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}

function Row({
  term,
  value,
  note,
}: {
  term: string
  value: string
  note: string
}) {
  return (
    <div className="grid gap-1 bg-card p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium">{term}</dt>
      <dd>
        <code className="font-mono text-sm break-all">{value}</code>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </dd>
    </div>
  )
}
