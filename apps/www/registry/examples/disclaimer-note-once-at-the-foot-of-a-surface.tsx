/**
 * The placement rule, which is the component.
 *
 * ONE NOTE, AT THE FOOT, BELOW EVERYTHING IT QUALIFIES. Three rows on the
 * surface and one note under all three — not one note per row. A screen that
 * seems to need four notes is a screen showing four things that each need
 * explaining, and four identical notes explain none of them: the reader learns
 * by the second one that this block of text is the same block of text, and
 * stops seeing it. This is the failure mode the component exists to prevent,
 * and it is a failure of placement rather than of wording.
 *
 * IT IS BELOW THE CONTENT AND NEVER ABOVE IT. A reader who opened this surface
 * came to see what is on it. A standing statement about the product occupying
 * the position their own information should have is the second failure mode,
 * and the one that turns a note into a banner.
 *
 * THE ROWS CARRY NO NUMBERS, NO UNITS AND NO STATUS PILLS. A card holding a
 * value, a coloured pill and a paragraph is a ResultCard drawn without any of a
 * ResultCard's guarantees, and an example that showed one would teach the
 * mistake those boundaries exist to prevent. The rows here are labels, because
 * what this example is about is where the note goes.
 *
 * THE WORDING IS PLACEHOLDER WORDING AND SAYS SO OF ITSELF. It is not a
 * disclaimer, not a draft of one and not a starting point. opsinjs ships no
 * disclaimer text, for any product, in any jurisdiction; the sentences that
 * belong here are written by whoever is accountable for the product that
 * installs this component.
 */

import { Card } from "@/registry/base-lyra/ui/card"
import { DisclaimerNote } from "@/registry/base-lyra/ui/disclaimer-note"

const ROWS = [
  "First example measurement",
  "Second example measurement",
  "Third example measurement",
]

export default function DisclaimerNoteOnceAtTheFootOfASurface() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      <Card>
        <Card.Header
          title={<h3>Example surface</h3>}
          description="Three things the reader came here to look at."
        />
        <Card.Body>
          <ul className="m-0 flex list-none flex-col gap-opsin-2 p-0">
            {ROWS.map((row) => (
              <li
                key={row}
                className="border-b border-border py-opsin-2 text-opsin-body"
              >
                {row}
              </li>
            ))}
          </ul>
        </Card.Body>

        {/* A direct child of the card rather than a child of the body, because
            it qualifies the whole surface and not the list. `mt-4` is the card's
            own part rhythm written out: `Card.Header`, `Card.Body` and
            `Card.Footer` carry `[&:not(:first-child)]:mt-4` from the card, and
            anything else the card holds has to ask for it by hand.

            IT IS `mt-4` AND NOT `mt-opsin-4`, WHICH ARE NOT THE SAME LENGTH.
            Tailwind's step 4 is four multiples of `--spacing`, which the product
            theme moves with `[data-density]`; `--opsin-space-4` is a fixed 1rem
            that density does not touch. Written the second way the note's
            separation from the list stays put while the card's own parts close
            up or open out around it, which is the one thing this line is here to
            avoid. */}
        <DisclaimerNote placement="footer" className="mt-4">
          Placeholder wording, for layout only. The product that ships this
          surface writes the two sentences that belong here, and opsinjs ships
          none of them.
        </DisclaimerNote>
      </Card>
    </div>
  )
}
