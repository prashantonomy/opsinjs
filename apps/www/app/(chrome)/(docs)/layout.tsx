// SEO-CRITICAL: sets the browser-tab and search title of every page in this group. Read SEO.md
// and ~/pensievelabs/seo/MASTER.md before changing it, then run pnpm seo:check.
import type { ReactNode } from "react"
import type { Metadata } from "next"

import { DocsShell } from "@/components/docs/shell"
import { getDocsNav } from "@/lib/docs-nav"
import { site } from "@/lib/routes"

/**
 * The browser-tab title template for every documentation page. The page's
 * `generateMetadata` returns the bare frontmatter title and nothing is
 * appended to it. See the note on `app/(chrome)/(home)/layout.tsx`.
 */
export const metadata: Metadata = {
  title: {
    template: "%s",
    default: `${site.name} documentation`,
  },
}

/**
 * The documentation shell. This group owns `/docs`: the introduction renders
 * at `/docs` and Components at `/docs/components`. The landing page at `/`
 * belongs to `(landing)` and has no sidebar (ADR 0027).
 *
 * This is a nested layout and renders no `<html>` or `<body>`; those belong to
 * `app/(chrome)/layout.tsx`, which also mounts the one theme provider and the
 * search dialog the sidebar opens.
 */
export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return <DocsShell nav={getDocsNav()}>{children}</DocsShell>
}
