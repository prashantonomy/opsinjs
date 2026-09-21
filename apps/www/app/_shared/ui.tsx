import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { categories, statusLevels } from "./axes"

/**
 * Presentational primitives shared by the marketing, browser and playground
 * routes. Deliberately server-safe: no hooks, no state, no `use client`.
 *
 * These are NOT part of the documented MDX vocabulary. The closed vocabulary in
 * `components/docs/**` (owned by the MDX-vocabulary worker) is what documentation
 * pages use; nothing here is exported to MDX and nothing here may be referenced
 * from an `.mdx` file. The split exists because a landing page and a
 * documentation page have genuinely different jobs, and pretending otherwise is
 * how design-system sites end up with a home page built out of `<Callout>`.
 */

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  )
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="border-b border-border py-12 sm:py-16">
      <Container>
        {eyebrow ? (
          <p className="mb-3 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {lead ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            {lead}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </header>
  )
}

export function Section({
  id,
  title,
  lead,
  children,
  className,
}: {
  id?: string
  title?: ReactNode
  lead?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("border-b border-border py-12", className)}>
      <Container>
        {title ? (
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h2>
        ) : null}
        {lead ? (
          <p className="mt-3 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
            {lead}
          </p>
        ) : null}
        <div className={cn(title || lead ? "mt-8" : undefined)}>{children}</div>
      </Container>
    </section>
  )
}

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-none",
        className
      )}
      {...props}
    />
  )
}

