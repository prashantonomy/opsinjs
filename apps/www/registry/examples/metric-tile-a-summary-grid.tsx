/**
 * Six tiles in a grid, which is the arrangement this component exists for and
 * the arrangement that shows what it refuses to do.
 *
 * WHAT THE COLOUR IS ANSWERING. Every tint here is category. That is what the
 * reading is about, so a reader scanning six can find the sleep one
 * without reading six labels. Not one tile is filled from the status axis, and
 * that is the rule the grid makes visible: six tiles tinted by urgency would
 * be a heat map of somebody's body, unreadable at exactly the moment it
 * matters most. In greyscale every tint here collapses and not one fact goes
 * with it, which is the test a category tint has to pass.
 *
 * ONE VERDICT, IN A PILL. Exactly one tile carries a status, and it carries it
 * as a StatusPill with the word in it. It is not a fill, not a coloured edge,
 * not a dot. The other five are silent about urgency because the product
 * that owns these readings has said nothing about them, and a tile that filled
 * that silence with a reassuring level would be inventing one.
 *
 * EVERY TILE LEADS SOMEWHERE. A tile has no room to explain itself, so a reader
 * who glances at a number and wonders what it means has to be able to open it.
 * All six are links, the whole tile is the target, and nothing is nested inside
 * one. The pill is a span, and there is no second control.
 *
 * NO TILE CARRIES A STALENESS NUMBER. `staleAfterHours` is absent from all six,
 * so none of them shows a stale treatment: these tiles have been told nothing
 * about when their measurements go out of date, and they say nothing. No
 * preview opsinjs ships supplies that number, because opsinjs holds none, and
 * the muted state it would produce is described on the component's page only.
 *
 * The readings are fictional, in a unit nobody holds a reference range for, and
 * every timestamp is fixed so the grid says the same thing every time it is
 * built.
 */

import { type ClinicalStatus, type HealthCategory } from "@/lib/opsinjs"
import { MetricTile } from "@/registry/base-lyra/ui/metric-tile"

/** The instant the whole screen is measured against. Read once, passed to six. */
const NOW = "2026-04-06T09:00:00+00:00"

interface ExampleTile {
  label: string
  value: number | null
  category: HealthCategory
  at: string
  status?: ClinicalStatus
}

const TILES: ExampleTile[] = [
  {
    label: "First example measurement",
    value: 10,
    category: "sleep",
    at: "2026-04-06T07:15:00+00:00",
  },
  {
    label: "Second example measurement",
    value: 12,
    category: "heart",
    at: "2026-04-06T07:20:00+00:00",
  },
  {
    label: "Third example measurement",
    value: 14,
    category: "activity",
    at: "2026-04-06T07:25:00+00:00",
    status: "attention",
  },
  {
    label: "Fourth example measurement",
    value: 16,
    category: "nutrition",
    at: "2026-04-05T19:40:00+00:00",
  },
  {
    label: "Fifth example measurement",
    value: 18,
    category: "mind",
    at: "2026-04-05T21:05:00+00:00",
  },
  {
    label: "Sixth example measurement",
    value: null,
    category: "labs",
    at: "2026-04-04T11:00:00+00:00",
  },
]

export default function MetricTileASummaryGrid() {
  return (
    /* The gap is the tiles' separation, and it belongs to the grid rather than
       to the component: a tile cannot see what is beside it. The column count
       follows the viewport and not the reader's text size. Tailwind's
       breakpoints are `rem` inside a media query, and `rem` there resolves
       against the document's initial font size rather than the root's computed
       one, so the docs harness's own 200% control leaves this at three columns
       with the type doubled. Whether a tile survives that has not been
       observed; the component's page lists it among the things nobody has
       checked. A grid that must reflow with the text rather than with the
       window wants a container query, which does respond to its own font
       size. */
    <div className="grid w-full gap-opsin-2 sm:grid-cols-2 lg:grid-cols-3">
      {TILES.map((tile) => (
        <MetricTile
          key={tile.label}
          label={tile.label}
          value={tile.value}
          unit="steps"
          precision={0}
          category={tile.category}
          status={tile.status}
          measuredAt={tile.at}
          now={NOW}
          locale="en-GB"
          href="#example"
        />
      ))}
    </div>
  )
}
