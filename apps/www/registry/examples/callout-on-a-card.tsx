/**
 * The same callout on a card, because the fill is the only thing setting it
 * apart and a card is the surface it most often lands on.
 *
 * WHY THIS IS WORTH A PREVIEW RATHER THAN A SENTENCE. Callout is tinted from
 * neither colour axis, so what separates it from the text around it is
 * `bg-muted` against whatever is behind it. On the page that is `bg-background`
 * and the difference is comfortable. On a card it is `bg-card`, which the
 * product theme sets to pure white in the light theme where the page is very
 * slightly off it — so the callout has less to work with, and the boundary is
 * carrying more of the job than it does anywhere else. Neither pair is measured
 * in `lib/generated/contrast.json`, which is why this is a thing to look at
 * rather than a claim to read.
 *
 * The card holds no reading, no unit and no status pill. A card with a value, a
 * coloured pill and a paragraph is a ResultCard drawn without any of a
 * ResultCard's guarantees, and an example that showed one would teach the
 * mistake these boundaries exist to prevent.
 *
 * THE BODY NAMES ITS OWN VARIANT. The glyph is `aria-hidden`, so a reader who
 * is not looking at it gets no signal that this is a tip rather than a note or
 * a caveat. The words are the only carrier that reaches everybody, and this
 * example used to leave that to the lightbulb.
 */

import { Callout } from "@/registry/base-lyra/ui/callout"
import { Card } from "@/registry/base-lyra/ui/card"

export default function CalloutOnACard() {
  return (
    <div className="w-full max-w-(--opsin-measure-tight,45ch)">
      <Card>
        <Card.Header
          title={<h3>How this section is put together</h3>}
          description="One supporting line, above the content it introduces."
        />
        <Card.Body className="flex flex-col gap-opsin-4">
          <p className="m-0 text-opsin-body">
            A card is the ordinary box most of a screen is made of. A callout
            inside one is set apart from the card, not from the page.
          </p>
          <Callout variant="tip">
            A tip is worth trying rather than worth knowing: put the callout
            beside the thing it explains, not at the foot of the screen where
            the reader has already stopped reading.
          </Callout>
        </Card.Body>
      </Card>
    </div>
  )
}
