import type { ComponentProps, ReactNode } from "react"
import { TypeTable } from "fumadocs-ui/components/type-table"

/* The one generated module in this file with no typed reader in lib/ in front
   of it. `lib/tokens.ts` exists because six components ask the token map six
   different questions; the props map answers exactly one, from one caller, so a
   pass-through module would be a file to keep in step for no gain. */
import { PROPS_SOURCES, PROPS_TABLES } from "@/lib/generated/props"
import {
  byNamespace,
  byTier,
  getTokens,
  tokensUsedBy,
  type GeneratedToken,
  type TokenNamespace,
  type TokenTier,
} from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { NoDataYet } from "./stub"

/* ==========================================================================
   tables.tsx — the generated tables: <PropsTable>, <DataAttributesTable>,
   <CssVariablesTable>, <KeyboardTable>, <TokenTable>, <BundleSize>, plus <Kbd>.

   Decision 8 in one sentence: every measured number on this site is generated,
   and a table with no data says so instead of showing an example row.

   That is not fussiness. A plausible sample row in a contrast table or a props
   table is indistinguishable from a real one — to a reader skimming, and
   completely to a model reading the HTML. The site's entire claim is that its
   numbers can be trusted because none of them were typed; the moment one page
   carries an illustrative "APCA Lc 68" the claim is gone and nobody can tell
   which page it was.

   The exception, and it is a deliberate one, is <KeyboardTable> with no rows.
   Keyboard behaviour at `status: planned` is a REQUIREMENT, not a measurement:
   the baseline below is what any interactive opsinjs component will have to
   satisfy, it is knowable before the component exists, and it is labelled as a
   requirement rather than as a result.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Shared table shell
   -------------------------------------------------------------------------- */

