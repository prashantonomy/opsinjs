"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"

/**
 * The playground's own navigation strip.
 *
 * The site's top navigation is frozen in `lib/layout.shared.tsx` and has one
 * entry for the whole playground. Three tools behind one nav item need a second
 * level, and it belongs here rather than in the frozen nav: the tools are a set,
 * you move between them while working, and a reader who has just derived a ramp
 * should be one click from checking a pair of its values.
 */
const TOOLS = [
  { href: routes.playground(), label: "Overview", exact: true },
  { href: routes.playgroundTheme(), label: "Theme", exact: false },
  { href: routes.playgroundContrast(), label: "Contrast", exact: false },
  { href: routes.playgroundStatus(), label: "Two axes", exact: false },
]

export function ToolNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Playground tools"
      data-opsinjs-chrome
      className="border-b border-border bg-card/60"
    >
      <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-5 sm:px-8">
        {TOOLS.map((tool) => {
          const active = tool.exact
            ? pathname === tool.href
            : pathname.startsWith(tool.href)

          return (
            <Link
              key={tool.href}
              href={tool.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tool.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
