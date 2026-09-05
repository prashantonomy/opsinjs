import type { Metadata } from "next"
import Link from "next/link"

import { Container, Mono, PageHeader, Panel, Prose } from "@/app/_shared/ui"
import {
  absoluteUrl,
  agentRoutes,
  registryRoutes,
  routes,
  site,
} from "@/lib/routes"

export const metadata: Metadata = {
  title: "Official resources",
  description:
    "The canonical domain, npm scope, registry URL and repository for opsinjs — and the honest statement that no package has been published, so anything on npm claiming to be opsinjs today is not.",
}

/**
 * `/official` — the anti-impersonation page.
 *
 * Every design system eventually gets a typo-squatted npm package, a mirrored
 * documentation site with injected affiliate links, or a registry URL that
 * serves modified component source to anybody who runs the CLI against it. The
 * shadcn distribution model makes the last one materially worse than usual:
 * `npx shadcn add <url>` writes third-party code straight into a repository, and
 * the URL is the only thing standing between a developer and whatever that
 * server decides to return.
 *
 * The page is most valuable NOW, before anything is published, because right now
 * the honest statement is unusually strong: there are no packages, so every
 * package is fake. That strength is exactly why the sentence has to be kept
 * accurate as the system moves. Components are installable from this origin's
 * registry today, so a page still claiming no installable item exists would
 * tell a developer that the working @opsinjs items they just added came from an
 * impostor — the inverse of what this page is for.
 */
export default function OfficialPage() {
  const registryUrl = absoluteUrl(registryRoutes.catalog())

  return (
    <>
      <PageHeader
        eyebrow="Trust"
        title="Official resources"
        lead="Where opsinjs actually lives. If you found it somewhere else, it is not ours."
      />

      <Container className="py-10">
        <Panel className="border border-status-attention bg-status-attention-surface text-status-attention-ink">
          <h2 className="font-medium">
            Nothing has been published to npm, so every package is fake.
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            There is no <Mono>{site.npmScope}</Mono> package on npm. There is no
            released component, no CLI, and no installable registry item. If you
            find a package by this name today, whoever published it is not us —
            do not install it, and please report it. This paragraph will change
            the day something is genuinely released, and the release will be
            announced in the changelog with a version and a date.
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
              note="Source, issues and the public decision record. Everything on this site is generated from this repository."
            />
            <Row
              term="npm scope"
              value={site.npmScope}
              note="Reserved for the published packages. Nothing is published under it yet."
            />
            <Row
              term="Registry"
              value={registryUrl}
              note="The shadcn-specification registry the CLI and the MCP server read. Component source will be served from this origin and no other."
            />
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
              opsinjs is distributed the shadcn way: you run a command, and
              source code is written into your repository. That is a genuinely
              good distribution model — you own what you install, you can read
              it, and you can change it without fighting a package boundary —
              and it moves a trust decision to a place developers are not used
              to making one.
            </p>
            <p>
              When you run <Mono>npx shadcn add</Mono> against a registry URL,
              the server on the other end decides what source lands in your
              project. Nobody reviews that. There is no lockfile hash and no npm
              audit. The URL is the trust boundary, which is why the canonical
              one is published here, on the site, at a stable path, rather than
              only in a README that gets copied and edited.
            </p>
            <p>
              The health context sharpens this. Code that renders
              somebody&rsquo;s blood pressure and decides what colour to make it
              is a bad place for an unreviewed third-party edit — not because it
              is likely, but because the failure is quiet and the consequence is
              somebody misreading their own result.
            </p>
          </Prose>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            How to check what you have
          </h2>
          <Prose className="mt-3">
            <p>
              <strong>
                Check the registry URL before you run the command.
              </strong>{" "}
              It should be exactly <Mono>{registryUrl}</Mono>. A different host,
              an extra subdomain, a shortened link or an <Mono>http://</Mono>{" "}
              scheme are all reasons to stop.
            </p>
            <p>
              <strong>Check the version stamp in the file.</strong> Every
              emitted file will carry a comment naming the component and the
              version it came from, so a file in your repository can be traced
              back to a release rather than to “sometime last year”.
            </p>
            <p>
              <strong>Check the licence.</strong> The code is MIT and the
              guidance prose is CC BY 4.0. A copy that claims different terms —
              particularly one that claims the prose is unrestricted — is not
              this project.
            </p>
            <p>
              <strong>Report anything that looks wrong.</strong> Impersonation
              of a health-adjacent project is worth reporting even when it looks
              harmless, because the audience for the impersonation is people
              building software that shows patients their own data.{" "}
              <Link href={routes.docs("project", "security")}>
                How to report a security issue
              </Link>
              .
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
              <Link href={routes.docs("start", "safety-scope-and-limitations")}>
                Safety, scope and limitations
              </Link>{" "}
              states the boundary precisely, and{" "}
              <Link href={routes.docs("health", "regulatory-context")}>
                regulatory context
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
