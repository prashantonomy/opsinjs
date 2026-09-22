import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { RootProvider } from "fumadocs-ui/provider/next"

import "../globals.css"
import { SiteFooter } from "@/components/site-footer"
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
 * ../../AGENTS.md and /docs/theming/lyra-and-the-docs-chrome.
 *
 * `(home)`, `(docs)` and `(playground)` are nested groups UNDER this layout and
 * supply their own fumadocs chrome; they do not render <html>.
 *
 * THE FOOTER IS RENDERED HERE, once, for every route under this layout. It used
 * to live on the `(home)` group, which meant it appeared on the six tool pages
 * and on none of the four hundred documentation pages. Since the sidebar now
 * holds documentation sections and nothing else, the footer is the only route
 * to the tools, the machine surfaces and the theme switch, and a reader inside
 * the corpus is precisely the one who needs it. See components/site-footer.tsx.
 *
 * It is a SIBLING of `{children}`, not a child. Each nested group puts its
 * children inside a <main>, and a <footer> inside <main> does not expose the
 * contentinfo landmark: it degrades to a generic element and the site loses the
 * landmark screen-reader users navigate by. Rendering it here keeps the
 * landmark, and its `mt-auto` works because this <body> is a flex column.
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
          <SiteFooter />
        </RootProvider>
      </body>
    </html>
  )
}
