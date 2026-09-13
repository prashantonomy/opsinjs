import type { ReactNode } from "react"
import type { Metadata } from "next"
import { DocsLayout } from "fumadocs-ui/layouts/docs"

import { StatusLegend } from "@/components/docs/status"
import { SectionsRail } from "@/components/docs/sections-rail"
import { baseOptions } from "@/lib/layout.shared"
import { site } from "@/lib/routes"
import { source } from "@/lib/source"

/**
 * The title template for every documentation page.
 *
 * `generateMetadata` in `docs/[[...slug]]/page.tsx` returns the frontmatter
 * title unchanged. A title such as "Range bar" or "Colour roles" is right for
 * the OG card and wrong for a browser tab. This appends the system name once,
 * in one place, rather than in the four spots that page builds a title for. See
 * the note on `app/(chrome)/(home)/layout.tsx` for why it is not on the root
 * layout.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `Documentation · ${site.name}`,
  },
}

/**
 * The documentation shell.
 *
 * This is a NESTED layout. It must not render `<html>` or `<body>`. Those
 * belong to `app/(chrome)/layout.tsx`, which is one of the two root layouts and
 * also mounts the single theme provider.
 *
 * ONE SIDEBAR, NO TABS. `tabs={false}` is the whole navigation decision made
 * explicit. fumadocs' Layout Tabs would split the sixteen groups into top-level
 * sections and show one at a time, which reads well on a component library and
 * badly here: somebody reading `Button` needs to be able to see that a
 * *Clinical safety* section exists at all. Hiding the health doctrine behind a
 * tab is how a design system ends up with beautiful components and unread rules.
 * The trade is a long sidebar, which is why groups collapse and only three open
 * by default.
 *
 * The banner and footer slots carry the two things a reader needs constantly and
 * cannot get from the tree itself: the pillar jump rail, and the legend that
 * explains what `planned` and `considered` actually promise.
 *
 * `defaultOpenLevel: 1` opens first-level folders whose `meta.json` asks for it
 * and leaves the rest shut, so the sidebar opens at roughly one screen rather
 * than three.
 */
export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      tabs={false}
      sidebar={{
        banner: <SectionsRail />,
        footer: <StatusLegend />,
        collapsible: true,
        defaultOpenLevel: 1,
      }}
    >
      {children}
    </DocsLayout>
  )
}
