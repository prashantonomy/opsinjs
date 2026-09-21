/**
 * The whole tone vocabulary in one key.
 *
 * The first row is the neutral reference-range band, and the four below it
 * are the clinical status levels in order. Each status row carries a word, a
 * distinct glyph and a colour together, so the key holds up in greyscale and
 * under a common colour-vision deficiency. No swatch is tinted from the
 * category axis: a legend of range tones is not about which body system a
 * reading belongs to.
 *
 * The words are a product's own plain phrasing for each band, supplied here
 * as an example, because the product owns the ranges those words describe.
 * The tone drives the swatch, the glyph and the data-status the RangeLegend
 * renders for each row, so the canonical level word is carried by the
 * component rather than restated in this example.
 */

import { RangeLegend } from "@/registry/base-lyra/ui/range-legend"

export default function RangeLegendTheFourLevels() {
  return (
    <div className="w-full max-w-xs">
      <RangeLegend
        aria-label="The range tone key"
        bands={[
          {
            label: "The usual range",
            description: "From your laboratory. Most results sit here.",
          },
          {
            label: "In the expected range",
            description: "Where this reading is expected to be.",
            tone: "steady",
          },
          {
            label: "Worth watching",
            description:
              "Outside the usual range. Nothing to do before your next reading.",
            tone: "watch",
          },
          {
            label: "Contact your care team",
            description:
              "Your care team set this. Contact them about this reading.",
            tone: "attention",
          },
          {
            label: "Contact urgent care now",
            description: "Contact your urgent care service now.",
            tone: "urgent",
          },
        ]}
      />
    </div>
  )
}
