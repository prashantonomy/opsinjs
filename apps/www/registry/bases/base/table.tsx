/**
 * Table is rows and columns of data in a real semantic table, and the readable
 * twin every chart in the system ships beside it.
 *
 * WHAT IT REFUSES TO BE, AND WHY. It refuses to be a data grid. There is no
 * sorting, no row selection, no virtualisation and no per-row menu. A chart
 * needs a twin a screen reader and a keyboard user can read, and that twin is a
 * small, honest table. The moment a table grows a sort control it grows a
 * comparator, a stable-sort guarantee and an announcement of the new order, and
 * it stops being the thing a chart can lean on. Those belong to a product's own
 * grid, built on Base UI, not to this component.
 *
 * IT OWNS THE ACCESSIBILITY INVARIANTS THAT A CALLER MUST NOT BE ABLE TO
 * ASSEMBLE WRONG. This is why the API is data driven and not compound. A
 * caption is required and always rendered. The header cells always carry
 * scope="col", the first body cell carries scope="row" when it is a row
 * header, and the table always sits inside one scroll container. Compound
 * parts would let a caller ship a table with no caption, or two thead
 * elements, or a header cell with no scope, and pass every gate in this
 * repository. So the parts are identified by data-slot for styling and none of
 * them is an export. This is the opposite call to card.tsx, which is compound
 * because a card is a free layout surface with no invariant to protect; a
 * table has several.
 *
 * THE SIDEWAYS SCROLL IS THE COMPONENT'S JOB, NOT THE PAGE'S. The table lives
 * inside an overflow-x-auto container so a table wider than the screen scrolls
 * inside its own box and never pushes the page body sideways. The container is
 * focusable, because a horizontally scrollable region a keyboard reader cannot
 * reach is a region they cannot read. Whether it should also be a named
 * landmark is left open on the page rather than guessed at here.
 *
 * IT CARRIES NEITHER COLOUR AXIS. There is no status prop and no category
 * prop, the elements carry no data-status and no data-category, and there is
 * no fill of any kind. A table is neutral chrome: the reader's own text
 * colour, a hairline between rows, and muted ink on the headers so they read
 * as labels rather than as data. Selection and hover fills are absent because
 * there is no selection and nothing to hover, which is the same reason a
 * neutral surface never borrows a category or status tint.
 *
 * IT DOES NOT OWN THE NUMBERS. A cell is a ReactNode. A numeric column
 * right-aligns its cells and renders them in tabular figures so a column of
 * numbers lines up on its digits, and it stamps data-opsinjs-value on those
 * cells purely as the tabular-figures hook. The empty string is deliberate:
 * Table never holds a magnitude, so it has none to publish, and the real
 * datum, when there is one, lives in the Value a caller nests in the cell.
 *
 * IT IS A SERVER COMPONENT. No hook, no timer, no handler. The focusable
 * container is tabIndex={0}, a static attribute, so nothing here forces a
 * client boundary.
 */

import type { ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One column. Local on purpose: a consumer names it as
 * TableProps["columns"][number] rather than importing it, which keeps the
 * file at exactly three exports.
 */
interface TableColumn {
  /** Looks up the cell in each row. Distinct across the column list. */
  key: string
  /** The column's header content, rendered as a th with scope="col". */
  header: ReactNode
  /** Explicit alignment. Falls back to end when numeric is set, start otherwise. */
  align?: "start" | "center" | "end"
  /** Right-aligns the column, sets tabular figures and stamps the tabular-figures hook. */
  numeric?: boolean
}

type ColumnAlign = NonNullable<TableColumn["align"]>

/**
 * Horizontal alignment, written out because Tailwind reads class names as
 * literal strings. text-${align} generates no CSS.
 */
const ALIGN_CLASS: Record<ColumnAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
}

/**
 * Dev warnings, keyed by the mistake and never by a per-render value, so a
 * wide table warns once rather than once per row.
 */
const warned = new Set<string>()
function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message) // always starts "[opsinjs] <Table> ..."
}

export interface TableProps {
  /**
   * The caption naming what the table holds. Required, and required for
   * accessibility rather than for looks: a screen reader user who lands on a
   * grid of numbers with no caption has no idea what they count. It renders as
   * a real caption element, and captionHidden can take it off the screen but
   * never out of the markup. A string, so it can serve as the visible or the
   * visually hidden caption text without a second prop.
   */
  caption: string
  /**
   * Take the caption off the screen while leaving it in the accessibility
   * tree, for the twin that sits under a heading already naming the data. It
   * uses the sr-only pattern, so the caption is still present and still read.
   * Default false: a table on its own keeps its caption visible.
   */
  captionHidden?: boolean
  /**
   * The columns, left to right. Each has a stable key, a header node, an
   * optional alignment and an optional numeric flag. A numeric column
   * right-aligns and renders tabular figures. An empty array renders nothing
   * and warns, because a table with no columns is a caller mistake rather than
   * an empty result.
   */
  columns: TableColumn[]
  /**
   * The rows, each a record keyed by column key to the node for that cell. A
   * key with no value renders an empty cell rather than warning, because
   * sparse rows are legitimate. Zero rows renders the header over an empty
   * body; for a genuinely empty result reach for EmptyState instead, which
   * says so in words.
   */
  rows: Array<Record<string, ReactNode>>
  /**
   * Treat the first column as each row's header cell, a th scope="row", so a
   * screen reader names every row by its first cell. Default true, because in
   * a chart twin the first column is the period or the category that
   * identifies the row. Pass false when the first column is data rather than a
   * label, and every cell becomes a plain td.
   */
  rowHeader?: boolean
  /**
   * Merged onto the scroll container with tailwind-merge, and a class you pass
   * wins where the two conflict. This is where a max width or a top and bottom
   * border goes.
   */
  className?: string
}

