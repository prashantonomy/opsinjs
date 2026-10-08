import type { ReactNode } from "react"
import type { Metadata } from "next"
import { HomeLayout } from "fumadocs-ui/layouts/home"

import { SiteFooter } from "@/components/site-footer"
import { baseOptions } from "@/lib/layout.shared"
import { site } from "@/lib/routes"

/**
 * THE TITLE TEMPLATE FOR THIS GROUP.
 *
 * `app/(chrome)/layout.tsx` deliberately exports no metadata: it is a root
 * layout and it is also the layout `app/(chrome)/not-found.tsx` renders inside,
 * and a `title.default` there would put a second <title> in the head of the 404
 * alongside the one that file hoists itself. So the template is declared on each
 * nested group instead, where every descendant is a real `page`.
 *
 * Pages below here set a bare noun such as "Tokens", "Icons" or "Official
 * resources". The template appends the system name, so a reader with a dozen
 * tabs open can tell ours apart.
 */
export const metadata: Metadata = {
  title: {
    template: `%s · ${site.name}`,
    default: `${site.name} · a design system for consumer health apps`,
  },
}

/**
 * Chrome for the five routes that are neither documentation nor the playground:
 * `/colors`, `/tokens`, `/icons`, `/showcase`, `/official`.
 *
 * THERE IS NO `/` HERE ANY MORE. The landing page was deleted and the
 * documentation took the root: `DOCS_BASE` in lib/routes.ts is empty, so the
 * introduction renders at `/` through `app/(chrome)/(docs)/[[...slug]]`. This
 * group is now only the tool pages, which is why it kept `HomeLayout` and the
 * documentation did not.
 *
 * This is a NESTED layout. The `<html>`/`<body>` pair, the theme provider and
 * the footer belong to `app/(chrome)/layout.tsx`. `HomeLayout` supplies the
 * wordmark and the search trigger from `lib/layout.shared.tsx`, which is all
 * the chrome left on the site above the content.
 *
 * The footer used to be declared here. It is global now, in the root layout,
 * because it is the only route to these five pages from anywhere else.
 */
export default function HomeGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      <SiteFooter />
    </>
  )
}
