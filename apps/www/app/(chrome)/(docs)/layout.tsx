import type { ReactNode } from "react"
import type { Metadata } from "next"

import { DocsShell } from "@/components/docs/shell"
import { getDocsNav } from "@/lib/docs-nav"
import { site } from "@/lib/routes"

/**
 * The browser-tab title template for every documentation page. The page's
 * `generateMetadata` returns the bare frontmatter title, which is right for
 * the social card, and the system name is appended here once.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `${site.name} · a design system for consumer health apps`,
  },
}

/**
 * The documentation shell. This group owns `/`: `DOCS_BASE` is empty, so the
 * introduction renders at the root and Components at `/components`.
 *
 * This is a nested layout and renders no `<html>` or `<body>`; those belong to
 * `app/(chrome)/layout.tsx`, which also mounts the one theme provider and the
 * search dialog the sidebar opens.
 */
export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return <DocsShell nav={getDocsNav()}>{children}</DocsShell>
}
