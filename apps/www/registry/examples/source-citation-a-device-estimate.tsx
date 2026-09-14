/**
 * A device-estimated reading naming its own method.
 *
 * THIS IS RULE 2 OF DATA PROVENANCE, RENDERED. The provenance sits at the value,
 * in the reader's own plain words: the device that produced the estimate, the
 * inputs the estimate is worked out from, and the class of the figure, which is
 * an estimate rather than a measurement. A reader who meets the value alone reads
 * it with the standing of the highest provenance class; the citation under it is
 * what stops that.
 *
 * IT NAMES THE DEVICE, NOT THE MARKETING, AND IT DOES NOT RESTATE AN ACCURACY
 * CLAIM. The source says "your Example Watch", which is a device a reader would
 * recognise, rather than a phrase like "clinically validated technology" that
 * says nothing checkable. The `more` link points at where the fuller accuracy
 * document would live, attributed rather than paraphrased into a stronger claim,
 * which is rule 6. The destination is "#example" and not a real URL or DOI.
 *
 * EVERYTHING HERE IS OBVIOUSLY SYNTHETIC (ADR 0012). The value is a phrase rather
 * than a number, so a screenshot cannot be mistaken for somebody's own reading,
 * the device could belong to no product, and the accuracy destination is a
 * placeholder anchor. opsinjs ships no provenance, no accuracy figure and no
 * date; the product that installs this component writes all three.
 */

import { SourceCitation } from "@/registry/base-lyra/ui/source-citation"

export default function SourceCitationADeviceEstimate() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      {/* A stand-in for the value the citation belongs to. It is a phrase and not
          a number on purpose, so this example renders no reading a person could
          read as their own. The citation is what places that value in the
          device-estimated class at the moment it is read. */}
      <p className="m-0 text-opsin-headline [color:var(--foreground)]">
        Your example resting estimate
      </p>
      <div className="mt-opsin-1">
        <SourceCitation
          source="Estimated by your Example Watch from movement and heart rate. It works this out rather than measuring it, so read it as an estimate."
          more={{
            label: "Read how your Example Watch works this out",
            href: "#example",
          }}
          checkedOn="2026-03-14"
          locale="en-GB"
        />
      </div>
    </div>
  )
}
