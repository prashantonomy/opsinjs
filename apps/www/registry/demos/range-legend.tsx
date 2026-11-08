import { CLINICAL_STATUS_META, RangeLegend } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the one
 * distinction worth seeing: the neutral reference-range band against two status
 * tones, so the two axes are visibly separate and every status row carries a
 * word, a glyph and a colour together. It renders no bar, because the base file
 * composes no sibling key; the paired examples on the page show the legend
 * beside its bar. The words are fictional and there is not a number anywhere
 * (ADR 0012), so nothing here can be mistaken for a real range, and it triggers
 * no development warning because bands is non-empty and every tone is valid.
 */
export default function RangeLegendDemo() {
  return (
    <div className="w-full max-w-xs">
      <RangeLegend
        aria-label="Range legend"
        bands={[
          {
            label: "The usual range",
            description: "From your laboratory. Most results sit here.",
          },
          {
            label: CLINICAL_STATUS_META.watch.word,
            description:
              "Outside the usual range. Nothing to do before your next reading.",
            tone: "watch",
          },
          {
            label: CLINICAL_STATUS_META.attention.word,
            description:
              "Your care team set this. Contact them about this reading.",
            tone: "attention",
          },
        ]}
      />
    </div>
  )
}
