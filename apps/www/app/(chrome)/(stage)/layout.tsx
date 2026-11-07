// SEO-CRITICAL: sets the browser-tab and search title of every page in this group. Read SEO.md
// and ~/pensievelabs/seo/MASTER.md before changing it, then run pnpm seo:check.
import type { ReactNode } from "react"
import type { Metadata } from "next"

/**
 * The same title template the other groups carry: a screen is titled
 * "Results screen" or "Diabetes medicines app", with no suffix. See the note
 * on `app/(chrome)/(home)/layout.tsx` for why, and for why this is not on the
 * root layout.
 */
export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Showcase",
  },
}

/**
 * Chrome for `/showcase/<slug>`, which is none.
 *
 * A NESTED layout: `<html>`, `<body>` and the theme provider belong to
 * `app/(chrome)/layout.tsx`. It adds no header, no footer and no search,
 * because a showcase screen is the screen and nothing else, the way the
 * clawscale showcase pages are the app and nothing else. The one control on
 * the page, the bar that leads back to `/showcase` and switches the theme and
 * the screen size, belongs to the page itself. The index at `/showcase` stays in `(home)`, with the site
 * header and footer around it.
 */
export default function StageGroupLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
