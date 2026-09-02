/**
 * The whole card as one link, which is the only interactive shape a Card has.
 *
 * Three things are worth watching here, and none of them is visible in a
 * screenshot. Tab through: each card is ONE stop, not one per line, because the
 * card is a single control rather than a container full of them. Hover: the
 * title underlines, because a whole-card link with no affordance on its text
 * leaves a reader guessing which part of it is the link — the underline comes
 * from the root's `group` class and needs no prop. Focus: the ring is drawn
 * around the card's own corner, outside the material, so it stays visible on
 * every rung.
 *
 * The accessible name of a link card is its whole text content — Card sets no
 * `aria-label`, because it cannot know which part of a card is its name, and a
 * label that does not begin with the visible text breaks voice control. That is
 * why both lines in each card here are short: everything inside the link is
 * read out as the link.
 *
 * The rule this example exists to demonstrate by omission: there is not a
 * button inside any of these. A card that is a link may hold no other
 * interactive element. A reader cannot tell what tapping the gap between two
 * buttons will do, and a keyboard user reaches a control nested inside a
 * control — which is a DOM the browser is entitled to flatten in whatever way
 * it likes. If a card needs two actions, it is not a link.
 *
 * The rung is `raised` rather than the default `card`, following the decision
 * table on `choosing-a-layer`: a tappable card is an object, and an object may
 * look lifted. A card that is not tappable stays on the `card` rung, where
 * nothing is lifted and nothing looks it.
 */

import { Card } from "@/registry/base-lyra/ui/card"

/* Fictional sections with no readings in them. A screenshot of an opsinjs
   example must never be mistakable for somebody's own result, so there is no
   number, no unit and no date anywhere in this file. */
const SECTIONS = [
  {
    title: "First example section",
    description: "What the reader will find after they tap it.",
    href: "#first-example-section",
  },
  {
    title: "Second example section",
    description: "One line, and it stays one line at the compact density.",
    href: "#second-example-section",
  },
]

export default function CardAsALink() {
  return (
    <ul className="m-0 flex w-full max-w-sm list-none flex-col gap-opsin-4 p-0">
      {SECTIONS.map((section) => (
        <li key={section.href}>
          <Card rung="raised" href={section.href}>
            <Card.Header
              title={<h3>{section.title}</h3>}
              description={section.description}
            />
          </Card>
        </li>
      ))}
    </ul>
  )
}
