import type { ReactNode } from "react"
import type { Metadata } from "next"
import { HomeLayout } from "fumadocs-ui/layouts/home"

import { baseOptions } from "@/lib/layout.shared"
import { site } from "@/lib/routes"
import { ToolNav } from "./tool-nav"

/**
 * The same title template the other two groups carry, for the same reason: the
 * three tools are titled "Playground", "Theme generator", "Contrast oracle" and
 * "Two-axis lab", none of which names the system on its own. See the note on
 * `app/(chrome)/(home)/layout.tsx` for why this is not on the root layout.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `Playground · ${site.name}`,
  },
}

/**
 * Chrome for the three playground tools.
 *
 * A NESTED layout: `<html>`, `<body>` and the theme provider belong to
 * `app/(chrome)/layout.tsx`.
 *
 * A tool that strands you is a tool people stop opening, which is why this
 * layout keeps the site's top navigation and adds a second strip for moving
 * between the three. Below that it is full-bleed: no prose column, no
 * sidebar, no table of contents. These pages are instruments, and an
 * instrument constrained to a 65-character measure is an instrument you
 * cannot see the readout of.
 *
 * WHY THREE TOOLS AND NOT SIX. The original plan had six. Three shipped, because
 * a navigation item pointing at a half-finished tool costs more credibility than
 * a missing tool does. The cut is recorded in the decision log rather than left
 * as an absence somebody has to notice.
 */
export default function PlaygroundGroupLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <HomeLayout {...baseOptions()}>
      <ToolNav />
      {children}
    </HomeLayout>
  )
}
