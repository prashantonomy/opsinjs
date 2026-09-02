import { isValidElement, type ReactNode } from "react"
import Link from "next/link"

import { isBuilt } from "@/lib/registry"
import { apiSymbolPath, componentPath, docsPath } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy"
import { NotBuiltYet } from "./stub"

/* ==========================================================================
   anatomy.tsx — <Anatomy>, <CompositionTree>, <RelatedComponents>, <ApiLink>,
   <FlowDiagram>.

   These four exist for a reader who is deciding, and — increasingly — for a
   model that is generating.

   <CompositionTree> is the one to keep. Wrong nesting of compound parts is the
   most common generation failure in every design system: `<Card.Header>`
   outside `<Card.Root>`, a trigger that is not inside its own provider, a part
   used twice where the contract allows one. Prose does not fix that and a props
   table cannot express it. A plain-text tree can, it is cheap, and it is the
   single highest-value thing on a compound component's page.

   <RelatedComponents> answers the question that actually brings people to a
   component page — "is this the right one?" — with the components most often
   confused with this one and the ONE line of reason each. A related list
   without reasons is a list of links; with them it is a decision.
   ========================================================================== */

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ""
}

/* --------------------------------------------------------------------------
   <ApiLink>
   -------------------------------------------------------------------------- */

export interface ApiLinkProps {
  /** The exported symbol: `RangeBarProps`, `ClinicalStatus`. */
  symbol?: string
  children?: ReactNode
  className?: string
}

/**
 * An inline link from a type name to its own page in the Reference pillar.
 *
 * Per-symbol pages rather than an anchor on one enormous page (B11). An anchor
 * on a 4,000-line reference is unreadable on a phone, unlinkable from an error
 * message, and — the reason it matters here — impossible for an agent to fetch
 * without pulling the whole document into its context.
 */
export function ApiLink({ symbol, children, className }: ApiLinkProps) {
  const name = symbol ?? textOf(children)
  return (
    <Link
      href={apiSymbolPath(name)}
      className={cn("font-mono text-[0.9em]", className)}
    >
      {children ?? name}
    </Link>
  )
}

/* --------------------------------------------------------------------------
   <Anatomy>
   -------------------------------------------------------------------------- */

export interface AnatomyPart {
  /** The part's name as it appears in the composition tree. */
  name: string
  /** What it is for, in one line. */
  describes: string
  /** The prop that controls it, when one does. */
  prop?: string
}

export interface AnatomyProps {
  name: string
  parts?: AnatomyPart[]
  /** Behaviour axis, for the registry lookup. */
  base?: string
  /** CSS axis, for the registry lookup. */
  style?: string
  className?: string
}

/**
 * The labelled parts diagram.
 *
 * The numbered list is the whole component at every status, and that is not a
 * degradation. While the component is unbuilt there is nothing to overlay
 * labels onto, so the list IS the specification of the parts and is what an
 * implementation gets reviewed against; once it is built, the same list is the
 * `data-slot` contract, one line per slot, in the order the parts nest. The
 * not-built marker above it is the only thing that comes and goes, and it is
 * resolved from the registry rather than assumed — a marker that stayed put
 * after the component landed would make every built page read as unbuilt, which
 * is the same defect as the reverse and rather harder to notice.
 */
