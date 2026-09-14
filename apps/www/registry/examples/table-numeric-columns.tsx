/**
 * Numeric columns right-align in tabular figures while the first column
 * labels each row as its th scope="row".
 *
 * The number cells nest Value, which is how a real deployment formats a
 * figure: Table owns the grid, the scope and the alignment, and Value owns
 * the rounding, the unit and the spoken form. The change column is
 * dimensionless, so its Value takes unit={null} and raises no missing-unit
 * warning.
 *
 * The magnitudes are deliberately over 800 kg, well past anything a reader
 * could take for their own weight, so nothing here reads as a real
 * measurement (ADR 0012).
 */
import { Table } from "@/registry/base-lyra/ui/table"
import { Value } from "@/registry/base-lyra/ui/value"

export default function TableNumericColumns() {
  return (
    <Table
      caption="Example readings by row, and not a real record of anyone's"
      columns={[
        { key: "row", header: "Example row" },
        { key: "reading", header: "Reading", numeric: true },
        { key: "change", header: "Change", numeric: true },
      ]}
      rows={[
        {
          row: "First example row",
          reading: <Value value={1000.2} unit="kg" precision={1} />,
          change: <Value value={7} unit={null} precision={0} />,
        },
        {
          row: "Second example row",
          reading: <Value value={903.4} unit="kg" precision={1} />,
          change: <Value value={1024} unit={null} precision={0} />,
        },
        {
          row: "Third example row",
          reading: <Value value={888.0} unit="kg" precision={1} />,
          change: <Value value={128} unit={null} precision={0} />,
        },
      ]}
    />
  )
}
