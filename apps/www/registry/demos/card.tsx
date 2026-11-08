import { Card } from "@opsinjs/react"

/**
 * The content both demo cards show, lifted out so density is the only variable.
 *
 * The finding this answers is that two cards which differ in content as well as
 * in density teach nothing about the prop: a reader cannot tell which of the
 * two changes moved the text. So the header, body and footer live here once and
 * render into both cards below, and the only thing that differs between the two
 * is the `density` prop. The heading stays an `<h3>` the demo supplies, because
 * a card takes its level from the page's outline rather than owning one.
 */
function DemoCardContent() {
  return (
    <>
      <Card.Header
        title={<h3>Example section</h3>}
        description="One supporting line, which stays when the card is tight."
      />
      <Card.Body>
        <p className="m-0 text-opsin-body">
          The body is whatever the card is for. It has no contract of its own,
          which is the point: a card that knew what was inside it would be a
          different component.
        </p>
      </Card.Body>
      <Card.Footer>
        <span className="text-opsin-footnote text-muted-foreground">
          Example metadata
        </span>
      </Card.Footer>
    </>
  )
}

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows one thing worth
 * seeing: the same card, full anatomy and all, at both densities side by side.
 * Nothing else differs between the two cards, so the `density` prop reads as a
 * difference a reader can point at rather than as a percentage described in
 * prose. The shared content is lifted into `DemoCardContent` and rendered into
 * both, which is what keeps density the only variable.
 *
 * There is not a number anywhere in it, and there is no status pill and no
 * category tint (ADR 0012). A Card holding a value, a coloured pill and a
 * paragraph is a ResultCard drawn without any of a ResultCard's guarantees, and
 * a demo that showed one would teach the mistake this component's boundary
 * exists to prevent.
 */
export default function CardDemo() {
  return (
    /* `items-start` rather than the grid's default `align-items: stretch`. The
       two cards are a density comparison, so their difference is height: the
       compact card has less padding and is the shorter of the two. A stretched
       grid item would grow the shorter card to its neighbour's height, filling
       it with empty space and erasing the very difference this demo exists to
       show. Do not swap this for `h-full` on either card: that is the opposite
       instruction, and the `h-full` on the Surface inside Card is a different
       mechanism that stays. */
    <div className="grid w-full max-w-lg items-start gap-opsin-6 sm:grid-cols-2">
      {/* The corner is the layout's decision rather than the card's, which is
          why it rides on `className` and is not a prop. `tokens/shape.json` gives
          `radius-lg` the use "cards on a phone, where the card is nearly the
          width of the screen", and below the `sm` breakpoint this demo is a
          single full-width column, so each card is exactly that case and takes
          `radius-lg`. At `sm` it becomes a two-column grid, each card is no
          longer near the screen's width, and it falls back to Card's own
          `radius-md` default. So the demo models the phone-width rung of the
          ladder rather than silently taking the one radius the component ships.

          The override is important because `cn()` merges through
          `tailwind-merge`, which is not taught the `opsin-radius` scale and so
          keeps both this class and `SHAPE`'s `rounded-opsin-md`. The two then
          reach the element at equal weight, and named radii are emitted in
          alphabetical order, so `md` lands after `lg` and would win by source
          order, leaving a plain `rounded-opsin-lg` inert. The important flag is
          how the caller's radius takes the corner back. The root cause is in
          `lib/utils.ts`. */}
      <Card className="max-sm:rounded-opsin-lg!">
        <DemoCardContent />
      </Card>

      <Card density="compact" className="max-sm:rounded-opsin-lg!">
        <DemoCardContent />
      </Card>
    </div>
  )
}
