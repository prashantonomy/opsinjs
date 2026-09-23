import type { Folder, Item, Node, Root, Separator } from "fumadocs-core/page-tree"

import { DOCS_BASE, joinPath } from "./routes.ts"

/**
 * sidebar-tree.ts is the shape of the navigation, and it is the only thing that
 * decides it.
 *
 * THE SIDEBAR IS THE SITE. There is no landing page, no top navigation and no
 * jump rail. A reader arrives at `/`, and the one column on the left is the
 * whole map: a wordmark, a search box, and ten sections that open into their
 * pages. Everything this module does serves that.
 *
 * THREE LEVELS, AND NOT A FOURTH. A row in the sidebar is a pillar, a section
 * inside a pillar, or a page inside a section. `MAX_FOLDER_LEVEL` is the rule in
 * one number: a disclosure triangle may sit at level 0 or level 1 and nowhere
 * else, so the deepest row a reader can reach is a page at level 2. A fourth
 * level costs a click to reach and, worse, gives two different rows the same
 * indent on screen while they sit on different branches. The corpus used to
 * reach level 3 on seven paths, among them Components, Patterns, Task patterns,
 * Result disclosure.
 *
 * It applies four transforms to the tree fumadocs builds from the meta.json
 * files, in this order:
 *
 *   1. `liftIndex` gives every folder its own overview page back as a landing
 *      page, so the folder label is a link and the overview stops appearing a
 *      second time as the first row inside it. See the note on that function:
 *      fumadocs deletes the folder's `index` whenever the author lists `"index"`
 *      in `pages`, and every meta.json in this corpus does.
 *
 *   2. `groupChildren` promotes a `---Separator---` run of two or more pages
 *      into a collapsible folder, so a section opens to its subsections rather
 *      than to every page it holds. Components opens to eleven category names,
 *      not to sixty-two component names. A run that already contains a folder
 *      stays a heading, because wrapping a disclosure triangle in another one is
 *      what produced the fourth level.
 *
 *   3. `pillars` rebuilds the top level. The corpus is authored as sixteen
 *      folders because sixteen is the right number of directories to write four
 *      hundred pages into. Sixteen is the wrong number of things to ask a reader
 *      to choose between, so the sidebar shows ten, and the other six are folded
 *      into the one they belong to.
 *
 *   4. `levels` walks the finished tree once and enforces two rules that can
 *      only be checked when the whole shape is known: no folder below
 *      `MAX_FOLDER_LEVEL`, and no icon below the top level.
 *
 * NEITHER THE REGROUPING NOR THE PILLARS MOVES A FILE OR CHANGES A URL.
 * `/patterns/daily-logging` is still `/patterns/daily-logging`. The meta.json
 * files remain the authority that `assert-ia.mts` reads, authors keep writing
 * separators, and this is the one file to edit when the shape of the navigation
 * is wrong.
 */

/**
 * The deepest level a collapsible folder may sit at, counting the pillar row as
 * level 0. Raising it by one adds a level to the sidebar; there is no other
 * switch, and `levels` below is the only place it is read.
 */
const MAX_FOLDER_LEVEL = 1

/* ------------------------------------------------------------------ *
 * 1. A folder gets its own overview page back                         *
 * ------------------------------------------------------------------ */

