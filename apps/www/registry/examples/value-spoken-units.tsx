/**
 * What a screen reader is actually given, printed where you can see it.
 *
 * This is the one thing Value does that nothing else in the system does, and it
 * is invisible in a screenshot — so this example makes it visible. Every row
 * renders the same number with a different unit; the left column is what a
 * sighted reader sees and the right column is the phrase a screen reader is
 * handed, read out of the same `tokens/units.json` the component reads.
 *
 * Look at `mmHg`. Left to itself a screen reader spells it, and "em em aitch
 * gee" is not a blood pressure. `%` is the same problem in miniature and `bpm`
 * is the same problem again, and none of the three has a pronunciation anybody
 * could derive — they have to be written down somewhere, once, and that
 * somewhere is a token file rather than twenty component files.
 *
 * The number is the same on every row, and it is 8888 because 8888 is out of
 * scale for every unit in the set: no weight, no concentration, no pressure, no
 * rate, no temperature and no proportion in this table lands anywhere a reader
 * could take for their own. That is the whole reason it is not a smaller,
 * tidier number. A magnitude that is plausible in even one of the six units is
 * a reading, and this file ships as registry source under `shadcn add` and is
 * captured as a preview image that outlives the page it came from — which is
 * exactly the case ADR 0012 is written about. It is also below a thousand on
 * purpose, so the left column and the right column show the same digits with no
 * grouping separator between them to explain.
 *
 * What changes down the column is only the words.
 */

import { spokenUnit } from "@/lib/opsinjs"
import { Value } from "@/registry/base-lyra/ui/value"

/* Every symbol here is in the unit table. A symbol that is NOT in it renders as
   written and is left in the accessibility tree unchanged — awkward to listen
   to, and true — rather than being handed a pronunciation somebody guessed. */
const SYMBOLS = ["kg", "mmol/L", "mmHg", "bpm", "°C", "%"]

const SAMPLE = 8888

export default function ValueSpokenUnits() {
  return (
    /* The scroll container is the table's own rather than the page's. A table
       cannot be laid out narrower than its min-content width, and every cell in
       the left column is an unbreakable run by construction — the no-break space
       inside Value is what holds a number to its unit. At 200% text those runs
       roughly double and the table outgrows `max-w-lg`; without this wrapper the
       document scrolls sideways, which is the failure
       `accessibility/text-resizing-and-zoom` names and the one the value page
       claims this design avoids. */
    <div className="w-full overflow-x-auto">
      <table className="w-full max-w-lg border-collapse text-opsin-body">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="py-opsin-2 text-left font-normal text-muted-foreground"
            >
              What is on the screen
            </th>
            <th
              scope="col"
              className="py-opsin-2 text-left font-normal text-muted-foreground"
            >
              What a screen reader is given
            </th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((symbol) => (
            <tr key={symbol} className="border-b border-border">
              <td className="py-opsin-2">
                <Value value={SAMPLE} unit={symbol} precision={0} />
              </td>
              <td className="py-opsin-2 text-muted-foreground">
                {SAMPLE} {spokenUnit(symbol, SAMPLE)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