export function Grid({
  cols = 3,
  className,
  ...props
}: ComponentProps<"div"> & { cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A semantic fact table for hand-written routes. `components/docs/tables.tsx`
 * belongs to the closed MDX vocabulary and must not be reached from here, so
 * this is the primitive a marketing or browser page uses when the honest shape
 * of a fact is a row rather than a paragraph.
 *
 * The first cell of every row is a `<th scope="row">`, not a `<td>`: the row
 * label is a heading, and that is what lets a screen reader announce a cell as
 * "Rung 3, Blur, 12px" rather than reading a stream of unattached values. The
 * header cells carry `scope="col"` for the same reason. Pass the row label
 * first in every row and the rest of the row in column order.
 *
 * The table sits inside its own `overflow-x-auto` container so a wide table
 * scrolls within itself and the page body never scrolls horizontally. Colour
 * comes only from the token classes the rest of this file uses; a table here
 * carries neither axis, so no status or category value is ever typed in.
 */
export function FactTable({
  caption,
  columns,
  rows,
  className,
}: {
  caption?: ReactNode
  columns: string[]
  rows: ReactNode[][]
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border bg-card",
        className
      )}
    >
      <table className="w-full border-collapse text-left text-sm">
        {caption ? (
          <caption className="border-b border-border px-4 py-3 text-left leading-relaxed text-muted-foreground">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-left align-bottom font-medium text-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-0">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="px-4 py-3 text-left align-top font-medium text-foreground"
                  >
                    {cell}
                  </th>
                ) : (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 align-top leading-relaxed text-muted-foreground"
                  >
                    {cell}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Links                                                                      */
/* -------------------------------------------------------------------------- */

export function CtaLink({
  href,
  variant = "primary",
  children,
}: {
  href: string
  variant?: "primary" | "secondary"
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border text-foreground hover:bg-muted"
      )}
    >
      {children}
    </Link>
  )
}

export function LinkCard({
  href,
  title,
  meta,
  children,
  external,
}: {
  href: string
  title: ReactNode
  meta?: ReactNode
  children?: ReactNode
  external?: boolean
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{title}</span>
        {meta ? (
          <span className="font-mono text-[11px] tracking-wide whitespace-nowrap text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
      {children ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      ) : null}
    </>
  )

  const className =
    "bg-card border-border hover:border-foreground/25 focus-visible:outline-ring block rounded-lg border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"

  if (external) {
    return (
      <a
        href={href}
        className={className}
        rel="noreferrer noopener"
        target="_blank"
      >
        {body}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Honesty                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The scaffold's standing disclosure, used on every hand-written route outside
 * the corpus. Documentation pages have `<NotBuiltYet>` and `<StubNotice>`, which
 * additionally emit the machine-readable not-implemented marker an agent reads.
 * This is the human-facing equivalent for pages that are not about one named
 * component, so it deliberately does NOT emit that marker. An agent must never
 * conclude from the landing page that a specific component was answered for,
 * in either direction. The marker is per-component and this notice is not.
 *
 * It is named for the question it answers rather than for the answer, because
 * the answer changes: it opened as "nothing is built", it says "installable,
 * author-audited, and not independently reviewed" now, and the day the reviews
 * happen it will say that. A component whose name asserts one of those is a
 * component that lies as soon as the sentence under it stops being true.
 */
export function ImplementationStatusNotice({
  children,
  href,
}: {
  children?: ReactNode
  href?: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
      <p className="mb-1 font-medium text-foreground">
        Installable, not independently reviewed, and not yet packaged.
      </p>
      <p>
        {children ??
          "Every component that exists today is installable as source from the shadcn registry this site serves, and free to change its API in any release without a deprecation cycle. Every one has been audited against WCAG 2.2 AA by its own authors, in a static source pass and a rendered pass, and that is an author-run audit rather than an independent review. Nothing is published to npm, no component has had a clinical review, and none of it therefore belongs on a production health surface yet."}
      </p>
      {href ? (
        <p className="mt-2">
          <Link
            href={href}
            className="text-foreground underline underline-offset-4"
          >
            What exists today
          </Link>
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Token specimens                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The canonical status specimen, rendered straight out of the token layer.
 *
 * Every colour here is a CSS custom property resolved at paint time, so this
 * component cannot drift from `tokens/color.json`: when `build-tokens.mts`
 * rewrites `app/tokens.generated.css`, this specimen changes with it and no
 * value is ever typed into a page. That is the same rule the documentation
 * pages follow, applied to the marketing surface.
 *
 * Note what each row carries besides colour: a word, a shape, and a sentence.
 * Status is never colour alone. The specimen is here to make that rule visible
 * rather than to assert it.
 */
export function StatusSpecimen({ compact }: { compact?: boolean }) {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {statusLevels.map((level) => (
        <li
          key={level.id}
          data-status={level.id}
          className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4"
          style={{
            backgroundColor: `var(--opsin-status-${level.id}-surface)`,
            color: `var(--opsin-status-${level.id}-ink)`,
          }}
        >
          <span className="flex min-w-32 items-center gap-2 font-medium">
            <span
              aria-hidden
              className="inline-block size-3 shrink-0 rounded-full"
              style={{
                backgroundColor: `var(--opsin-status-${level.id}-line)`,
              }}
            />
            {level.label}
          </span>
          <span className="text-sm leading-relaxed">
            {compact ? level.meaning : level.sentence}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Category identity. Low chroma on purpose: if a category swatch reads as a
 * verdict, the two axes have collapsed into one and the system has failed.
 */
export function CategorySpecimen() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category) => (
        <li
          key={category.id}
          data-category={category.id}
          className="rounded-lg border border-border p-3"
          style={{
            backgroundColor: `var(--opsin-category-${category.id}-surface)`,
            color: `var(--opsin-category-${category.id}-ink)`,
          }}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span
              aria-hidden
              className="inline-block size-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: `var(--opsin-category-${category.id}-accent)`,
              }}
            />
            {category.label}
          </span>
          <p className="mt-1 text-xs leading-relaxed opacity-80">
            {category.example}
          </p>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Small type                                                                 */
/* -------------------------------------------------------------------------- */

export function Mono({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]",
        className
      )}
      {...props}
    />
  )
}

export function Prose({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-4 leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-foreground",
        className
      )}
      {...props}
    />
  )
}