/**
 * Pull the page whose URL is the folder's own URL out of its children and make
 * it the folder's landing page.
 *
 * WHY THIS IS NEEDED AT ALL. Every meta.json in this corpus lists `"index"`
 * explicitly in `pages`, which is how the author controls where the overview
 * sits in the order. fumadocs reads that as "this page is a child", deletes the
 * folder's own `index` field, and the result is a folder that is a bare
 * disclosure triangle with a first child repeating its exact title: Colour above
 * Colour, Installation above Installation, Decisions above Decisions, in
 * twenty-four places. Putting the page back where fumadocs would have put it
 * costs the reader a row and gains them a link.
 *
 * IT IS ALSO THE LARGEST INTERNAL-LINKING FIX IN THE SIDEBAR. A bare triangle
 * renders no anchor, so `/foundations/colour`, `/start/installation`,
 * `/patterns/forms`, `/reference/api` and twenty more section overviews had no
 * link pointing at them from any sidebar on the site, and no anchor text
 * describing them.
 *
 * `folderPath` is the storage path fumadocs is building, so the folder's URL is
 * that path under the docs base. `joinPath` is imported rather than spelt out
 * because `lib/routes.ts` is the only place a URL is constructed.
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

/* ------------------------------------------------------------------ *
 * 2. Separator runs become collapsible subsections                    *
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
 * `patterns/meta.json` lists `---Form design---` above the `forms` folder, whose
 * title is "Form design". Keeping both gives the reader the same three words
 * twice in a row, once as a heading and once as a link. In that case the
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
 * Regroup one folder's children so every separator run of pages becomes a
 * folder, and every run that already holds a folder stays a heading.
 *
 * THE FOLDER TEST IS THE DEPTH RULE, APPLIED EARLY. `---Token families---` in
 * `foundations/meta.json` heads six folders: Colour, Materials, Motion,
 * Typography, Shape, Space. Wrapping those six in a seventh folder buys nothing,
 * because each of the six is already a disclosure triangle the reader can close,
 * and it costs a level: Foundations, Token families, Colour, Colour roles is
 * four rows deep for one page. Left as a heading, the six sit beside it at level
 * 1 and their pages land at level 2. The same applies to `---Expression---` and
 * to `---Correctness and cost---`, which ends in the Tooling folder.
 *
 * Children before the first separator are left where they are. In this corpus
 * those are the handful of pages that belong to no category, and they read
 * correctly as the first thing inside an open section.
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

    /* A run that already holds a folder keeps its heading and stays flat. */
    if (run.some((child) => child.type === "folder")) {
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
 * 3. The top level is ten pillars                                     *
 * ------------------------------------------------------------------ */

/**
 * One entry per section in the sidebar, in the order they appear.
 *
 * `primary` is the authored folder the pillar is built from: the pillar takes
 * its landing page, its icon and its children. The other two fields both bring
 * in a second top-level folder, and they differ in whether the reader has to
 * open it.
 *
 * `adopt` keeps the folder whole, as one collapsible row inside the pillar.
 * Screens sits under Components because a screen is what you build out of
 * components. Theming sits under Foundations because a theme is a set of token
 * values. Content, Registry and Packages sit under Handbook because all three
 * are mechanics rather than meaning.
 *
 * `inline` splices the folder's overview row and its children straight into the
 * pillar. It is for the case where the folder and the pillar are the same idea,
 * and the row between them is pure overhead: Introduction held exactly two rows,
 * Start here and Recipes, so reaching `/start/installation/next` meant opening
 * Introduction, then Start here, then Installation. Inlining Start here removes
 * one of those three and leaves Installation at a level where it may stay a
 * folder.
 *
 * Introduction has no `primary` because its landing page is the corpus index at
 * `/`, which is a page rather than a folder. It takes its icon from that page
 * for the same reason.
 */
interface Pillar {
  title: string
  primary?: string
  inline?: string[]
  adopt?: string[]
}

const PILLARS: Pillar[] = [
  { title: "Introduction", inline: ["start"], adopt: ["recipes"] },
  { title: "Foundations", primary: "foundations", adopt: ["theming"] },
  { title: "Components", primary: "components", adopt: ["screens"] },
  { title: "Patterns", primary: "patterns" },
  { title: "Accessibility", primary: "accessibility" },
  { title: "Health", primary: "health" },
  {
    title: "Handbook",
    primary: "handbook",
    adopt: ["content", "registry", "packages"],
  },
  { title: "Agents", primary: "agents" },
  { title: "Reference", primary: "reference" },
  { title: "Project", primary: "project" },
]

/**
 * The URL segments of the first page found under a node.
 *
 * THIS IS NOT `node.index`, AND IT CANNOT BE. `liftIndex` has run by the time a
 * pillar is built, so most folders do carry one again, but a folder with no
 * `index.mdx` of its own still does not, and `reference/generated` is exactly
 * that. Every page beneath `content/docs/components/` has a URL starting
 * `/components`, so the first descendant is enough to say where a folder lives,
 * and it uses only the public shape of the tree rather than the internal `$ref`.
 */
function segmentsOf(node: Node): string[] | undefined {
  if (node.type === "page") {
    return node.url.split("/").filter(Boolean)
  }
  if (node.type === "folder") {
    if (node.index) return node.index.url.split("/").filter(Boolean)
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
 * The rows an `inline` folder contributes: its overview, then its children.
 *
 * The overview row is labelled with the folder's title rather than the page's,
 * because the folder title is what the section is called in the meta.json the
 * author maintains, and it is the label the reader saw before the folder was
 * inlined.
 */
function inlined(node: Node): Node[] {
  if (node.type !== "folder") return [node]
  const index = node.index
  const overview: Node[] = index ? [{ ...index, name: node.name }] : []
  return [...overview, ...node.children]
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
    if (child.type === "page" && child.url === joinPath(DOCS_BASE)) {
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

  const children: Node[] = []

  for (const pillar of PILLARS) {
    let index: Item | undefined
    let icon: Folder["icon"]
    let inherited: Node[] = []

    const primary = pillar.primary ? take(pillar.primary) : undefined
    if (primary && primary.type === "folder") {
      icon = primary.icon
      index = primary.index
      inherited = primary.children
    } else if (corpusIndex && !pillar.primary) {
      index = corpusIndex
      icon = corpusIndex.icon
    }

    const spliced = (pillar.inline ?? [])
      .map((section) => take(section))
      .filter((node): node is Node => node !== undefined)
      .flatMap(inlined)

    const adopted = (pillar.adopt ?? [])
      .map((section) => take(section))
      .filter((node): node is Node => node !== undefined)

    const combined = [...inherited, ...spliced, ...adopted]
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
 * 4. Three levels, and icons only on the first                        *
 * ------------------------------------------------------------------ */

/**
 * Walk the finished tree and enforce the two rules that need the whole shape.
 *
 * NO FOLDER BELOW `MAX_FOLDER_LEVEL`. A folder that lands too deep is unwrapped
 * in place: its rows are hoisted to the level the folder occupied, with the
 * folder's own label kept above them. A folder that has an overview page keeps
 * that page as the label, so the label is still a link and the section is still
 * reachable; a generated group has no page behind it, so its title becomes a
 * heading. The three runs this applies to are all generated groups inside an
 * adopted section: Vocabulary, Mechanics and Situations inside Content and
 * language.
 *
 * NO ICON BELOW LEVEL 0. Icons were on fifty-five rows and on three of the ten
 * pillars, which is the arrangement that makes them noise: an icon beside a
 * component name says nothing the name does not, an icon two levels down
 * competes with the row above it for the eye, and a top level where seven rows
 * out of ten have nothing in the icon column reads as a rendering bug. An icon
 * here has one job, which is to make a pillar findable at a glance on a column
 * that never closes, so the pillars keep theirs and everything below is
 * stripped. Content still declares icons; this decides where one renders.
 */
function levels(nodes: Node[], level: number): Node[] {
  const out: Node[] = []

  for (const node of nodes) {
    if (node.type === "separator") {
      out.push({ ...node, icon: undefined })
      continue
    }

    if (node.type === "page") {
      out.push(level === 0 ? node : { ...node, icon: undefined })
      continue
    }

    if (level <= MAX_FOLDER_LEVEL) {
      out.push({
        ...node,
        icon: level === 0 ? node.icon : undefined,
        index: node.index,
        children: levels(node.children, level + 1),
      })
      continue
    }

    if (node.index) {
      out.push({ ...node.index, name: node.name, icon: undefined })
    } else {
      out.push({
        type: "separator",
        $id: generatedId(node.$id ?? "folder", "heading"),
        name: node.name,
      })
    }
    out.push(...levels(node.children, level))
  }

  return out
}

/* ------------------------------------------------------------------ *
 * The transformer fumadocs calls                                      *
 * ------------------------------------------------------------------ */

/**
 * DELIBERATELY NOT ANNOTATED as `PageTreeTransformer`. That type is generic over
 * the content storage, and naming it here pins the generic to the default
 * `PageData` rather than to the docs collection. `loader()` then infers its own
 * output from the pinned transformer, and every caller of `page.data.status`
 * elsewhere in the app stops compiling. Leaving the object structural lets the
 * loader infer it at the call site, which is what the generic is for.
 *
 * `folder` skips the global root: its separators head the top level, which
 * `root` is about to replace wholesale.
 *
 * `icon` is recomputed after `liftIndex` because fumadocs sets a folder's icon
 * to `metadata.icon ?? node.index?.icon` while the index is still deleted, so
 * the fallback half of that expression never fires anywhere in this corpus. Five
 * sections declare their icon on the overview page rather than in meta.json, and
 * without this line five of the ten pillars would render without one.
 */
export const sidebarTree = {
  folder(node: Folder, folderPath: string): Folder {
    if (folderPath === "") return node
    const lifted = liftIndex(node.children, joinPath(DOCS_BASE, folderPath))
    const withIndex: Folder = {
      ...node,
      icon: node.icon ?? lifted.index?.icon,
      index: node.index ?? lifted.index,
      children: lifted.rest,
    }
    if (!withIndex.children.some((child) => namedSeparator(child))) {
      return withIndex
    }
    return { ...withIndex, children: groupChildren(withIndex) }
  },
  root(node: Root): Root {
    const shaped = pillars(node)
    return { ...shaped, children: levels(shaped.children, 0) }
  },
}
