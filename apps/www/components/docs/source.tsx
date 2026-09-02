import type { ReactNode } from "react"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"

import { DEFAULT_BASE, DEFAULT_STYLE, site } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy"
import { NotBuiltYet } from "./stub"

/* ==========================================================================
   source.tsx — <ComponentSource>, <ComponentInstall>, <CodeBlockCommand>,
   <CodeTabs>, <CodeCollapsible>.

   THE RULE THIS FILE ENFORCES: MDX NEVER CONTAINS COMPONENT CODE.

   A component page names a component; it does not paste it. Pasted source goes
   stale the first time the component changes, and a stale snippet on a health
   documentation page is not a cosmetic problem — somebody copies it, and the
   copy no longer matches the props, the data attributes or the accessibility
   behaviour the rest of the page promises.

   So <ComponentSource name="range-bar" /> resolves a NAME against the generated
   registry index and renders whatever is really there. Today that is nothing,
   and the honest render is <NotBuiltYet> naming the folder the file will live
   in — not an illustrative snippet, which an agent would happily consume as the
   real implementation.

   The install block is generated the same way, from the registry item: the
   dependency list, the file paths and the import path all come from data. The
   only hand-written thing is the sentence explaining what the command does.
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
 * expanded — which matters because a reviewer reading on paper cannot click.
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
        "not-prose my-4 border border-border [&[open]>summary]:border-b",
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
   <ComponentSource>
   -------------------------------------------------------------------------- */

export interface ComponentSourceProps {
  /** Catalogue id. Never a path — the path is the registry's business. */
  name: string
  /** Behaviour axis. */
  base?: string
  /** CSS axis. Only affects which style file is shown, never the logic. */
  style?: string
  /** Show one file of a multi-file item. */
  file?: string
  /** Collapse it. Long components are collapsed by default on their own page. */
  collapsible?: boolean
  className?: string
}

/**
 * The component's real source, resolved by name through the generated registry
 * index. There is no `code` prop and there never will be one: the moment a page
 * can pass its own source, pages start carrying source.
 */
export function ComponentSource({
  name,
  base = DEFAULT_BASE,
  style = DEFAULT_STYLE,
  file,
  collapsible,
  className,
}: ComponentSourceProps) {
  const path = `registry/bases/${base}/${file ?? `${name}.tsx`}`

  const body = (
    <NotBuiltYet name={name} className={cn("my-0", className)}>
      The source for this component would be read from{" "}
      <code className="text-xs">{path}</code> (style{" "}
      <code className="text-xs">{style}</code>) by{" "}
      <code className="text-xs">scripts/build-registry.mts</code>. That folder
      is reserved and empty.
    </NotBuiltYet>
  )

  if (!collapsible) return body
  return <CodeCollapsible title={`Source — ${path}`}>{body}</CodeCollapsible>
}

/* --------------------------------------------------------------------------
   <ComponentInstall>
   -------------------------------------------------------------------------- */

export interface ComponentInstallProps {
  /** Catalogue id. */
  name: string
  /** npm packages the registry item declares. Empty until it declares any. */
  dependencies?: string[]
  /** Other catalogue ids this one pulls in. */
  registryDependencies?: string[]
  /** The import path once it exists. */
  importPath?: string
  /** Render the block disabled with an explanation. True while unbuilt. */
  unbuilt?: boolean
  className?: string
}

/**
 * The whole Installation section, generated from the registry item.
 *
 * It sits at section 4 of the component anatomy on purpose: the ordinary
 * install path stays two scrolls from the top, above the clinical prose. A
 * developer who came for one command should not have to read a page of doctrine
 * to find it — and the doctrine is more likely to be read by somebody who was
 * not made to wade through it first.
 */
export function ComponentInstall({
  name,
  dependencies,
  registryDependencies,
  importPath,
  unbuilt = true,
  className,
}: ComponentInstallProps) {
  const command = `npx shadcn@latest add ${site.registryNamespace}/${name}`
  const target = importPath ?? `@/components/ui/${name}`

  return (
    <div
      className={cn("not-prose my-4", className)}
      data-opsinjs-not-implemented={unbuilt ? name : undefined}
    >
      {unbuilt ? (
        <p className="sr-only">
          NOT INSTALLABLE. The opsinjs registry contains no item named {name}.
          This command is shown so the intended install path can be reviewed; it
          will fail if it is run.
        </p>
      ) : null}

      <Tabs items={["CLI", "Manual"]}>
        <Tab value="CLI">
          <CodeBlockCommand
            command={command}
            disabledReason={
              unbuilt ? (
                <>
                  <strong className="font-medium text-foreground">
                    This command does not work yet.
                  </strong>{" "}
                  The registry has no item called{" "}
                  <code className="text-xs">{name}</code>. It is shown so the
                  install path can be reviewed alongside the specification.
                </>
              ) : undefined
            }
          />
          <p className="m-0 text-xs text-muted-foreground">
            The <code className="text-xs">{site.registryNamespace}</code>{" "}
            namespace is declared in your{" "}
            <code className="text-xs">components.json</code>. Everything it
            installs is code you then own — there is no runtime package to keep
            in step.
          </p>
        </Tab>

        <Tab value="Manual">
          {unbuilt ? (
            <NotBuiltYet name={name}>
              A manual install lists the dependencies, the files to copy and the
              import to add. All three come from the registry item, which does
              not exist yet.
            </NotBuiltYet>
          ) : (
            <ol className="text-sm">
              <li>
                Install the dependencies:
                {dependencies?.length ? (
                  <CodeBlockCommand
                    command={`npm install ${dependencies.join(" ")}`}
                  />
                ) : (
                  <p className="m-0 text-xs text-muted-foreground">
                    None beyond what opsinjs already requires.
                  </p>
                )}
              </li>
              {registryDependencies?.length ? (
                <li>
                  Add the components it builds on:{" "}
                  {registryDependencies.join(", ")}.
                </li>
              ) : null}
              <li>
                Copy the source into your project:
                <ComponentSource name={name} collapsible />
              </li>
              <li>
                Import it:
                <div className="mt-1 flex items-center gap-2">
                  <code className="text-xs">
                    {`import { ${toPascal(name)} } from "${target}"`}
                  </code>
                  <CopyButton
                    value={`import { ${toPascal(name)} } from "${target}"`}
                  />
                </div>
              </li>
            </ol>
          )}
        </Tab>
      </Tabs>
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
