import type { Folder, Item, Node, Root, Separator } from "fumadocs-core/page-tree"

/**
 * sidebar-tree.ts is the shape of the navigation, and it is the only thing that
 * decides it.
 *
 * THE SIDEBAR IS THE SITE. There is no landing page, no top navigation and no
 * jump rail. A reader arrives at `/`, and the one column on the left is the
 * whole map: a wordmark, a search box, and ten sections that open into their
 * pages. Everything this module does serves that.
 *
 * It applies two transforms to the tree fumadocs builds from the meta.json
 * files, in this order:
 *
 *   1. `groupChildren` promotes every `---Separator---` run of two or more
 *      pages into a collapsible folder, so a section opens to its subsections
 *      rather than to every page it holds. Components opens to eleven category
 *      names, not to sixty-two component names.
 *
 *   2. `pillars` rebuilds the top level. The corpus is authored as sixteen
 *      folders because sixteen is the right number of directories to write
 *      four hundred pages into. Sixteen is the wrong number of things to ask a
 *      reader to choose between, so the sidebar shows ten, and the other six
 *      are nested inside the one they belong to. Screens and Patterns sit under
 *      Components because they are what you build out of components. Theming
 *      sits under Foundations because a theme is a set of token values. Content,
 *      Registry and Packages sit under Handbook because all three are mechanics
 *      rather than meaning.
 *
 * NEITHER TRANSFORM MOVES A FILE OR CHANGES A URL. `/patterns/daily-logging`
 * is still `/patterns/daily-logging` when it renders under Components. The
 * meta.json files remain the authority that `assert-ia.mts` reads, authors keep
 * writing separators, and this is the one file to edit when the shape of the
 * navigation is wrong.
 */

/* ------------------------------------------------------------------ *
 * 1. Separator runs become collapsible subsections                    *
 * ------------------------------------------------------------------ */

/**
 * A separator whose `name` is a plain string, which is the only form that can
 * become a folder title.
 *
 * `name` is a `ReactNode`, so in principle a separator can carry an element.
 * None in this corpus does, and a node that is not a string has no title to
 * give a folder, so those are left as separators rather than guessed at.
 */
function namedSeparator(node: Node): (Separator & { name: string }) | undefined {
  if (node.type !== "separator") return undefined
  if (typeof node.name !== "string") return undefined
  return node as Separator & { name: string }
}

/**
 * The `$id` for a generated node.
 *
 * fumadocs wants node ids unique across every tree. A parent id is already
 * unique and a title is unique within its own parent, so the pair is enough.
 * The `#` is there so a generated id can never collide with a path-derived one.
 */
function generatedId(parentId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${parentId}#${slug}`
}

/**
 * Whether a run of exactly one node already says what its separator says.
 *
 * `patterns/meta.json` lists `---Form design---` above the `forms` folder,
 * whose title is "Form design". Keeping both gives the reader the same three
 * words twice in a row, once as a heading and once as a link. In that case the
 * separator is dropped and the folder stands on its own, because the folder is
 * already the group.
 */
function isSelfTitled(run: Node[], title: string): boolean {
  const only = run[0]
  return (
    run.length === 1 &&
    only !== undefined &&
    only.type === "folder" &&
    only.name === title
  )
}

/**
 * Regroup one folder's children so every separator run becomes a folder.
 *
 * Children before the first separator are left where they are. In this corpus
 * those are the section's own overview page and the handful of pages that
 * belong to no category, and both read correctly as the first thing inside an
 * open section.
 */
function groupChildren(node: Folder): Node[] {
  const parentId = node.$id ?? "folder"
  const regrouped: Node[] = []
  let open: { title: string; separator: Separator; run: Node[] } | undefined

  const flush = () => {
    if (!open) return
    const { title, separator, run } = open
    open = undefined

    // A separator with nothing under it is a heading for an empty list.
    if (run.length === 0) return
    if (isSelfTitled(run, title)) {
      regrouped.push(...run)
      return
    }

    /* A run of one stays a separator. A disclosure triangle that hides a single
       link costs a click and saves a line, which is a bad trade, and the two
       runs this applies to are both a heading doing real work over one page:
       `---Moving in---` over "Migrating from shadcn/ui", and `---Measuring---`
       over "Reading level". */
    if (run.length === 1) {
      regrouped.push(separator, ...run)
      return
    }

    regrouped.push({
      type: "folder",
      $id: generatedId(parentId, title),
      name: title,
      icon: separator.icon,
      collapsible: true,
      children: run,
    })
  }

  for (const child of node.children) {
    const separator = namedSeparator(child)
    if (separator) {
      flush()
      open = { title: separator.name, separator, run: [] }
      continue
    }
    if (open) open.run.push(child)
    else regrouped.push(child)
  }
  flush()

  return regrouped
}

