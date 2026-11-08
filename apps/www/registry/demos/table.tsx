import { Table } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * /view renders this with no props and the component's page shows it, so it is
 * public, reviewed code rather than a scratch demo. It shows the one
 * distinction worth seeing: numeric columns right-align in tabular figures
 * while the text first column labels the rows as a th scope="row". It triggers
 * no dev warning, because its caption is non-empty, its columns are non-empty
 * and its keys are unique.
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
