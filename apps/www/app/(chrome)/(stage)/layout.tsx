import type { ReactNode } from "react"
import type { Metadata } from "next"

import { site } from "@/lib/routes"

/**
 * The same title template the other groups carry, for the same reason: a
 * screen is titled "Results screen" or "Diabetes medicines app", neither of
 * which names the system on its own. See the note on
 * `app/(chrome)/(home)/layout.tsx` for why this is not on the root layout.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `Showcase · ${site.name}`,
  },
}

/**
 * Chrome for `/showcase/<slug>`, which is none.
 *
 * A NESTED layout: `<html>`, `<body>` and the theme provider belong to
 * `app/(chrome)/layout.tsx`. It adds no header, no footer and no search,
 * because a showcase screen is the screen and nothing else, the way the
 * clawscale showcase pages are the app and nothing else. The one control on
 * the page, the bar that switches the theme and the screen size, belongs to
 * the page itself. The index at `/showcase` stays in `(home)`, with the site
 * header and footer around it.
 */
export default function StageGroupLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
