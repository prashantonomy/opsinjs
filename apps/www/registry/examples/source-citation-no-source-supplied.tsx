/**
 * What the citation does when nobody said where the information came from.
 *
 * THIS IS THE STATE THE COMPONENT EXISTS FOR, and it is the one a product is most
 * likely to ship by accident. Provenance arrives from somewhere else: a data
 * layer, a content table, a flag that says whether the current source has been
 * checked. Every one of those routes can return nothing on a Tuesday afternoon
 * without anybody noticing. A component that rendered empty in that case would
 * pass review, pass every gate in this repository, and put a reading in front of
 * a reader with its provenance silently gone missing, which is exactly the
 * failure rule 2 of data provenance exists to prevent.
 *
 * SO IT PRINTS AN ADMISSION, AND THE ADMISSION IS DELIBERATELY UNLOVELY. The
 * alternative is the one thing this system will not do: invent a source. A
 * citation is a claim about where a number came from, and a design system knows
 * neither the number nor its source. A default line from here would attribute a
 * reading to an instrument the product may not own, and it would arrive looking
 * checked because it came from a library. The line says that something is
 * missing; it does not name a device, a study, a DOI or a date. A development
 * warning names the same thing in the console, so an author working on the screen
 * finds it before a reader does.
 *
 * `DisclaimerNote` refuses in exactly this shape and for exactly this reason, and
 * the two are worth reading together.
 */

import { SourceCitation } from "@/registry/base-lyra/ui/source-citation"

export default function SourceCitationNoSourceSupplied() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      {/* No `source`, which is what `{reading.source}` looks like on the day the
          data layer has none. The component prints its admission and warns in
          development rather than rendering an empty line. */}
      <SourceCitation />
    </div>
  )
}
