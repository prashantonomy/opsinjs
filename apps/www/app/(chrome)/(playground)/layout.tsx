import type { ReactNode } from "react"
import { HomeLayout } from "fumadocs-ui/layouts/home"

import { baseOptions } from "@/lib/layout.shared"
import { ToolNav } from "./tool-nav"

/**
 * Chrome for the three playground tools.
 *
 * A NESTED layout: `<html>`, `<body>` and the theme provider belong to
 * `app/(chrome)/layout.tsx`.
 *
 * It keeps the site's top navigation — a tool that strands you is a tool people
 * stop opening — and adds a second strip for moving between the three. Below
 * that it is full-bleed: no prose column, no sidebar, no table of contents.
 * These pages are instruments, and an instrument constrained to a 65-character
 * measure is an instrument you cannot see the readout of.
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
