import type { ReactNode } from "react"
import type { Metadata } from "next"
import { DocsLayout } from "fumadocs-ui/layouts/docs"

import { baseOptions } from "@/lib/layout.shared"
import { site } from "@/lib/routes"
import { source } from "@/lib/source"

/**
 * The title template for the whole site.
 *
 * `generateMetadata` in `[[...slug]]/page.tsx` returns the frontmatter title
 * unchanged. A title such as "Range bar" or "Colour roles" is right for the OG
 * card and wrong for a browser tab. This appends the system name once, in one
 * place, rather than in the four spots that page builds a title for. See the
 * note on `app/(chrome)/(home)/layout.tsx` for why it is not on the root layout.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `${site.name} · a design system for consumer health apps`,
  },
}

/**
 * The documentation shell, which is now the shell for the site.
 *
 * This group owns `/`. There is no landing page in front of it: `DOCS_BASE` in
 * lib/routes.ts is empty, so the corpus index renders at `/` and Components at
 * `/components`. A reader arrives inside the documentation, which is the only
 * thing opsinjs is.
 *
 * This is a NESTED layout. It must not render `<html>` or `<body>`. Those
 * belong to `app/(chrome)/layout.tsx`, which is one of the two root layouts and
 * also mounts the single theme provider and the global footer.
 *
 * THE SIDEBAR HOLDS THREE THINGS: the wordmark, the search box and the tree.
 * Everything else that used to be in it has gone somewhere it works better.
 * The pillar chip rail was a second copy of the tree's own top level, made
 * redundant the moment the tree stopped opening to four hundred rows. The six
 * nav links and the theme switch are in the global footer. The status legend
 * moved to `/start/reading-these-docs`, which is the page that explains what
 * the six statuses mean rather than a strip of chips with no room to say it.
 *
 * `tabs={false}` keeps that promise structural. fumadocs' Layout Tabs would
 * split the ten sections into top-level tabs and show one at a time, so
 * somebody reading `Button` could not see that a Health section exists. Hiding
 * the health doctrine behind a tab is how a design system ends up with
 * beautiful components and unread rules. Ten section names, always on screen,
 * is the alternative.
 *
 * `defaultOpenLevel: 0` is the other half of it, and it is the only setting
 * that makes a 404-page corpus navigable in one column: nothing is open except
 * the folders on the path to the page you are on. Arrive at `Button` and
 * Components is open at *Actions and forms*, with the other nine sections one
 * line each above and below. That works because `lib/sidebar-tree.ts` has
 * already reshaped the tree into ten sections with collapsible subsections
 * inside them, so there is somewhere to stop between a section and a page.
 */
export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      tabs={false}
      sidebar={{
        collapsible: true,
        defaultOpenLevel: 0,
      }}
    >
      {children}
    </DocsLayout>
  )
}
