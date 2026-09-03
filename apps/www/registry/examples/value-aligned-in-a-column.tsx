/**
 * Four readings of one metric, and the two things that make a column of numbers
 * comparable at a glance.
 *
 * ONE PRECISION, EVERY ROW. The precision comes from the measurement, so every
 * reading of the same metric carries the same one — which is why these four
 * line up on their decimal point without any alignment code at all. A column
 * mixing 1000.2 with 1000.17 makes the reader do arithmetic to find out which
 * is larger, and they will do it wrong at a glance.
 *
 * TABULAR FIGURES, so a digit changing does not move the ones beside it. Value
 * sets `tabular-nums` on itself and the product theme sets it again from
 * `[data-opsinjs-value]`, and the belt-and-braces is deliberate: the theme's
 * copy does not travel with `shadcn add`.
 *
 * `text-right` aligns the column. It is on the cell rather than on the value,
 * because alignment is a property of the layout and not of the reading — and
 * because nothing here splits the number from its unit to achieve it. A screen
 * reader still hears one phrase per row.
 */

import { Value } from "@/registry/base-lyra/ui/value"

/* THE DIGITS ARE THE POINT AND THE MAGNITUDES ARE NOT. An alignment demo needs
   numbers of different widths or it demonstrates nothing, so this one has three
   digits, four, four and five — but every one of them is above eight hundred
   kilograms, which is not a person and not a series anybody could read as their
   own. An earlier draft ran from single figures upward, and its first two rows
   were plausible weights for a small child. This file ships as registry source
   under `shadcn add` and is captured as a preview image, which is the case
   ADR 0012 is written about: the number is the part a reader acts on, and it
   travels further than the caption that explains it. */
const READINGS = [
  { when: "Fourth reading", value: 800 },
  { when: "Third reading", value: 1250.5 },
  { when: "Second reading", value: 3000 },
  { when: "First reading", value: 10000.25 },
]

export default function ValueAlignedInAColumn() {
  return (
    /* The scroll container is the table's own rather than the page's. A table
       cannot be laid out narrower than its min-content width, and every cell in
       the right column is an unbreakable run by construction — the no-break
       space inside Value is what holds a number to its unit. At 200% text those
       runs roughly double and the table outgrows `max-w-md`; without this
       wrapper the document scrolls sideways, which is the failure
       `accessibility/text-resizing-and-zoom` names and the one the value page
       claims this design avoids. */
    <div className="w-full overflow-x-auto">
      <table className="w-full max-w-md border-collapse text-opsin-body">
        <caption className="mb-opsin-2 text-left text-opsin-footnote text-muted-foreground">
          Example measurement, in kilograms, to two decimal places. The figures
          are invented and are not anybody&rsquo;s readings.
        </caption>
        <tbody>
          {READINGS.map((reading) => (
            <tr key={reading.when} className="border-b border-border">
              <th
                scope="row"
                className="py-opsin-2 text-left font-normal text-muted-foreground"
              >
                {reading.when}
              </th>
              <td className="py-opsin-2 text-right">
                <Value value={reading.value} unit="kg" precision={2} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