export function Table({
  caption,
  captionHidden = false,
  columns,
  rows,
  rowHeader = true,
  className,
}: TableProps) {
  if (!Array.isArray(columns) || columns.length === 0) {
    warnDev(
      "empty-columns",
      "[opsinjs] <Table> was given no columns, so nothing was rendered. A table " +
        "with no columns is a caller mistake rather than an empty result; for an " +
        "empty result render EmptyState, which says in words that there is " +
        "nothing to show.",
    )
    return null
  }

  const captionText = typeof caption === "string" ? caption : ""
  if (captionText.trim() === "") {
    warnDev(
      "empty-caption",
      "[opsinjs] <Table> received an empty caption. A caption is required so a " +
        "screen reader user knows what the table counts, and there is no honest " +
        "caption this component can invent for you. It rendered the empty " +
        "caption you passed. Supply one naming the rows and the columns.",
    )
  }

  if (new Set(columns.map((c) => c.key)).size !== columns.length) {
    warnDev(
      "duplicate-column-key",
      "[opsinjs] <Table> was given two columns with the same key. Cells are " +
        "looked up by column key, so one column's data shadows the other and " +
        "the two share a React key. Give every column a distinct key.",
    )
  }

  const resolved = columns.map((column) => {
    const align: ColumnAlign = column.align ?? (column.numeric ? "end" : "start")
    return { column, align }
  })

  return (
    <div
      data-slot="table-container"
      /* The sideways scroll lives here, so a table wider than the screen never
         pushes the page body sideways. It is focusable so a keyboard reader can
         scroll it; it carries no role and no name of its own because the
         caption already names the table, and whether it should be a labelled
         region is an open question on the page. */
      tabIndex={0}
      className={cn(
        "w-full overflow-x-auto",
        "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring",
        className,
      )}
    >
      <table
        data-slot="table"
        className="w-full border-collapse text-opsin-body [color:var(--foreground)]"
      >
        <caption
          data-slot="table-caption"
          className={
            captionHidden
              ? "sr-only"
              : "mb-opsin-2 text-left text-opsin-subheadline [color:var(--foreground)]"
          }
        >
          {caption}
        </caption>
        <thead data-slot="table-header">
          <tr className="border-b border-border">
            {resolved.map(({ column, align }) => (
              <th
                key={column.key}
                data-slot="table-head"
                scope="col"
                className={cn(
                  "px-opsin-3 py-opsin-2 align-bottom text-opsin-footnote font-medium [color:var(--muted-foreground)]",
                  ALIGN_CLASS[align],
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-slot="table-body">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              data-slot="table-row"
              className="border-b border-border last:border-b-0"
            >
              {resolved.map(({ column, align }, columnIndex) => {
                const isRowHeader = rowHeader && columnIndex === 0
                const cellClass = cn(
                  "px-opsin-3 py-opsin-2 align-top",
                  ALIGN_CLASS[align],
                  column.numeric && "tabular-nums",
                  isRowHeader && "font-medium",
                )
                if (isRowHeader) {
                  return (
                    <th
                      key={column.key}
                      data-slot="table-cell"
                      scope="row"
                      className={cn(cellClass, "[color:var(--foreground)]")}
                    >
                      {row[column.key]}
                    </th>
                  )
                }
                return (
                  <td
                    key={column.key}
                    data-slot="table-cell"
                    /* Empty on purpose: the tabular-figures hook, not a datum.
                       Table never owns the magnitude; the real number lives in
                       the Value a caller nests here. Only numeric columns get
                       it. */
                    data-opsinjs-value={column.numeric ? "" : undefined}
                    className={cn(cellClass, "[color:var(--foreground)]")}
                  >
                    {row[column.key]}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * /view renders this with no props and shadcn add ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the one distinction worth
 * seeing: numeric columns right-align in tabular figures while the text first
 * column labels the rows as a th scope="row". It triggers no dev warning,
 * because its caption is non-empty, its columns are non-empty and its keys are
 * unique.
 *
 * The numbers are dimensionless, obviously example placeholders under
 * "Example row" labels, with no unit and no health framing, so nothing here
 * can be mistaken for a reading (ADR 0012).
 */
export default function TableDemo() {
  return (
    <Table
      caption="Example figures, and not a real record of anything"
      columns={[
        { key: "label", header: "Example row" },
        { key: "count", header: "Count", numeric: true },
        { key: "change", header: "Change", numeric: true },
      ]}
      rows={[
        { label: "First example row", count: "1,000", change: "7" },
        { label: "Second example row", count: "128", change: "0" },
        { label: "Third example row", count: "9", change: "1,024" },
      ]}
    />
  )
}
