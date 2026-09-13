import { createElement } from "react"
import { loader } from "fumadocs-core/source"
import { icons } from "lucide-react"

import { docs } from "@/.source/server"

/**
 * The fumadocs content loader: the docs corpus as a page tree, a slug map and a
 * search index.
 *
 * THE ICON HANDLER IS NOT OPTIONAL. Without it, a page or a meta.json with an
 * `icon` in its frontmatter renders the literal string "Sparkles" in the
 * sidebar instead of an icon. Fumadocs passes the frontmatter value through
 * untouched unless a handler turns it into a node. It fails silently and it
 * fails everywhere at once.
 *
 * `baseUrl` is the one place other than `lib/routes.ts` where the docs base
 * appears, and it is allowlisted in `assert-ia.mts` for exactly that reason: the
 * loader needs the literal, and importing it from `routes.ts` here would make
 * the two definitions look independent when they are not. They must agree, so
 * this file imports DOCS_BASE rather than repeating it.
 *
 * NO i18n. `loader()` accepts an `i18n` config and opsinjs deliberately does
 * not pass one. See /docs/project/decisions/0005-no-lang-segment-yet. The
 * retrofit is a config object here plus a locale segment in `docsPath()`, and
 * nothing else, which is the whole reason path construction is centralised.
 */

import { DOCS_BASE } from "./routes.ts"

export const source = loader({
  baseUrl: DOCS_BASE,
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return
    if (icon in icons) return createElement(icons[icon as keyof typeof icons])
    // An unknown icon name is a typo, and a typo should not render as prose in
    // the sidebar. Returning undefined drops it; assert-ia.mts reports it.
    return
  },
})

/** Every page in the corpus. The input to the sitemap, llms.txt and the shards. */
export function getAllPages() {
  return source.getPages()
}

/**
 * One page by its slug segments, or undefined.
 *
 * Thin on purpose: this is the seam where a locale argument would be threaded
 * through if opsinjs ever grows one, and every caller already goes through it.
 */
export function getPage(slugs: string[] | undefined) {
  return source.getPage(slugs)
}

/** The page tree the docs layout renders. */
export function getPageTree() {
  return source.getPageTree()
}

/**
 * Pages under one top-level section, in tree order.
 *
 * Used by the llms shards (`llms-components.txt`, `llms-health.txt`,
 * `llms-foundations.txt`) and by `<SectionProgress>`, both of which need "every
 * page in Health" without knowing how Health is nested.
 */
export function getPagesInSection(section: string) {
  return source.getPages().filter((page) => page.slugs[0] === section)
}
