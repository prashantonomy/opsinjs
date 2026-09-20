import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

import { site } from "@/lib/routes"

/**
 * THERE IS NO TOP NAVIGATION, AND THAT IS THE POINT.
 *
 * This file used to declare six frozen nav items. They are gone, along with the
 * landing page they sat on. opsinjs is a documentation site and nothing else,
 * so the sidebar is the navigation: a wordmark, a search box, and ten sections
 * that open into their pages. A horizontal bar repeating four of those ten
 * above it was a second, worse copy of the same map.
 *
 * What the nav bar used to carry, and where it went:
 *
 *   - Docs, Components, Health, Foundations. The sidebar, which shows all ten
 *     sections rather than four, and shows you which one you are in.
 *   - Playground and Colors. The global footer, with the rest of the tools.
 *   - GitHub and the theme switch. The global footer.
 *
 * So `baseOptions()` now returns a wordmark and a search toggle. `HomeLayout`
 * renders them as a thin bar over the tool pages; `DocsLayout` renders them at
 * the top of the sidebar. Both get the same two things, which is why they still
 * share this function.
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
