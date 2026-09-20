import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import { RootProvider } from "fumadocs-ui/provider/next"

import "../globals.css"
import { SiteFooter } from "@/components/site-footer"
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

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export default function ChromeRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fontSans.variable)}>
      <body className="flex min-h-screen flex-col antialiased">
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
