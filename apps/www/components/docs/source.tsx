import type { ReactNode } from "react"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"

import { docsPath, site } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { NotBuiltYet } from "./stub"

/* ==========================================================================
   source.tsx holds <ComponentInstall>, <CodeBlockCommand>, <CodeTabs> and
   <CodeCollapsible>.

   MDX NEVER CONTAINS COMPONENT CODE. A component page names a component and
   shows how to import it; the component's source is in @opsinjs/react, and a
   pasted copy goes stale the first time the component changes. The install
   command comes from `site.packageName` in lib/routes.ts, so the package name
   is written down once.
   ========================================================================== */

/** The four package managers, in the order a reader is most likely to want. */
const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
type Manager = (typeof MANAGERS)[number]

/**
 * Rewrite one canonical `npx …` command for each package manager.
 *
 * Deriving rather than hand-listing matters because the four forms are exactly
 * the kind of thing that drifts: somebody updates the npm line and forgets bun,
 * and the bun user gets a command that has not worked for two releases.
 */
export function commandFor(manager: Manager, command: string): string {
  const npx = command.replace(/^npx\s+/, "")
  if (command.startsWith("npx ")) {
    switch (manager) {
      case "pnpm":
        return `pnpm dlx ${npx}`
      case "yarn":
        return `yarn dlx ${npx}`
      case "bun":
        return `bunx --bun ${npx}`
      default:
        return `npx ${npx}`
    }
  }

  const install = command.replace(/^npm (install|i)\s+/, "")
  if (/^npm (install|i)\s+/.test(command)) {
    switch (manager) {
      case "pnpm":
        return `pnpm add ${install}`
      case "yarn":
        return `yarn add ${install}`
      case "bun":
        return `bun add ${install}`
      default:
        return `npm install ${install}`
    }
  }

  return command
}

export interface CodeBlockCommandProps {
  /** The canonical npm/npx form. Every other manager is derived from it. */
  command: string
  /** Rendered above the tabs. */
  title?: ReactNode
  /** Dim the block and say why. Used at `status: planned`. */
  disabledReason?: ReactNode
  className?: string
}

/**
 * A shell command in four package-manager tabs, with the reader's choice
 * persisted across every command on the site.
 *
 * `persist` with a shared `groupId` is the whole point: a pnpm user should pick
 * pnpm once, not once per page. The id matches `remarkNpmOptions.persist.id` in
 * source.config.ts so that these tabs and the ones remark generates from
 * ```npm fences in MDX move together.
 */
export function CodeBlockCommand({
  command,
  title,
  disabledReason,
  className,
}: CodeBlockCommandProps) {
  return (
    <div
      className={cn(
        "not-prose my-4",
        disabledReason && "opacity-80",
        className
      )}
      data-opsinjs-command=""
    >
      {title ? (
        <p className="m-0 mb-1 text-xs text-muted-foreground">{title}</p>
      ) : null}

      {disabledReason ? (
        <p className="m-0 border border-b-0 border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}

      <Tabs
        items={[...MANAGERS]}
        groupId="package-manager"
        persist
        aria-disabled={disabledReason ? true : undefined}
      >
        {MANAGERS.map((manager) => (
          <Tab key={manager} value={manager}>
            <CodeBlock allowCopy>
              <Pre>{commandFor(manager, command)}</Pre>
            </CodeBlock>
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <CodeTabs> and <CodeCollapsible>
   -------------------------------------------------------------------------- */

export interface CodeTabsProps {
  /** One label per file or variant. */
  items: string[]
  /** Optional shared id, so two blocks documenting the same choice agree. */
  groupId?: string
  /** Persist the reader's choice. Off unless the choice is a preference. */
  persist?: boolean
  children: ReactNode
}

/**
 * Multi-file tabs. Used for "here is the page and here is the component", where
 * two files only make sense read together.
 */
export function CodeTabs({ items, groupId, persist, children }: CodeTabsProps) {
  return (
    <Tabs items={items} groupId={groupId} persist={persist}>
      {children}
    </Tabs>
  )
}

export interface CodeCollapsibleProps {
  /** What the reader is choosing to open. Be specific: not "Show code". */
  title?: ReactNode
  /** Open by default when the snippet is the point of the section. */
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

/**
 * A long snippet, collapsed.
 *
 * Built on `<details>` rather than on state, so it works before hydration, is
 * findable by in-page browser search in every current browser, and prints
 * expanded. That matters because a reviewer reading on paper cannot click.
 */
export function CodeCollapsible({
  title = "Show the full file",
  defaultOpen,
  children,
  className,
}: CodeCollapsibleProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "not-prose docs-sheet my-4 overflow-hidden [&[open]>summary]:border-b",
        className
      )}
    >
      <summary className="cursor-pointer border-border/60 px-3 py-2 text-sm font-medium hover:bg-muted/50">
        {title}
      </summary>
      <div className="px-3 py-2 [&_pre]:my-2">{children}</div>
    </details>
  )
}

/* --------------------------------------------------------------------------
   <ComponentInstall>
   -------------------------------------------------------------------------- */

export interface ComponentInstallProps {
  /** Catalogue id. */
  name: string
  /** Render the block disabled with an explanation. True while unbuilt. */
  unbuilt?: boolean
  className?: string
}

/**
 * The install block at the head of a component page's Usage section.
 *
 * Every component ships in one package, so the command is the same on every
 * page: it is the package, not the component, that a reader installs. The page
 * shows the import in its own code fence, below this block, because that line
 * is the one a reader copies and it has to be readable in the `.md` twin too.
 */
export function ComponentInstall({ name, unbuilt = true, className }: ComponentInstallProps) {
  /*
   * Spread an object, never `unbuilt ? name : undefined`, for the reason
   * <StubNotice> in stub.tsx spells out: an attribute set to `undefined`
   * reaches the RSC flight payload as the string `$undefined`, which makes a
   * built page grep as unbuilt.
   */
  const marker = unbuilt ? { "data-opsinjs-not-implemented": name } : {}

  if (unbuilt) {
    return (
      <div className={cn("not-prose my-4", className)} {...marker}>
        <NotBuiltYet name={name}>
          {site.packageName} does not export {toPascal(name)} yet, so there is
          nothing to install for it.
        </NotBuiltYet>
      </div>
    )
  }

  return (
    <div className={cn("not-prose my-4", className)}>
      <CodeBlockCommand command={`npm install ${site.packageName}`} />
      <p className="m-0 text-xs text-muted-foreground">
        Every component is in{" "}
        <code className="text-xs">{site.packageName}</code>. Load its stylesheet
        once, as{" "}
        <a className="underline" href={docsPath("getting-started")}>
          Getting started
        </a>{" "}
        describes.
      </p>
    </div>
  )
}

/** `range-bar` → `RangeBar`. Ids are kebab-case; prose and code are Pascal. */
function toPascal(id: string): string {
  return id
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join("")
}
