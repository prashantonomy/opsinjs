/**
 * Cards inside a translucent layer, and the rule that keeps them readable.
 *
 * `choosing-a-layer` states it as N1: a translucent rung may never contain
 * another translucent rung. The sheet is the layer that blurs the page and
 * leaves it recognisable underneath, and the cards on it stay on the `card`
 * rung, opaque and bounded by a line. Two stacked blurs cost twice as much,
 * composite against each other rather than against the page, and produce a
 * surface whose contrast floor nobody has measured, because the floor is
 * published per rung and not per stack.
 *
 * That is also why a health value never goes above `raised`. A number sitting
 * on the sheet itself would be a number over a moving backdrop; the same
 * number inside one of these cards is over an opaque fill, and the sheet's
 * translucency is doing its real job of telling the reader where they will
 * return to.
 *
 * The backdrop is a grid of the page's own tones rather than a photograph,
 * chosen to be hard on the material rather than kind to it: a light tile and a
 * dark tile meet under the sheet, which is where a blur that only holds over a
 * flattering background gives itself away.
 *
 * The cards take the sheet's corner rather than fighting it. `tokens/shape.json`
 * states the concentricity rule: a card inside a rounded container has a radius
 * of the container's radius minus the padding between them, floored at
 * `radius-xs`. The sheet is `rounded-t-opsin-xl` at 28px and its content is
 * inset by `p-opsin-5` at 20px, so the rule gives the cards max(28 - 20, 4),
 * which is 8px. Each card carries that radius built from `--opsin-radius-xl`
 * minus `--opsin-space-5` rather than typed as a literal 8px, so a corner stays
 * concentric with the sheet's own if either token moves.
 *
 * The radius is marked important. Card sets its own default corner in `SHAPE`,
 * and `cn()` merges class strings through `tailwind-merge`, which is not taught
 * the `opsin-radius` scale and so keeps both the default `rounded-opsin-md` and
 * this override rather than dropping the loser. Both then reach the element at
 * equal weight, and the one the stylesheet emits last wins, which is the
 * default. The important flag is how the caller's radius takes the corner back
 * without reaching into Card. The root cause sits in `lib/utils.ts`.
 */

import { Card } from "@/registry/base-lyra/ui/card"
import { Surface } from "@/registry/base-lyra/ui/surface"

const BACKDROP_TILES = [
  "bg-foreground",
  "bg-background",
  "bg-primary",
  "bg-muted",
  "bg-primary",
  "bg-foreground",
  "bg-background",
  "bg-muted",
]

const SECTIONS = [
  {
    title: "First example section",
    body: "A card on the sheet, opaque, bounded by a line rather than a shadow.",
  },
  {
    title: "Second example section",
    body: "The same rung as the first. Nesting a rung here would be the second blur.",
  },
]

export default function CardOnASheet() {
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-opsin-lg">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-4 grid-rows-2"
      >
        {BACKDROP_TILES.map((tone, index) => (
          <div key={`${tone}-${index}`} className={tone} />
        ))}
      </div>

      {/* One translucent surface, and everything on it is opaque. The count of
          composited translucent layers on this example is exactly one, against
          a budget of three. */}
      <Surface rung="sheet" className="relative mt-opsin-16 rounded-t-opsin-xl">
        <div className="flex flex-col gap-opsin-4 p-opsin-5">
          {SECTIONS.map((section) => (
            <Card
              key={section.title}
              className="rounded-[calc(var(--opsin-radius-xl)-var(--opsin-space-5))]!"
            >
              <Card.Header title={<h3>{section.title}</h3>} />
              <Card.Body>
                <p className="m-0 text-opsin-body">{section.body}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Surface>
    </div>
  )
}