/* ------------------------------------------------------------------ *
 * 2. The top level is ten pillars                                     *
 * ------------------------------------------------------------------ */

/**
 * One entry per section in the sidebar, in the order they appear.
 *
 * `primary` is the authored folder the pillar is built from: the pillar takes
 * its landing page, its icon and its children. `adopt` names other top-level
 * folders that become extra children of it, appended in the order listed.
 *
 * Introduction has no `primary` because its landing page is the corpus index at
 * `/`, which is a page rather than a folder. Roadmap and Changelog have none
 * because both are carved out of `project`, which is one directory holding two
 * different jobs: the governance of the system, and the record of what changed.
 */
interface Pillar {
  title: string
  primary?: string
  adopt?: string[]
}

const PILLARS: Pillar[] = [
  { title: "Introduction", adopt: ["start", "recipes"] },
  { title: "Foundations", primary: "foundations", adopt: ["theming"] },
  { title: "Components", primary: "components", adopt: ["screens", "patterns"] },
  { title: "Accessibility", primary: "accessibility" },
  { title: "Health", primary: "health" },
  {
    title: "Handbook",
    primary: "handbook",
    adopt: ["content", "registry", "packages"],
  },
  { title: "Agents", primary: "agents" },
  { title: "Reference", primary: "reference" },
  { title: "Roadmap" },
  { title: "Changelog" },
]

/**
 * The URL segments of the first page found under a node.
 *
 * THIS IS NOT `node.index`, AND IT CANNOT BE. Every meta.json in this corpus
 * lists `"index"` explicitly in its `pages` array, which is how the author
 * controls where the overview sits in the order. fumadocs reads that as "this
 * page is a child" and deletes the folder's own `index` field, so a folder here
 * carries a name and children but no URL of its own. Reading `index.url` to
 * identify a folder returns undefined for all sixteen of them, which is a silent
 * empty sidebar rather than an error.
 *
 * Every page beneath `content/docs/components/` has a URL starting `/components`,
 * so the first descendant is enough to say where a folder lives, and it uses only
 * the public shape of the tree rather than the internal `$ref`.
 */
function segmentsOf(node: Node): string[] | undefined {
  if (node.type === "page") {
    return node.url.split("/").filter(Boolean)
  }
  if (node.type === "folder") {
    for (const child of node.children) {
      const found = segmentsOf(child)
      if (found) return found
    }
  }
  return undefined
}

/** The top-level section a node belongs to. Everything under Components is `components`. */
function sectionOf(node: Node): string | undefined {
  return segmentsOf(node)?.[0]
}

/**
 * Pull a section's own overview page out of its children, to be the folder's
 * landing page instead.
 *
 * A pillar that is only a disclosure triangle has no URL, so Components would
 * be expandable but not clickable and `/components` would be reachable solely
 * by search. Promoting the page whose URL is exactly the section root gives the
 * label both behaviours, which is what fumadocs' `SidebarFolderLink` is for: the
 * chevron toggles, the label navigates.
 */
function liftIndex(
  children: Node[],
  url: string
): { index?: Item; rest: Node[] } {
  const found = children.find(
    (child): child is Item => child.type === "page" && child.url === url
  )
  if (!found) return { rest: children }
  return { index: found, rest: children.filter((child) => child !== found) }
}

/**
 * Split the `project` folder into the two pillars the reader was promised.
 *
 * `content/docs/project/` is one directory because that is where these pages
 * belong on disk: they are all about how opsinjs is run. In the sidebar they are
 * two different questions. "What is coming, and what has been decided" is
 * Roadmap. "What changed, and does it break me" is Changelog.
 */
