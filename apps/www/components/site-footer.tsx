import type { ReactNode } from "react"
import Link from "next/link"
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch"

import { agentRoutes, registryRoutes, routes, site } from "@/lib/routes"

/* ==========================================================================
   site-footer.tsx defines <SiteFooter>, the footer of the tool pages.

   The documentation sidebar holds the six sections and nothing else, so the
   tool pages (`/colors`, `/tokens`, `/icons`, `/playground`, `/showcase`,
   `/official`), the machine surfaces and the licence are linked from here.

   It renders on the tool pages only, from the `(home)` and `(playground)`
   layouts. A documentation page has no footer, as on blueprintjs.com: its
   sidebar carries the theme switch and search, and the pages that matter link
   the tools where they are relevant.
   ========================================================================== */

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

export function SiteFooter() {
  return (
    <footer
      data-opsinjs-chrome
      data-print="hide"
      className="mt-auto border-t border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-medium">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.tagline}
            </p>
            <ThemeSwitch className="mt-5" mode="light-dark-system" />
          </div>

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
            <FooterLink href={routes.docs("agents")}>Agents and LLMs</FooterLink>
            <FooterLink href={routes.docs("registry")}>Registry</FooterLink>
          </FooterColumn>

          <FooterColumn title="Project">
            <FooterLink href={routes.docs()}>Introduction</FooterLink>
            <FooterLink href={routes.docs("changelog")}>Changelog</FooterLink>
            <FooterLink href={routes.official()}>Official resources</FooterLink>
            {site.sourcePublic ? (
              <FooterLink href={site.github} external>
                GitHub
              </FooterLink>
            ) : null}
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Code is MIT. The guidance prose for health, accessibility and
            content is CC BY 4.0, licensed separately so it can be quoted inside
            a clinical safety case with a clear attribution path.
          </p>
          <p>
            <Link
              className="transition-colors hover:text-foreground"
              href={routes.docs()}
            >
              Licence
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
