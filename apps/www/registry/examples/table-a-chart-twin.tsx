/**
 * The accessible twin of a chart.
 *
 * A visible figcaption above names the data for the eye, and the table's own
 * caption stays in the DOM while captionHidden takes it off the screen, so a
 * screen reader still meets a caption naming the data even though the eye
 * meets the figcaption first. The comment marks where a real chart would sit;
 * this example draws only the table, because the table is the part this
 * registry entry demonstrates.
 *
 * The numbers are dimensionless example placeholders under "Period" labels,
 * with no unit and no health framing, so nothing here can be mistaken for a
 * reading (ADR 0012).
 */
import { Table } from "@/registry/base-lyra/ui/table"

export default function TableAChartTwin() {
  return (
    <figure className="m-0 flex w-full max-w-md flex-col gap-opsin-2">
      <figcaption className="text-opsin-subheadline [color:var(--foreground)]">
        Example series, and not a real record
      </figcaption>
      {/* The chart sits here in a real surface; this table is its readable twin. */}
      <Table
        captionHidden
        caption="Example series by period, the readable twin of the chart above, showing an example count for each period"
        columns={[
          { key: "period", header: "Period" },
          { key: "count", header: "Count", numeric: true },
        ]}
        rows={[
          { period: "Period one", count: "12" },
          { period: "Period two", count: "1,000" },
          { period: "Period three", count: "8" },
        ]}
      />
    </figure>
  )
}
