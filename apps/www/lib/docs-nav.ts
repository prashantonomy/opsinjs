import type { ReactNode } from "react"
import { isValidElement } from "react"
import type { Folder, Node } from "fumadocs-core/page-tree"

import { DOCS_BASE, joinPath, site } from "./routes.ts"
import { source } from "./source.ts"

/**
 * The sidebar's data: six sections, each a list of groups, each a list of
 * links, plus the H2 and H3 headings of every page so the page you are on can
 * list its own headings under its row.
 *
 * The shape is read from the page tree, so the meta.json files stay the one
 * place that orders the corpus. A top-level page belongs to the first section,
 * which is named after the site; a top-level folder is a section of its own,
 * and a `---Label---` separator inside it starts a labelled group.
 */

export interface NavLink {
  title: string
  url: string
}

export interface NavGroup {
  title?: string
  links: NavLink[]
}

export interface NavSection {
  /** The first URL segment of the section, or `home` for the top-level pages. */
  id: string
  title: string
  url: string
  /** Short text on the right of the section row. */
  meta?: string
  groups: NavGroup[]
}

export interface NavHeading {
  depth: 2 | 3
  id: string
  text: string
}

export interface DocsNav {
  sections: NavSection[]
  headings: Record<string, NavHeading[]>
}

const SECTION_META: Record<string, string> = {
  components: site.registryNamespace,
}

/** Plain text of a page-tree name or a heading title, which may be markup. */
export function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ""
}

function linkOf(node: Node): NavLink | undefined {
  if (node.type !== "page" || node.external) return undefined
  return { title: textOf(node.name), url: node.url }
}

function firstSegment(url: string): string {
  return url.slice(joinPath(DOCS_BASE).length).split("/").filter(Boolean)[0] ?? ""
}

/** The URL of the first page anywhere under a node. */
function firstUrl(node: Node): string | undefined {
  if (node.type === "page") return node.url
  if (node.type !== "folder") return undefined
  if (node.index) return node.index.url
  for (const child of node.children) {
    const url = firstUrl(child)
    if (url) return url
  }
  return undefined
}

function folderSection(folder: Folder): NavSection | undefined {
  const anyUrl = firstUrl(folder)
  if (!anyUrl) return undefined
  const id = firstSegment(anyUrl)
  const url = joinPath(DOCS_BASE, id)

  const groups: NavGroup[] = [{ links: [] }]
  const current = () => groups[groups.length - 1] as NavGroup
  const push = (link: NavLink | undefined) => {
    if (link && link.url !== url) current().links.push(link)
  }

  for (const child of folder.children) {
    if (child.type === "separator") {
      groups.push({ title: textOf(child.name) || undefined, links: [] })
    } else if (child.type === "page") {
      push(linkOf(child))
    } else {
      /* The corpus has no nested folders, and the sidebar has two levels. A
         nested folder is flattened rather than dropped, so a page is never
         unreachable. */
      if (child.index) push(linkOf(child.index))
      for (const grandchild of child.children) push(linkOf(grandchild))
    }
  }

  return {
    id,
    title: textOf(folder.name),
    url,
    meta: SECTION_META[id],
    groups: groups.filter((group) => group.links.length > 0),
  }
}

export function getDocsNav(): DocsNav {
  const tree = source.getPageTree()
  const homeUrl = joinPath(DOCS_BASE)
  const home: NavSection = {
    id: "home",
    title: site.name,
    url: homeUrl,
    groups: [{ links: [] }],
  }

  const sections: NavSection[] = [home]
  for (const child of tree.children) {
    if (child.type === "page") {
      const link = linkOf(child)
      if (link && link.url !== homeUrl) home.groups[0]?.links.push(link)
    } else if (child.type === "folder") {
      const section = folderSection(child)
      if (section) sections.push(section)
    }
  }

  const headings: Record<string, NavHeading[]> = {}
  for (const page of source.getPages()) {
    headings[page.url] = page.data.toc
      .filter((item) => item.depth === 2 || item.depth === 3)
      .map((item) => ({
        depth: item.depth as 2 | 3,
        id: item.url.replace(/^#/, ""),
        text: textOf(item.title),
      }))
      .filter((item) => item.text.length > 0)
  }

  return { sections, headings }
}
