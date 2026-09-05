"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { routes, SECTIONS_RAIL } from "@/lib/routes"
import { cn } from "@/lib/utils"

/* ==========================================================================
   sections-rail.tsx — <SectionsRail>, the persistent pillar jump rail rendered
   as the docs sidebar banner.

   WHY THIS EXISTS INSTEAD OF LAYOUT TABS.

   fumadocs offers tabs that swap the sidebar per section. They were rejected
   (decision 5) for a specific reason: a developer reading `Button` must be able
   to SEE that a Clinical safety pillar exists. Tabs hide exactly that. The
   whole argument of this design system is that a health component cannot be
   understood without the doctrine that governs it, and a navigation pattern
   that puts the doctrine behind a tab quietly contradicts it.

   So there is one persistent sidebar with sixteen groups, and this rail sits
   above it as a permanent map of the ten pillars. It is small, it is always
   there, and it is the answer to "what else is on this site" without a click.

   The rail duplicates the `---Sections---` Link entries in the root meta.json.
   That duplication is deliberate and is not a second source of truth: the
   meta.json entries are Link items, which create no pages and no tree nodes, so
   the one-URL-per-tree rule still holds. This component is the styled version
   that also knows which pillar you are in.
   ========================================================================== */

/**
 * One line per pillar, saying what is behind the link.
 *
 * The URLs themselves come from `SECTIONS_RAIL` in lib/routes.ts, which is also
 * what the root meta.json duplicates as Link entries — so the rail and the tree
 * can never point at different places. Only the hints live here, because they
 * are prose about navigation rather than route data.
 */
const HINTS: Record<string, string> = {
  Introduction: "What opsinjs is, who it is for, and what it refuses to do.",
  Components: "What is built, what is specified, and what was left off.",
  Health:
    "The doctrine layer: two colour axes, status semantics, alarm fatigue.",
  Foundations:
    "What a token means. Colour, material, motion, type, space, shape.",
  Accessibility: "What is guaranteed, what you own, and how to check.",
  Handbook: "How you change things: theming, tooling, contributing.",
  Agents: "How to point a model at this site and what it will find.",
  Reference: "The generated list of every token, prop, key and error code.",
  Roadmap: "What is being built, in what order, and what has been cut.",
  Changelog: "What changed, when, and whether it breaks you.",
}

export interface SectionsRailProps {
  className?: string
}

export function SectionsRail({ className }: SectionsRailProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Sections"
      data-opsinjs-chrome=""
      data-print="hide"
      className={cn("flex flex-col gap-2", className)}
    >
      <p className="m-0 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        Sections
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
        {SECTIONS_RAIL.map((pillar) => {
          // The docs index would otherwise match every path, so it is exact-only.
          const active =
            pillar.url === routes.docs()
              ? pathname === pillar.url
              : pathname === pillar.url || pathname.startsWith(`${pillar.url}/`)
          return (
            <li key={pillar.title} className="m-0">
              <Link
                href={pillar.url}
                title={HINTS[pillar.title]}
                aria-current={active ? "page" : undefined}
                /* `py-1.5` rather than `py-0.5`: at 320px the rail wraps to
                   four rows, and a 22.5px chip only cleared WCAG 2.2 SC 2.5.8
                   through the undersized-target spacing exception, with 26px
                   between row centres and 3.4px between neighbours. That is a
                   pass contingent on a line-height nobody is watching. This
                   clears 24px on the target itself. It does not reach the 44px
                   product floor and is not claimed to: the chrome is dense by
                   design, and the floor is a rule about product surfaces. */
                className={cn(
                  "block border border-border px-1.5 py-0.5 text-[0.6875rem] no-underline",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {pillar.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