export function Anatomy({
  name,
  parts,
  base,
  style,
  className,
}: AnatomyProps) {
  const built = isBuilt(name, base, style)

  return (
    <div
      className={cn("not-prose my-6", className)}
      data-opsinjs-anatomy={name}
    >
      {built ? null : (
        <NotBuiltYet name={name} className="mb-3">
          The labelled diagram is drawn over a real render. There is nothing to
          render, so the parts are listed instead — which is what the
          implementation will have to match.
        </NotBuiltYet>
      )}

      {parts?.length ? (
        <ol className="m-0 list-none space-y-2 p-0">
          {parts.map((part, index) => (
            <li
              key={part.name}
              className="m-0 flex gap-3 border-b border-border/60 pb-2"
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center border border-border font-mono text-xs"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <code className="text-sm">{part.name}</code>
                <span className="block text-sm text-muted-foreground">
                  {part.describes}
                </span>
                {part.prop ? (
                  <span className="block text-xs text-muted-foreground">
                    Controlled by <code className="text-xs">{part.prop}</code>
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          The parts of <code className="text-xs">{name}</code> have not been
          specified yet. A component page that reaches review without them is
          incomplete: the parts list is what the anatomy diagram, the
          composition tree and the CSS-variable table are all derived from.
        </p>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
   <CompositionTree>
   -------------------------------------------------------------------------- */

export interface CompositionNode {
  /** `RangeBar.Root`, `RangeBar.Track`. */
  part: string
  /** Cardinality: "1", "0..1", "1..n". Wrong cardinality is a real bug. */
  cardinality?: string
  /** One line: what it contributes. */
  note?: string
  /** The symbol to link to in the Reference pillar. */
  symbol?: string
  children?: CompositionNode[]
}

export interface CompositionTreeProps {
  name: string
  tree?: CompositionNode[]
  className?: string
}

function TreeRows({
  nodes,
  depth = 0,
}: {
  nodes: CompositionNode[]
  depth?: number
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const last = index === nodes.length - 1
        return (
          <li key={`${depth}-${node.part}`} className="m-0">
            <span className="font-mono text-xs">
              <span aria-hidden="true" className="text-muted-foreground">
                {depth > 0
                  ? `${"  ".repeat(depth - 1)}${last ? "└─ " : "├─ "}`
                  : ""}
              </span>
              {node.symbol ? (
                <ApiLink symbol={node.symbol}>{node.part}</ApiLink>
              ) : (
                node.part
              )}
              {node.cardinality ? (
                <span className="text-muted-foreground">
                  {" "}
                  {node.cardinality}
                </span>
              ) : null}
            </span>
            {node.note ? (
              <span className="block pl-4 text-xs text-muted-foreground">
                {node.note}
              </span>
            ) : null}
            {node.children?.length ? (
              <ul className="m-0 list-none p-0">
                <TreeRows nodes={node.children} depth={depth + 1} />
              </ul>
            ) : null}
          </li>
        )
      })}
    </>
  )
}

/**
 * The plain-text part hierarchy for a compound component.
 *
 * Cardinality is shown beside every part because that is half the contract: a
 * card with two headers and a range bar with three markers are both legal
 * JSX and both wrong, and nothing else on the page says so.
 */
export function CompositionTree({
  name,
  tree,
  className,
}: CompositionTreeProps) {
  if (!tree?.length) {
    return (
      <div
        className={cn(
          "not-prose my-4 border border-dashed border-border p-4 text-sm text-muted-foreground",
          className
        )}
        data-opsinjs-composition={name}
      >
        <p className="m-0">
          <strong className="font-medium text-foreground">
            No composition tree yet for {name}.
          </strong>{" "}
          If it turns out to be a single element rather than a compound
          component, say so here in a sentence — an empty tree and a
          deliberately flat component look identical, and only one of them is
          finished.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn("not-prose my-4 border border-border p-3", className)}
      data-opsinjs-composition={name}
    >
      <ul className="m-0 list-none p-0">
        <TreeRows nodes={tree} />
      </ul>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <RelatedComponents>
   -------------------------------------------------------------------------- */

export interface RelatedComponentsProps {
  name: string
  /** The ones people reach for by mistake, each with the one-line reason. */
  confusedWith?: { id: string; reason: string }[]
  /** Patterns and recipes that use this component. From `usedIn`. */
  usedIn?: { slug: string; label: string }[]
  /** Doctrine pages that govern it. From `governedBy`. */
  governedBy?: { slug: string; label: string }[]
  className?: string
}

/**
 * Three short lists, always present: what this is confused with, what uses it,
 * and what governs it.
 *
 * The "confused with" list is the one that earns its place. Somebody who is
 * about to use AlertBanner for a piece of neutral guidance is not going to
 * search for Callout — they do not know it exists. The only place that mistake
 * can be caught is on the page they are already reading.
 */
export function RelatedComponents({
  name,
  confusedWith,
  usedIn,
  governedBy,
  className,
}: RelatedComponentsProps) {
  const empty = !confusedWith?.length && !usedIn?.length && !governedBy?.length

  return (
    <div
      className={cn("not-prose my-6 grid gap-4 md:grid-cols-3", className)}
      data-opsinjs-related={name}
    >
      <section>
        <h3 className="m-0 text-sm font-medium">Often confused with</h3>
        {confusedWith?.length ? (
          <ul className="m-0 mt-1 list-none p-0 text-sm">
            {confusedWith.map((item) => (
              <li key={item.id} className="m-0 mb-2">
                <Link href={componentPath(item.id)}>{item.id}</Link>
                <span className="block text-xs text-muted-foreground">
                  {item.reason}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-1 text-xs text-muted-foreground">
            None declared. Every component that reports a health value is
            confused with at least one other; an empty list here usually means
            it has not been thought about.
          </p>
        )}
      </section>

      <section>
        <h3 className="m-0 text-sm font-medium">Used in</h3>
        {usedIn?.length ? (
          <ul className="m-0 mt-1 list-none p-0 text-sm">
            {usedIn.map((item) => (
              <li key={item.slug} className="m-0 mb-1">
                <Link href={docsPath(item.slug)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-1 text-xs text-muted-foreground">
            Generated from the <code className="text-xs">usedIn</code>{" "}
            frontmatter of the recipes and screens that reference this
            component.
          </p>
        )}
      </section>

      <section>
        <h3 className="m-0 text-sm font-medium">Governed by</h3>
        {governedBy?.length ? (
          <ul className="m-0 mt-1 list-none p-0 text-sm">
            {governedBy.map((item) => (
              <li key={item.slug} className="m-0 mb-1">
                <Link href={docsPath(item.slug)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-1 text-xs text-muted-foreground">
            Generated from the <code className="text-xs">governedBy</code>{" "}
            frontmatter. A health component with none is a defect, and assert-ia
            reports it.
          </p>
        )}
      </section>

      {empty ? (
        <p className="m-0 text-xs text-muted-foreground md:col-span-3">
          All three lists are derived from frontmatter, so filling them in is
          how a component joins the graph rather than sitting outside it.
        </p>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------------------
   <FlowDiagram>
   -------------------------------------------------------------------------- */

export interface FlowDiagramProps {
  /**
   * A text alternative for the flow. Required in practice: a diagram with no
   * text alternative fails WCAG 2.2 SC 1.1.1, and a pattern page whose only
   * description of the journey is a picture is unusable to a screen-reader
   * reader and to a model.
   */
  alt?: ReactNode
  /** The mermaid source, passed as a template string from MDX. */
  children: ReactNode
  /** Caption under the diagram. */
  caption?: ReactNode
  className?: string
}

/**
 * A flow for a pattern or a screen.
 *
 * `mermaid` is NOT a dependency of this site (decision 10: zero unverified
 * dependencies), so nothing here renders the diagram into shapes. What it does
 * instead is the part that carries the meaning: the prose description first, the
 * source available and copyable, and a `data-opsinjs-mermaid` hook plus the
 * conventional `class="mermaid"` so that adding a renderer later upgrades every
 * diagram on the site without touching a single page.
 *
 * This ordering is not a workaround. A flow that only exists as a picture is
 * one a screen-reader user cannot follow, one that does not survive the `.md`
 * twin, and one an agent has to guess at. Writing the prose first is what the
 * accessibility rule asks for anyway; the picture is the enhancement.
 */
export function FlowDiagram({
  alt,
  children,
  caption,
  className,
}: FlowDiagramProps) {
  const source = textOf(children).trim()

  if (!alt && typeof window === "undefined") {
    console.warn(
      "[opsinjs:a11y] <FlowDiagram> without an `alt` description. A diagram with no text alternative fails WCAG 2.2 SC 1.1.1."
    )
  }

  return (
    <figure
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-mermaid=""
    >
      {alt ? (
        <div className="border-b border-border/60 p-3 text-sm [&>p]:m-0 [&>p+p]:mt-2">
          {alt}
        </div>
      ) : null}

      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Diagram source (mermaid)
          </span>
          <CopyButton value={source} />
        </div>
        <pre className="mermaid m-0 overflow-x-auto text-xs">{source}</pre>
      </div>

      {caption ? (
        <figcaption className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
