import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { RootProvider } from "fumadocs-ui/provider/next"

import "../globals.css"
import { SITE_LANG, siteMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  graph,
  organizationLd,
  webSiteLd,
} from "@/app/_shared/structured-data"
import { cn } from "@/lib/utils"

/**
 * ROOT LAYOUT #1 of 2 is the documentation chrome.
 *
 * There is deliberately no `app/layout.tsx`. Next allows more than one root
 * layout only in its absence, and we need two: this one, which owns the docs
 * chrome, and `app/(view)/layout.tsx`, which owns a chrome-less <html> under
 * the opsinjs product theme so that previews render as the product rather than
 * as the documentation site. Reintroducing a top-level layout would silently
 * re-nest `(view)` inside globals.css and destroy that distinction. See
 * ../../AGENTS.md.
 *
 * `(home)`, `(docs)` and `(playground)` are nested groups UNDER this layout and
 * supply their own fumadocs chrome; they do not render <html>.
 *
 * THE FOOTER IS NOT HERE. The documentation pages have no footer, as on
 * blueprintjs.com: the sidebar holds the sections, the theme switch and search.
 * The tool pages under `(home)` and `(playground)` render <SiteFooter> from
 * their own layouts, as a sibling of the fumadocs <main> so it keeps the
 * contentinfo landmark.
 */

/**
 * THE SITE-WIDE METADATA, and the one thing it must not contain.
 *
 * `app/_shared/seo.ts` owns the object. It carries `metadataBase`, the robots
 * directives, the favicon-adjacent defaults and the Open Graph fallback, and it
 * carries NO `title`: this layout is also what `app/(chrome)/not-found.tsx`
 * renders inside, that file hoists its own `<title>` from the render tree
 * because a `not-found` is neither a layout nor a page, and a `title.default`
 * here would put a second one in its head. The three nested groups declare the
 * title template instead, where every descendant is a real page. See the note on
 * `app/(chrome)/(home)/layout.tsx`.
 *
 * This export used to be absent altogether, which meant no `metadataBase`, no
 * canonical policy and no `max-image-preview` on any of the four hundred pages
 * below it.
 */
export const metadata: Metadata = siteMetadata

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export default function ChromeRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang={SITE_LANG}
      suppressHydrationWarning
      className={cn(fontSans.variable)}
    >
      <body className="flex min-h-screen flex-col antialiased">
        {/*
          THE PUBLISHER AND THE SITE, DECLARED ONCE, ON EVERY ROUTE.

          Both are fragment-identified entities, so the per-page blocks below
          this layout refer to them by `@id` instead of restating them. A
          breadcrumb on a component page and the article block beside it then
          resolve to the same organisation as the front page, rather than
          describing a fourth one that happens to have the same name.

          It is in <body> rather than <head> on purpose: JSON-LD is valid in
          either, and React hoisting rules make an element rendered here a
          predictable part of the server-rendered HTML, which is the only part a
          crawler reads.
        */}
        <JsonLd data={graph([organizationLd(), webSiteLd()])} />
        {/*
          ONE theme provider for the whole site. fumadocs' RootProvider already
          mounts next-themes, which is why shadcn's components/theme-provider.tsx
          was deleted at scaffold time; two providers means two independent
          `class="dark"` writers racing each other on first paint.

          Light-first with system available but not default: this is a health
          reference site read in clinical settings and printed for review, and a
          reader who has not expressed a preference is better served by the
          theme the contrast floor was authored against.

          hotKey false: fumadocs binds `d` to toggle the theme. On a site whose
          pages are full of copyable clinical strings and whose search is used
          constantly, a bare single-letter global shortcut fires by accident.
        */}
        <RootProvider
          theme={{ defaultTheme: "light", enableSystem: true, hotKey: false }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
