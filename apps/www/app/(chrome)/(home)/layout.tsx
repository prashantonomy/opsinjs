import type { ReactNode } from "react"
import Link from "next/link"
import { HomeLayout } from "fumadocs-ui/layouts/home"

import { baseOptions } from "@/lib/layout.shared"
import { agentRoutes, registryRoutes, routes, site } from "@/lib/routes"

/**
 * Chrome for the six routes that are not documentation and not tools:
 * `/`, `/colors`, `/tokens`, `/icons`, `/showcase`, `/official`.
 *
 * A NESTED layout — the `<html>`/`<body>` pair and the theme provider belong to
 * `app/(chrome)/layout.tsx`. `HomeLayout` supplies the same top navigation as
 * the documentation shell, minus the sidebar, so the frozen nav from
 * `lib/layout.shared.tsx` is identical on every page of the site.
 *
 * The footer is here rather than in the root layout on purpose. It is a
 * DISCOVERY surface: `/tokens`, `/icons`, `/showcase` and `/official` are real
 * pages that the six-item top navigation has no room for, and without a footer
 * they would be reachable only from the landing page — which is precisely the
 * orphaned-live-page failure this site criticises other design systems for. The
 * documentation shell has the sidebar for the same job and does not need it.
 */
export default function HomeGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      {/*
        A SIBLING of HomeLayout, not a child. HomeLayout puts its children inside
        <main>, and a <footer> nested inside <main> does not expose the
        contentinfo landmark — it degrades to a generic element, and the site
        loses the landmark screen-reader users navigate by. Rendering it here
        keeps the landmark, and `mt-auto` still works because the root layout's
        <body> is a flex column.
      */}
      <SiteFooter />
    </>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-foreground uppercase">
        {title}
      </h2>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  const className =
    "text-muted-foreground hover:text-foreground focus-visible:outline-ring rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"

  return (
    <li>
      {external ? (
        <a
          className={className}
          href={href}
          rel="noreferrer noopener"
          target="_blank"
        >
          {children}
        </a>
      ) : (
        <Link className={className} href={href}>
          {children}
        </Link>
      )}
    </li>
  )
}

function SiteFooter() {
  return (
    <footer
      data-opsinjs-chrome
      className="mt-auto border-t border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-medium">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.tagline}
            </p>
          </div>

          <FooterColumn title="Documentation">
            <FooterLink href={routes.docs("start")}>Start here</FooterLink>
            <FooterLink href={routes.docs("components")}>Components</FooterLink>
            <FooterLink href={routes.docs("health")}>Health</FooterLink>
            <FooterLink href={routes.docs("foundations")}>
              Foundations
            </FooterLink>
            <FooterLink href={routes.docs("accessibility")}>
              Accessibility
            </FooterLink>
            <FooterLink href={routes.docs("content")}>
              Content &amp; language
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Tools">
            <FooterLink href={routes.colors()}>Colours</FooterLink>
            <FooterLink href={routes.tokens()}>Tokens</FooterLink>
            <FooterLink href={routes.icons()}>Icons</FooterLink>
            <FooterLink href={routes.playground()}>Playground</FooterLink>
            <FooterLink href={routes.showcase()}>Showcase</FooterLink>
          </FooterColumn>

          <FooterColumn title="For machines">
            <FooterLink href={agentRoutes.llms()}>llms.txt</FooterLink>
            <FooterLink href={registryRoutes.catalog()}>
              registry.json
            </FooterLink>
            <FooterLink href={routes.docs("agents")}>
              Agents &amp; automation
            </FooterLink>
            <FooterLink href={routes.docs("registry")}>
              Registry &amp; distribution
            </FooterLink>
            <FooterLink href={site.github} external>
              GitHub
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Code is MIT. The guidance prose — health, accessibility and content
            — is CC BY 4.0, licensed separately so it can be quoted inside a
            clinical safety case with a clear attribution path.
          </p>
          <p className="flex gap-4">
            <Link
              className="transition-colors hover:text-foreground"
              href={routes.docs("project", "licence-and-attribution")}
            >
              Licence
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href={routes.official()}
            >
              Official resources
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href={routes.docs("project", "state-of-the-system")}
            >
              State of the system
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
