import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

import { site } from "@/lib/routes"

/**
 * THERE IS NO TOP NAVIGATION, AND THAT IS THE POINT.
 *
 * opsinjs is a documentation site and nothing else, so on a documentation page
 * the sidebar in components/docs/shell.tsx is the navigation: a wordmark, a
 * theme row, a search row and six sections. This file configures only the thin
 * bar fumadocs' `HomeLayout` draws over the tool pages: a wordmark and a search
 * toggle. The tools, the machine surfaces, GitHub and the theme switch are in
 * the footer those pages render.
 *
 * ROUTE REACHABILITY DID NOT MOVE WITH THEM. `assert-ia.mts` requires every
 * `page.tsx` to be linked from somewhere in the source. The footer links every
 * tool route, and `lib/routes.ts` names them all as literals, so IA003 is
 * satisfied by a real link rather than by an allowlist entry.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="size-4 rounded-[4px] bg-fd-primary"
          />
          {site.name}
        </span>
      ),
      url: "/",
      transparentMode: "none",
    },
    /**
     * No links, no GitHub icon, no theme switch in the chrome. Each of those
     * renders a row in the sidebar that is not a section, and the sidebar is
     * meant to hold sections. They are in the footer, on every page.
     */
    links: [],
    themeSwitch: { enabled: false },
    /**
     * Both triggers on. The small one is the icon in the header on narrow
     * screens; the full one is the ⌘K dialog. With the nav gone, search is the
     * only way to reach a page without opening the section it is in, so it is
     * load-bearing rather than convenient.
     */
    searchToggle: { enabled: true },
  }
}
