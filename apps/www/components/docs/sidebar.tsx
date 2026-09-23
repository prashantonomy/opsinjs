"use client"

import type { ReactNode } from "react"
import type * as PageTree from "fumadocs-core/page-tree"
import { usePathname } from "fumadocs-core/framework"
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  useFolder,
  useFolderDepth,
} from "fumadocs-ui/components/sidebar/base"
import { useTreePath } from "fumadocs-ui/contexts/tree"

/**
 * The sidebar rows: which level a row is at, as distinct from what the levels
 * are and what they look like.
 *
 * `lib/sidebar-tree.ts` decides the shape and guarantees there are exactly three
 * levels and that only level 0 carries an icon. The `[data-opsin-nav]` block in
 * `app/globals.css` decides what a level looks like. This file is the join: it
 * renders each row with the level it sits at, and nothing else.
 *
 * WHY THIS REPLACES THE DEFAULT ROWS. fumadocs styles every row identically and
 * separates the levels with twelve pixels of indent and one vertical rail drawn
 * at depth 1 only. Two rows on different branches then look the same, a page
 * three levels in has nothing above it tying it to its section, and the reader
 * is left measuring. `sidebar.components` in `DocsLayout` is the published seam
 * for replacing the three renderers, and
 * `fumadocs-ui/components/sidebar/base` is a published entry point carrying the
 * behaviour worth keeping: the collapsible, the open state, the auto-scroll to
 * the active row, the chevron that toggles while the label navigates.
 *
 * THE PANELS STAY IN THE DOCUMENT. `hiddenUntilFound` renders
 * `hidden="until-found"` instead of unmounting, which changes two things. The
 * browser's own find-in-page reaches a collapsed section and opens it. And every
 * link in the sidebar is in the HTML of every page, so the corpus is one
 * crawlable graph rather than four hundred pages that each expose the ten
 * pillars plus whichever branch happens to be open. Nothing about what is on
 * screen changes: a closed panel is still closed.
 */

/** fumadocs' own matcher, which is not exported. Two lines, and it has to agree. */
function isActive(href: string, pathname: string): boolean {
  const normalise = (value: string) =>
    value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value
  return normalise(href) === normalise(pathname)
}

/**
 * A page row.
 *
 * `useFolderDepth()` is the row's own level: zero at the root, one inside a
 * pillar, two inside a section. The icon is passed through rather than
 * suppressed here, because the tree has already stripped every icon below the
 * top level and a second guard in a second file is a second thing to keep in
 * step.
 *
 * `aria-current` is set as well as `data-active`. fumadocs sets only the data
 * attribute, which styles the row and tells a screen reader nothing.
 */
export function Item({ item }: { item: PageTree.Item }): ReactNode {
  const pathname = usePathname()
  const level = useFolderDepth()
  const active = isActive(item.url, pathname)

  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      active={active}
      icon={item.icon}
      aria-current={active ? "page" : undefined}
      data-opsin-nav=""
      data-level={level}
    >
      {item.name}
    </SidebarItem>
  )
}

/**
 * A heading with no page behind it.
 *
 * Rendered as a plain paragraph rather than through fumadocs' `SidebarSeparator`
 * because that component's only contribution is a margin and a padding this
 * block overrides anyway, and leaving them both in the markup means relying on
 * class-merge order to decide which one wins.
 */
export function Separator({ item }: { item: PageTree.Separator }): ReactNode {
  const level = useFolderDepth()

  return (
    <p data-opsin-nav-heading="" data-level={level}>
      {item.name}
    </p>
  )
}

/**
 * A folder row and the panel under it.
 *
 * The row is a link when the folder has an overview page and a button when it
 * does not, which is fumadocs' own split and the reason `lib/sidebar-tree.ts`
 * works so hard to give every authored folder its overview back. Only the
 * generated separator groups reach the button branch.
 */
export function Folder({
  item,
  children,
}: {
  item: PageTree.Folder
  children: ReactNode
}): ReactNode {
  const path = useTreePath()
  const level = useFolderDepth()

  return (
    <SidebarFolder
      collapsible={item.collapsible}
      active={path.includes(item)}
      defaultOpen={item.defaultOpen}
      data-opsin-nav-branch=""
      data-level={level}
    >
      {item.index ? (
        <FolderLink url={item.index.url} icon={item.icon}>
          {item.name}
        </FolderLink>
      ) : (
        <FolderTrigger icon={item.icon}>{item.name}</FolderTrigger>
      )}
      <FolderPanel>{children}</FolderPanel>
    </SidebarFolder>
  )
}

/**
 * The three pieces below read `useFolder()`, which only resolves inside
 * `SidebarFolder`, so they cannot be inlined above. A folder's own row sits one
 * level above its contents, which is why the first two subtract one from the
 * depth the context reports and the panel does not.
 */
function FolderLink({
  url,
  icon,
  children,
}: {
  url: string
  icon: ReactNode
  children: ReactNode
}): ReactNode {
  const pathname = usePathname()
  const folder = useFolder()
  const level = (folder?.depth ?? 1) - 1
  const active = isActive(url, pathname)

  return (
    <SidebarFolderLink
      href={url}
      active={active}
      aria-current={active ? "page" : undefined}
      data-opsin-nav=""
      data-level={level}
    >
      {icon}
      {children}
    </SidebarFolderLink>
  )
}

function FolderTrigger({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}): ReactNode {
  const folder = useFolder()
  const level = (folder?.depth ?? 1) - 1

  return (
    <SidebarFolderTrigger data-opsin-nav="" data-level={level}>
      {icon}
      {children}
    </SidebarFolderTrigger>
  )
}

function FolderPanel({ children }: { children: ReactNode }): ReactNode {
  const level = useFolderDepth()

  return (
    <SidebarFolderContent
      hiddenUntilFound
      data-opsin-nav-panel=""
      data-level={level}
    >
      {children}
    </SidebarFolderContent>
  )
}
