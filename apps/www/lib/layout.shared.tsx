import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

import { site } from "@/lib/routes"

/**
 * THE FROZEN TOP NAV. Nothing else in the application may define one.
 *
 * Six destinations and a right-hand cluster of search, GitHub and the theme
 * switch. The set is frozen because it is a contract between two workers who
 * cannot see each other's files: whoever builds `/colors` and `/playground`
 * needs to know they will be reachable, and `assert-ia.mts` enforces the other
 * direction by requiring every `page.tsx` under `app/` to be reachable from
 * this nav, from the docs sidebar, or from the named allowlist in
 * `lib/routes.ts`. A live page nobody links to is the defect this site
 * criticises other documentation for having.
 *
 * WHY THESE SIX. Docs and Components are where a developer arrives. Health is
 * the reason this system exists rather than another button library, and burying
 * it inside Docs would say the opposite. Foundations is the second-largest
 * pillar and the one people arrive at from search. Playground and Colors are
 * TOOLS rather than reading, and a tool that lives three levels inside a
 * documentation tree does not get used.
 *
 * WHY THE PATHS ARE LITERAL HERE. `lib/routes.ts` owns path construction and
 * this file is one of four allowlisted exceptions — `baseOptions()` is called
 * inside the layout of every route group, including the ones that render before
 * the docs source is loaded, and the link set has to be readable as a list. The
 * literals are checked against `routes.ts` by `assert-ia.mts` so the exception
 * cannot rot.
 *
 * THE SIX DO NOT FIT AT 640px, AND THIS FILE CANNOT FIX IT. fumadocs shows the
 * `type: "main"` row from its own `sm` breakpoint (`max-sm:hidden` on the `<ul>`
 * in `fumadocs-ui/layouts/home/slots/header`) and only collapses it again at
 * `lg`. Measured on the home page: at a 640px viewport — a 1280px window at the
 * 200% zoom a low-vision reader typically sets — the wordmark, the six labels
 * and the trailing search-and-menu cluster come to 703px, so the page scrolls
 * sideways and the search button sits off-screen. 600px and 768px are both
 * clean. Do not fix it by dropping a link: `TOP_NAV` in `assert-ia.mts` names
 * all six and IA006 warns for any this file stops declaring, and the set is the
 * cross-worker contract above. The repair lives in `app/globals.css`, in the
 * section headed "The 640-767px navigation reflow": it hides the bar row below
 * `md` AND un-hides the same items inside the collapsed menu, which fumadocs
 * marks `sm:hidden`. Both halves are load-bearing — hiding only the first makes
 * the six unreachable between 640px and 767px — so if you change the link set
 * here, re-measure `documentElement.scrollWidth` at 640, 672, 700 and 767.
 * Adding a seventh link makes this worse at every width.
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
    githubUrl: site.github,
    links: [
      {
        type: "main",
        text: "Docs",
        url: "/docs",
        active: "nested-url",
        description: "Everything, from installation to the clinical doctrine.",
      },
      {
        type: "main",
        text: "Components",
        url: "/docs/components",
        active: "nested-url",
        description:
          "The catalogue, its status, and the specification for each entry.",
      },
      {
        type: "main",
        text: "Health",
        url: "/docs/health",
        active: "nested-url",
        description:
          "What this system decides for you about showing someone their own health data.",
      },
      {
        type: "main",
        text: "Foundations",
        url: "/docs/foundations",
        active: "nested-url",
        description:
          "Colour, materials, motion, type, shape and space — what each token means.",
      },
      {
        type: "main",
        text: "Playground",
        url: "/playground",
        active: "nested-url",
        description:
          "Three tools: derive a theme, check a contrast pair, exercise the two colour axes.",
      },
      {
        type: "main",
        text: "Colors",
        url: "/colors",
        active: "nested-url",
        description: "Browse both colour axes, switch format, copy a value.",
      },
    ],
    /**
     * Both triggers on. The small one is the icon in the header on narrow
     * screens; the full one is the ⌘K dialog. Search is the primary navigation
     * on a site this size and hiding it behind a keyboard shortcut assumes a
     * keyboard.
     */
    searchToggle: { enabled: true },
    themeSwitch: { enabled: true },
  }
}