function splitProject(project: Folder): {
  roadmap: { index?: Item; children: Node[] }
  changelog: { index?: Item; children: Node[] }
} {
  let roadmapIndex: Item | undefined
  let changelog: Folder | undefined
  const governance: Node[] = []

  for (const child of project.children) {
    const leaf = segmentsOf(child)?.[1]
    if (child.type === "page" && leaf === "roadmap") {
      roadmapIndex = child
      continue
    }
    if (child.type === "folder" && leaf === "changelog") {
      changelog = child
      continue
    }
    governance.push(child)
  }

  /* The changelog folder's own overview becomes the Changelog pillar's landing
     page, so the label is a link rather than a bare triangle. */
  const lifted = liftIndex(changelog?.children ?? [], "/project/changelog")

  return {
    roadmap: { index: roadmapIndex, children: governance },
    changelog: {
      index: lifted.index,
      children: lifted.rest,
    },
  }
}

/**
 * Rebuild the root's children as the ten pillars.
 *
 * Anything the pillar table does not claim is appended at the end rather than
 * dropped. A page that exists but appears nowhere is the failure this site
 * criticises other documentation for having, so a new top-level folder shows up
 * in the sidebar unstyled and obvious, instead of vanishing until somebody
 * notices. Add it to `PILLARS` when that happens.
 */
function pillars(root: Root): Root {
  const bySection = new Map<string, Node>()
  let corpusIndex: Item | undefined

  for (const child of root.children) {
    if (child.type === "separator") continue
    if (child.type === "page" && child.url === "/") {
      corpusIndex = child
      continue
    }
    const section = sectionOf(child)
    if (section) bySection.set(section, child)
  }

  const claimed = new Set<string>()
  const take = (section: string): Node | undefined => {
    const node = bySection.get(section)
    if (node) claimed.add(section)
    return node
  }

  const project = bySection.get("project")
  const split =
    project && project.type === "folder" ? splitProject(project) : undefined
  if (split) claimed.add("project")

  const children: Node[] = []

  for (const pillar of PILLARS) {
    let index: Item | undefined
    let icon: Folder["icon"]
    let inherited: Node[] = []

    const primary = pillar.primary ? take(pillar.primary) : undefined
    if (primary && primary.type === "folder") {
      icon = primary.icon
      const lifted = liftIndex(primary.children, `/${pillar.primary}`)
      index = lifted.index
      inherited = lifted.rest
    } else if (pillar.title === "Introduction") {
      index = corpusIndex
    } else if (pillar.title === "Roadmap" && split) {
      index = split.roadmap.index
      inherited = split.roadmap.children
    } else if (pillar.title === "Changelog" && split) {
      index = split.changelog.index
      inherited = split.changelog.children
    }

    const adopted = (pillar.adopt ?? [])
      .map((section) => take(section))
      .filter((node): node is Node => node !== undefined)

    const combined = [...inherited, ...adopted]
    if (!index && combined.length === 0) continue

    children.push({
      type: "folder",
      $id: generatedId(root.$id ?? "root", pillar.title),
      name: pillar.title,
      icon,
      index,
      collapsible: true,
      children: combined,
    })
  }

  for (const [section, node] of bySection) {
    if (!claimed.has(section)) children.push(node)
  }

  return { ...root, children }
}

/* ------------------------------------------------------------------ *

/* ------------------------------------------------------------------ *
 * The transformer fumadocs calls                                      *
 * ------------------------------------------------------------------ */

/**
 * DELIBERATELY NOT ANNOTATED as `PageTreeTransformer`. That type is generic
 * over the content storage, and naming it here pins the generic to the default
 * `PageData` rather than to the docs collection. `loader()` then infers its own
 * output from the pinned transformer, and every caller of `page.data.status`
 * elsewhere in the app stops compiling. Leaving the object structural lets the
 * loader infer it at the call site, which is what the generic is for.
 *
 * `folder` skips the global root: its separators head the top level, which
 * `root` is about to replace wholesale.
 */
export const sidebarTree = {
  folder(node: Folder, folderPath: string): Folder {
    if (folderPath === "") return node
    if (!node.children.some((child) => namedSeparator(child))) return node
    return { ...node, children: groupChildren(node) }
  },
  root(node: Root): Root {
    return pillars(node)
  },
}
