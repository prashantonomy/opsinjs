import { Surface } from "@opsinjs/react"

/**
 * The three opaque rungs, in ladder order. They are separated from each other
 * only by a hairline edge and a drop shadow, both of which are invisible over
 * the hostile tiles, so the demo shows them on the page colour they are designed
 * to sit on rather than over the backdrop.
 */
const OPAQUE_RUNGS = [
  { rung: "canvas", label: "Canvas", job: "The page itself." },
  { rung: "card", label: "Card", job: "A distinct block of content on the page." },
  { rung: "raised", label: "Raised", job: "Above the page, but not covering it." },
] as const

/**
 * The two translucent content rungs, in ladder order. These make the
 * readability claim, so they are the ones shown over the hostile tiles. `scrim`
 * is handled separately below because it is the one rung that is not a place to
 * put anything.
 */
const TRANSLUCENT_RUNGS = [
  { rung: "sheet", label: "Sheet", job: "Covering the page, which stays recognisable." },
  { rung: "overlay", label: "Overlay", job: "Chrome that content scrolls beneath." },
] as const

/**
 * A backdrop chosen to be hard on a translucent surface rather than kind to it.
 *
 * The order is the point. Every half-row of three tiles and every full row of
 * six carries both the page's darkest tone and its lightest, so a rung passes
 * over both no matter how the cards fall. The grid is six columns rather than
 * four because at `sm:` a card spans half of them: four columns would force
 * each half to be exactly one dark tile beside one light one and push the two
 * mid tones out of the demo, whereas six keeps `bg-primary` and `bg-muted` in
 * the picture while still putting black and white under every rung at both
 * widths. Shorten this array and the pairing goes back to holding only on a
 * phone, which is the defect it was written to close. It is decorative and
 * carries no meaning, which is why it takes surface roles and never a category
 * or status colour: those two axes say what a reading is about and how urgent
 * it is, and neither is available for wallpaper.
 */
const BACKDROP_TILES = [
  "bg-foreground",
  "bg-primary",
  "bg-background",
  "bg-background",
  "bg-muted",
  "bg-foreground",
  "bg-background",
  "bg-muted",
  "bg-foreground",
  "bg-foreground",
  "bg-primary",
  "bg-background",
] as const

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code. It shows the whole ladder in two regions, because
 * the six rungs do not make the same claim and one backdrop cannot demonstrate
 * both. The three opaque rungs are told apart only by a hairline and a shadow,
 * which vanish over black and blue, so they sit on `bg-background`, the page
 * colour they are designed for, where a Card differs from the page by its edge
 * and a Raised by its shadow. The three translucent rungs are the ones whose
 * only claim is that content stays readable over anything, so they keep the
 * deliberately hostile tiles: a rung that holds its floor only over a tasteful
 * photograph fails here in review rather than on somebody's phone.
 *
 * There is not a number anywhere in it. Surface renders no measurement, so
 * there is no reading here for anybody to mistake for their own.
 *
 * Every line of text in it takes the plain foreground role rather than the
 * muted one, and every line is set at body rather than at footnote. Both are
 * deliberate, and both answer the same Don't: this page's own guidance names
 * small grey caption text on a heavily blurred surface, so a demo that obeyed
 * only the colour half of its own rule would be the more persuasive of the two
 * documents. The type token carries its own reason as well. Footnote's
 * published use is provenance, meaning who measured a thing and when, whereas a
 * rung's job is prose a reader reads, which is what body is for.
 */
export default function SurfaceDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-opsin-3">
      {/* Region A: the three opaque rungs on the page colour they are designed
          to sit on. Here a Card is told from the page by its hairline and a
          Raised by its shadow; over the hostile tiles below neither would
          read. */}
      <div className="grid gap-opsin-3 rounded-opsin-lg bg-background p-opsin-4 sm:grid-cols-3">
        {OPAQUE_RUNGS.map((entry) => (
          // Concentric radius: the wrapper is rounded-opsin-lg (21px) with
          // p-opsin-4 (16px) between it and each card, so a card's radius is 21
          // minus 16, which is 5px, floored to the published floor radius-xs
          // (4px). The rule and this shape of arithmetic are in
          // tokens/shape.json rules[2].
          <Surface key={entry.rung} rung={entry.rung} className="rounded-opsin-xs">
            {/* A description list rather than two paragraphs, because that is
                what these are: name/job pairs. Sibling `<p>`s look the same and
                reach a screen reader as unrelated blocks of text, with nothing
                saying which job belongs to which rung. */}
            <dl className="m-0 p-opsin-3">
              <dt className="m-0 text-opsin-headline">{entry.label}</dt>
              <dd className="m-0 text-opsin-body">{entry.job}</dd>
            </dl>
          </Surface>
        ))}
      </div>

      {/* Region B: the three translucent rungs over the deliberately hostile
          tiles, because readability over anything is the only claim they make
          and it is worth nothing demonstrated over a flat grey. */}
      <div className="relative overflow-hidden rounded-opsin-lg">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-6 grid-rows-2"
        >
          {BACKDROP_TILES.map((tone, index) => (
            <div key={`${tone}-${index}`} className={tone} />
          ))}
        </div>

        <div className="relative grid gap-opsin-3 p-opsin-4 sm:grid-cols-2">
          {TRANSLUCENT_RUNGS.map((entry) => (
            <Surface key={entry.rung} rung={entry.rung} className="rounded-opsin-xs">
              <dl className="m-0 p-opsin-3">
                <dt className="m-0 text-opsin-headline">{entry.label}</dt>
                <dd className="m-0 text-opsin-body">{entry.job}</dd>
              </dl>
            </Surface>
          ))}

          {/* The scrim doing its actual job. Its use is to take the page out of
              consideration, so the honest way to show it is with something on a
              rung above it. Never show it with text on the scrim itself. */}
          <Surface rung="scrim" className="rounded-opsin-xs sm:col-span-2">
            {/* This is the one card in the demo with a card nested inside it, so
                at the sm breakpoint it spans the full row rather than sharing
                one, which keeps it from being the narrowest rung in the ladder.
                Its paddings still stack, and the space tokens are rem, so every
                nested level doubles at 200% text. The inset here is p-opsin-1
                and not p-opsin-3 for that reason: kept this tight, the two
                levels that remain, this inset and the dl below, leave the nested
                card's text column about as wide as the other cards' rather than
                collapsing it into a two-word ribbon at the setting this system's
                readers most often use. Two nested levels are still enough to
                show the scrim carrying something on a rung above it. */}
            <div className="p-opsin-1">
              <Surface rung="card" className="rounded-opsin-xs">
                <dl className="m-0 p-opsin-2">
                  <dt className="m-0 text-opsin-headline">Scrim</dt>
                  <dd className="m-0 text-opsin-body">
                    The dimming layer behind a modal. Content sits on a rung
                    above it.
                  </dd>
                </dl>
              </Surface>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