function Table({
  head,
  children,
  className,
  ...props
}: ComponentProps<"table"> & { head: ReactNode[] }) {
  return (
    <div className={cn("not-prose my-4 overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm" {...props}>
        <thead>
          <tr className="border-b border-border text-left">
            {head.map((cell, i) => (
              <th key={i} scope="col" className="py-2 pr-4 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border/60 align-top">{children}</tr>
}

function Cell({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td className={cn("py-2 pr-4", mono && "font-mono text-xs")}>{children}</td>
  )
}

/* --------------------------------------------------------------------------
   <Kbd>
   -------------------------------------------------------------------------- */

/**
 * One key. Used inline in prose and inside <KeyboardTable>.
 *
 * Rendered as `<kbd>` because that is what it is; the styling is deliberately
 * quiet, since a keyboard reference where every key shouts is harder to scan
 * than one where the actions do.
 */
export function Kbd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center border border-border bg-muted px-1 font-mono text-[0.6875rem] leading-5 text-foreground",
        className
      )}
    >
      {children}
    </kbd>
  )
}

/* --------------------------------------------------------------------------
   <PropsTable>
   -------------------------------------------------------------------------- */

export interface PropsTableProps {
  /**
   * The named exported interface this table documents: `StatusPillProps`.
   *
   * This is the whole authored API of the tag. The rows are looked up from the
   * generated map by this name; there is no way to write one from a page.
   */
  name?: string
  /**
   * The file the interface is exported from, relative to apps/www.
   *
   * Only ever a hint for the empty state, and only worth passing for an
   * interface that does not exist yet — once it does, the generator knows where
   * it came from and this is ignored.
   */
  path?: string
  /**
   * Rows, in fumadocs' TypeTable shape. Emitted by `scripts/build-reference.mts`
   * into `lib/generated/props.ts` from the named interface, and resolved from
   * there by `name`. The escape hatch stays on the interface because a table
   * that is not generated has to be visibly not generated in the source.
   */
  type?: ComponentProps<typeof TypeTable>["type"]
  className?: string
}

/**
 * The API reference table.
 *
 * `<PropsTable name="StatusPillProps" />` is the whole call. The rows come from
 * `PROPS_TABLES`, which `scripts/build-reference.mts` extracts from the
 * `export interface <Pascal>Props` in the component's own file — so the table
 * and the component cannot disagree without `pnpm check:generated` saying so.
 *
 * WHY NOT `<auto-type-table>`. fumadocs-typescript is wired through
 * source.config.ts and would extract the same interface, but it THROWS when the
 * name it is given is missing, which turns a table with no data into a failed
 * build from inside an MDX page. Every other table in this file degrades to
 * <NoDataYet>, and an API table is the one a reader is most likely to meet
 * before its component exists. That is also why `components/mdx.tsx` registers
 * fumadocs' `TypeTable` — remark rewrites `<auto-type-table>` into it — while
 * telling pages to write `<PropsTable>`.
 *
 * Two rules that the generator enforces and that this component exists to make
 * visible when they are broken:
 *
 *   1. It is generated from a NAMED EXPORTED interface. Not an inline object
 *      type, not `ComponentProps<typeof Base.Root>`. An anonymous props type
 *      cannot be linked to, cannot be imported by a consumer, and produces a
 *      table of inherited noise instead of a table of decisions.
 *   2. Props inherited unchanged from Base UI are delegated with one sentence
 *      and a link. opsinjs re-documents only what it adds. A table that repeats
 *      forty upstream props buries the four that matter.
 */
export function PropsTable({ name, path, type, className }: PropsTableProps) {
  const rows = type ?? (name ? PROPS_TABLES[name] : undefined)
  const source = name ? PROPS_SOURCES[name] : undefined

  if (!rows || Object.keys(rows).length === 0) {
    return (
      <NoDataYet
        what={name ? `The API table for ${name}` : "This API table"}
        script="scripts/build-reference.mts"
        className={className}
      >
        It is extracted from the exported interface{" "}
        <code className="text-xs">{name ?? "…Props"}</code>
        {path ? (
          <>
            {" "}
            in <code className="text-xs">{path}</code>
          </>
        ) : null}{" "}
        into <code className="text-xs">lib/generated/props.ts</code>. No file
        under <code className="text-xs">registry/bases/</code> exports an
        interface by that name, so there is nothing to tabulate. While a
        component is <code className="text-xs">planned</code>, its intended props
        are on the page under &ldquo;Proposed API&rdquo; and are explicitly
        marked as a specification.
      </NoDataYet>
    )
  }

  return (
    <div className={cn("not-prose my-4", className)} data-opsinjs-props={name}>
      <TypeTable type={rows} />
      {source ? (
        /* Provenance, not decoration. A reader who wants to check a row should
           be told which file to open, and an agent reading this page should be
           able to see that the table came from source rather than from prose. */
        <p className="mt-1 mb-0 text-xs text-muted-foreground">
          Generated from <code className="text-xs">{name}</code> in{" "}
          <code className="text-xs">{source}</code>.
        </p>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------------------
   <DataAttributesTable>
   -------------------------------------------------------------------------- */

export interface DataAttributeRow {
  /** `data-status`, `data-open`, `data-starting-style`. */
  attribute: string
  /** When the component sets it. */
  condition: string
  /** What it is set to, or "present" for a boolean attribute. */
  value?: string
}

export interface DataAttributesTableProps {
  name?: string
  rows?: DataAttributeRow[]
  className?: string
}

/**
 * The component's state machine, documented as a styling contract.
 *
 * This is the table that lets somebody restyle a component without forking it,
 * and the one that lets a test assert on state without reaching into React.
 * Base UI supplies `data-open`, `data-starting-style` and `data-ending-style`;
 * opsinjs adds `data-status` and `data-category`, which is where the two colour
 * axes become inspectable from the outside.
 */
export function DataAttributesTable({
  name,
  rows,
  className,
}: DataAttributesTableProps) {
  if (!rows?.length) {
    return (
      <NoDataYet
        what={name ? `The data attributes for ${name}` : "This table"}
        script="scripts/build-reference.mts"
        className={className}
      >
        Data attributes are read off the implementation. There is none yet, and
        listing the ones it is expected to have would be a guess presented as a
        contract.
      </NoDataYet>
    )
  }

  return (
    <Table head={["Attribute", "Condition", "Value"]} className={className}>
      {rows.map((row) => (
        <Row key={`${row.attribute}-${row.condition}`}>
          <Cell mono>{row.attribute}</Cell>
          <Cell>{row.condition}</Cell>
          <Cell mono>{row.value ?? "present"}</Cell>
        </Row>
      ))}
    </Table>
  )
}

/* --------------------------------------------------------------------------
   <CssVariablesTable>
   -------------------------------------------------------------------------- */

export interface CssVariableRow {
  /** The selector the variable is read on — a part, not the root. */
  selector: string
  variable: string
  controls: string
}

export interface CssVariablesTableProps {
  name?: string
  rows?: CssVariableRow[]
  className?: string
}

/**
 * CSS custom properties, listed PER SELECTOR rather than as one global dump.
 *
 * The difference is practical: somebody overriding the track of a range bar
 * wants to know which variable is read on the track element. A single flat list
 * of forty variables forces them to read the whole system to change one part,
 * and the usual outcome is that they override the wrong thing at the root and
 * break something two components away.
 */
export function CssVariablesTable({
  name,
  rows,
  className,
}: CssVariablesTableProps) {
  if (!rows?.length) {
    return (
      <NoDataYet
        what={name ? `The CSS variables for ${name}` : "This table"}
        script="scripts/build-tokens.mts"
        className={className}
      />
    )
  }

  return (
    <Table head={["Selector", "Variable", "Controls"]} className={className}>
      {rows.map((row) => (
        <Row key={`${row.selector}-${row.variable}`}>
          <Cell mono>{row.selector}</Cell>
          <Cell mono>{row.variable}</Cell>
          <Cell>{row.controls}</Cell>
        </Row>
      ))}
    </Table>
  )
}

/* --------------------------------------------------------------------------
   <KeyboardTable>
   -------------------------------------------------------------------------- */

export interface KeyboardRow {
  /** One or more keys. Use "+" for a chord and "then" for a sequence. */
  keys: string
  action: string
  notes?: string
}

export interface KeyboardTableProps {
  name?: string
  rows?: KeyboardRow[]
  className?: string
}

/**
 * The baseline every interactive opsinjs component has to meet, whatever it
 * does. It is a requirement rather than a measurement, so it can be stated
 * before the component exists — which is the point of publishing it at
 * `planned`: the bar is set before anybody writes the code that has to clear it.
 */
const KEYBOARD_BASELINE: KeyboardRow[] = [
  {
    keys: "Tab",
    action: "Move focus to the component",
    notes:
      "One tab stop per component, not one per part. A results card with six values is one stop.",
  },
  {
    keys: "Shift + Tab",
    action: "Move focus backwards",
    notes: "Reverse order must match the visual order exactly.",
  },
  {
    keys: "Enter",
    action: "Activate the primary action",
    notes: "Only where the component has one. Never a destructive default.",
  },
  {
    keys: "Space",
    action: "Activate a button, toggle a control",
    notes: "Must not scroll the page when it activates something.",
  },
  {
    keys: "Escape",
    action: "Dismiss an overlay and return focus to what opened it",
    notes:
      "Focus returns to the trigger, not to the top of the document. Required for every dismissible surface.",
  },
  {
    keys: "Arrow keys",
    action: "Move within a composite widget",
    notes:
      "Only inside a group that is a single tab stop — a segmented control, a radio group, a slider.",
  },
]

/**
 * Key | Action | Notes, mandatory on every component page and aggregated into
 * the keyboard reference.
 *
 * Accessibility is never delegated upstream on this site. "Base UI handles the
 * keyboard" is true and useless: the reader still needs to know what this
 * component does with Escape, and the aggregated reference still needs a row.
 */
export function KeyboardTable({ name, rows, className }: KeyboardTableProps) {
  const usingBaseline = !rows?.length
  const data = rows?.length ? rows : KEYBOARD_BASELINE

  return (
    <div className={cn("not-prose", className)} data-opsinjs-keyboard={name}>
      {usingBaseline ? (
        <p className="m-0 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">
            Requirements, not results.
          </strong>{" "}
          {name ? <code className="text-xs">{name}</code> : "This component"} is
          not implemented, so nothing has been tested. This is the baseline the
          implementation will have to clear, plus whatever its own anatomy adds.
        </p>
      ) : null}
      <Table head={["Key", "Action", "Notes"]}>
        {data.map((row) => (
          <Row key={row.keys}>
            <Cell>
              {row.keys.split(" + ").map((key, i) => (
                <span key={key}>
                  {i > 0 ? <span className="px-1">+</span> : null}
                  <Kbd>{key}</Kbd>
                </span>
              ))}
            </Cell>
            <Cell>{row.action}</Cell>
            <Cell>
              <span className="text-muted-foreground">{row.notes}</span>
            </Cell>
          </Row>
        ))}
      </Table>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <TokenTable>
   -------------------------------------------------------------------------- */

export interface TokenTableProps {
  /** A token namespace: `color`, `material`, `motion`, `type`, `space`, `shape`. */
  scope?: TokenNamespace
  /** Or a component id, to list only the tokens that component consumes. */
  component?: string
  /** Override the rows. Rarely needed — the generated map is the source. */
  rows?: GeneratedToken[]
  className?: string
}

/**
 * Token | What it controls | Used by.
 *
 * The third column is what turns a token list into a decision aid. A list of
 * names and values tells you what exists; "used by" tells you what you are
 * about to change, which is the only question anybody has when they open a
 * token table. It is also the column that is impossible to maintain by hand,
 * which is why it is generated with the rest.
 */
export function TokenTable({
  scope,
  component,
  rows,
  className,
}: TokenTableProps) {
  const tokens =
    rows ??
    (component ? tokensUsedBy(component) : scope ? byNamespace(scope) : [])

  if (tokens.length === 0) {
    return (
      <NoDataYet
        what={
          scope
            ? `The ${scope} token table`
            : component
              ? `The token table for ${component}`
              : "This token table"
        }
        script="scripts/build-tokens.mts"
        className={className}
      >
        Tokens are generated from{" "}
        <code className="text-xs">tokens/{scope ?? "*"}.json</code> into{" "}
        <code className="text-xs">lib/generated/tokens.ts</code> and{" "}
        <code className="text-xs">app/tokens.generated.css</code>. Run{" "}
        <code className="text-xs">pnpm run generate</code>.
        {component ? (
          <>
            {" "}
            The &ldquo;used by&rdquo; column additionally needs a built
            component to read, so it stays empty until{" "}
            <code className="text-xs">{component}</code> exists.
          </>
        ) : null}
      </NoDataYet>
    )
  }

  return (
    <Table
      head={["Token", "What it controls", "Used by"]}
      className={className}
    >
      {tokens.map((token) => (
        <Row key={token.cssVar}>
          <Cell mono>
            {token.cssVar}
            <span className="block text-muted-foreground">{token.value}</span>
          </Cell>
          <Cell>{token.description}</Cell>
          <Cell>
            <span className="text-muted-foreground">
              {token.usedBy?.length ? token.usedBy.join(", ") : "Nothing yet"}
            </span>
          </Cell>
        </Row>
      ))}
    </Table>
  )
}

/* --------------------------------------------------------------------------
   <BundleSize>
   -------------------------------------------------------------------------- */

export interface BundleSizeProps {
  name: string
  /** Gzipped size in bytes, measured. */
  gzip?: number
  /** The dependency tail this component drags in. */
  dependencies?: string[]
  /** Whether importing it forces a client boundary. */
  clientBoundary?: boolean
  className?: string
}

/**
 * Gzipped size, dependency tail, and whether the component forces a client
 * boundary.
 *
 * The third of those is the one nobody publishes and everybody needs: in an App
 * Router codebase, a component that carries "use client" changes the shape of
 * the page that renders it. A design system that will not say which of its
 * components do that is making its consumers find out by bisection.
 */
export function BundleSize({
  name,
  gzip,
  dependencies,
  clientBoundary,
  className,
}: BundleSizeProps) {
  if (gzip === undefined) {
    return (
      <NoDataYet
        what={`The cost of ${name}`}
        script="scripts/build-registry.mts"
        className={className}
      >
        Size is measured from a real build of the component. There is nothing to
        build, and an estimate here would be a number nobody measured — which is
        exactly what this column exists to replace.
      </NoDataYet>
    )
  }

  return (
    <Table head={["Measure", "Value"]} className={className}>
      <Row>
        <Cell>Gzipped</Cell>
        <Cell mono>{(gzip / 1024).toFixed(1)} kB</Cell>
      </Row>
      <Row>
        <Cell>Dependency tail</Cell>
        <Cell>{dependencies?.length ? dependencies.join(", ") : "None"}</Cell>
      </Row>
      <Row>
        <Cell>Forces a client boundary</Cell>
        <Cell>{clientBoundary ? "Yes" : "No"}</Cell>
      </Row>
    </Table>
  )
}
