import type { ReactNode } from "react"

import "../product.css"

/**
 * ROOT LAYOUT #2 of 2 is the chrome-less preview surface.
 *
 * This layout owns its own <html> and <body> and imports ONLY product.css. No
 * fumadocs RootProvider, no docs stylesheet, no navigation. Everything rendered
 * beneath `/view/...` is the opsinjs PRODUCT theme: squircle corners, the
 * platform UI font, generous spacing, large touch targets. The product theme is
 * deliberately the opposite of the lyra docs chrome.
 *
 * <ComponentPreview> and <IframePreview> embed these routes in an iframe, which
 * is what makes a preview on a documentation page look like the product instead
 * of like the documentation. It is also the Playwright target for the nightly
 * screenshot job.
 *
 * Because this is a SIBLING root layout, navigating between `(chrome)` and
 * `(view)` forces a full page load. That is acceptable: `(view)` is only ever
 * entered by iframe or by direct URL, never by in-app navigation. `app/robots.ts`
 * disallows `/view` so the chrome-less duplicates never reach an index.
 */

/**
 * Theme, colour mode, density and text size arrive as query parameters. A
 * layout cannot read searchParams, and doing this in a client component would
 * mean a flash of the wrong theme inside a small iframe, which is exactly where
 * it is most visible. So it is applied before first paint by a blocking inline
 * script, and <html> carries suppressHydrationWarning for the attributes it
 * writes. The parameter names are the contract the preview toolbar generates.
 */
const applyViewPreferences = `
(function () {
  try {
    var q = new URLSearchParams(window.location.search);
    var el = document.documentElement;
    if (q.get("mode") === "dark") el.classList.add("dark");
    var density = q.get("density");
    if (density === "compact" || density === "comfortable") {
      el.dataset.density = density;
    }
    var text = q.get("text");
    if (text === "125" || text === "150" || text === "200") {
      el.dataset.textSize = text;
    }
    var theme = q.get("theme");
    if (theme) el.dataset.theme = theme;
  } catch (e) {
    /* A preview that cannot read its query string still renders the default
       theme. Never let the shell fail because a parameter was malformed. */
  }
})();
`

export default function ViewRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="opsin-product">
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyViewPreferences }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
