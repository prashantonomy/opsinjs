import type { ReactNode } from "react"
import Link from "next/link"
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch"

import { agentRoutes, registryRoutes, routes, site } from "@/lib/routes"

/* ==========================================================================
   site-footer.tsx defines <SiteFooter>, the one footer, on every route.

   IT IS THE WHOLE SECONDARY NAVIGATION. With the landing page deleted and the
   top nav gone, the sidebar holds the ten documentation sections and nothing
   else, by design. That leaves a real set of pages with nowhere to live:
   `/colors`, `/tokens`, `/icons`, `/playground`, `/showcase`, `/official`, the
   machine surfaces, the licence. They are not documentation sections and
   putting them in the tree would undo the point of the tree. So they are here,
   in the one place that renders under every page on the site.

   That is also why this moved out of `app/(chrome)/(home)/layout.tsx`. There it
   rendered on six routes and was absent from the four hundred documentation
   pages, which is exactly backwards: a reader deep in the corpus is the one who
   cannot otherwise find the theme switch or the playground.

   THE THEME SWITCH IS HERE AND NOWHERE ELSE, for the same reason. `baseOptions`
   turns off fumadocs' own, because it renders as a row inside the sidebar and
   the sidebar is sections only.
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
            <FooterLink href={routes.docs("agents")}>
              Agents &amp; automation
            </FooterLink>
            <FooterLink href={routes.docs("registry")}>
              Registry &amp; distribution
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Project">
            <FooterLink href={routes.docs("project", "state-of-the-system")}>
              State of the system
            </FooterLink>
            <FooterLink href={routes.docs("project", "roadmap")}>
              Roadmap
            </FooterLink>
            <FooterLink href={routes.docs("project", "changelog")}>
              Changelog
            </FooterLink>
            <FooterLink href={routes.official()}>Official resources</FooterLink>
            <FooterLink href={site.github} external>
              GitHub
            </FooterLink>
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
              href={routes.docs("project", "licence-and-attribution")}
            >
              Licence and attribution
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
