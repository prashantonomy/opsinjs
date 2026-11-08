import { Callout } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows all three
 * variants because the one thing worth seeing about this component is that they
 * are one treatment and three glyphs. Greyscale changes nothing about telling
 * them apart, and that is a fact about the source rather than something a
 * control on the documentation site demonstrates: all three resolve the same
 * three tokens, so there is no hue for a filter, a photocopier or a colour
 * vision deficiency to take away.
 *
 * EACH BODY NAMES ITS OWN VARIANT, and that is a rule rather than a
 * coincidence. The glyph is `aria-hidden`, so it reaches nobody who is not
 * looking at it; if the words do not carry the sense of the variant, a
 * non-visual reader has no way to tell a caveat from a note. The component
 * cannot enforce that on a caller's copy, so the demo teaches it instead.
 *
 * Not a number, not a unit, not a reading anywhere in it (ADR 0012). A callout
 * is for something that would still be true if this reader had never opened the
 * app, and the demo copy is written to that test.
 */
export default function CalloutDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
      <Callout title="How this example is put together">
        A note explains the content around it. It is set apart by its box, and
        by nothing else. There is no tint, no level, no claim about anybody.
      </Callout>

      <Callout variant="tip">
        A tip has no title, which is the common case. One short paragraph, next
        to the thing it is about.
      </Callout>

      <Callout variant="caveat" title="What this example leaves out">
        A caveat names a specific, checkable limitation of what is on screen. It
        says how a figure was worked out, or what it does not include.
      </Callout>
    </div>
  )
}
