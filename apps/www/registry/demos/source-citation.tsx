import { SourceCitation } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the citation
 * carrying everything it can hold: the plain-words provenance of a device
 * estimate, the link to the fuller source, and the date it was last checked.
 *
 * THE PROVENANCE IS OBVIOUSLY SYNTHETIC AND SAYS SO OF ITSELF (ADR 0012). It
 * names a device that could belong to no product, "your Example Watch", and the
 * link points at "#example" rather than a real DOI or URL, so a reader who
 * screenshots this has screenshotted nothing quotable and a developer who copies
 * it has copied nothing usable. No real citation, no real accuracy figure, no
 * real study. The demo passes a locale so the date formats in one language and
 * the demo renders warning-free, which is the standard ADR 0009 holds it to; the
 * missing-source case, which is what a product is most likely to ship by
 * accident, is shown in its own example rather than here.
 */
export default function SourceCitationDemo() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      <SourceCitation
        source="Estimated by your Example Watch from movement and heart rate, so read it as an estimate rather than an exact measure."
        more={{
          label: "Read how this example estimate is worked out",
          href: "#example",
        }}
        checkedOn="2026-03-14"
        locale="en-GB"
      />
    </div>
  )
}
