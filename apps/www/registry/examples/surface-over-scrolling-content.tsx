/**
 * The `overlay` rung doing the job it is named for.
 *
 * This is the rung most often reached for by mistake, because "overlay" sounds
 * like the thing that covers a page. On this ladder it is not: `overlay` is
 * chrome that content scrolls *beneath*, such as a pinned toolbar, a tab bar
 * and a floating action bar. The rung for a panel that covers the page is
 * `sheet`. The two names swapped meaning between the retired vocabulary and
 * this one, so an example that shows the job rather than the word is worth
 * more than a paragraph about it.
 *
 * It is also the rung whose contrast floor is hardest to hold, because it is
 * the thinnest material in the system and the content underneath is by
 * definition moving. Scroll the panel: the header's blur and its scrim are what
 * keep the heading legible while a light row and a dark row pass under it, and
 * neither is optional.
 *
 * THE ROWS ALTERNATE TONE, AND THAT IS THE EXAMPLE. A scroller of uniformly
 * light rows reviews the material against one backdrop and flatters it.
 * `tokens/material.json` says of this rung that anything on it is measured
 * against the darkest and the lightest backdrop the product can produce, not
 * against the tint alone. The dark rows invert their text rather than keeping
 * it, because a row is content and not wallpaper.
 *
 * The scroll container is a labelled tab stop. WebKit does not make an overflow
 * container focusable on its own, and this example asks the reader to scroll,
 * so without `tabIndex` the instruction is one only a mouse or a touchscreen
 * can follow.
 */

import { Surface } from "@/registry/base-lyra/ui/surface"

/* Deliberately contentless rows. This example is about a material, and a
   screenshot of an opsinjs example must never be mistakable for somebody's
   own readings. There is therefore no number, no unit and no date anywhere in
   it. */
const ROWS = [
  "First example row",
  "Second example row",
  "Third example row",
  "Fourth example row",
  "Fifth example row",
  "Sixth example row",
  "Seventh example row",
  "Eighth example row",
  "Ninth example row",
  "Tenth example row",
]

const HEADING_ID = "surface-over-scrolling-content-heading"

export default function SurfaceOverScrollingContent() {
  return (
    <div
      /* `group` rather than `region`: this is a scrollable box inside a
         preview, not a landmark of the page that embeds it. It takes its name
         from the sticky heading, so a screen-reader user arriving on the tab
         stop hears what they have landed in rather than "scrollable". */
      role="group"
      tabIndex={0}
      aria-labelledby={HEADING_ID}
      className="h-80 w-full max-w-sm overflow-y-auto rounded-opsin-lg border border-border bg-background"
    >
      {/* A direct child of the scroll container, so `top-0` sticks to it rather
          than to the page. `z-10` puts it above the rows; it does not create a
          backdrop root, so the blur still reaches the content passing under. */}
      <Surface rung="overlay" className="sticky top-0 z-10">
        <div className="px-opsin-4 py-opsin-3">
          <h2 id={HEADING_ID} className="m-0 text-opsin-headline">
            Example section
          </h2>
        </div>
      </Surface>

      {/* `role="list"` because `list-none` removes the list role in WebKit, and
          Safari 16.4 is this system's tested floor. Without it a reader loses
          the count and the "n of 10" position that tells them where they are in
          a scroller they have been asked to scroll. */}
      <ul role="list" className="m-0 flex list-none flex-col p-0">
        {ROWS.map((row, index) => (
          <li
            key={row}
            className={
              index % 2 === 0
                ? "border-b border-border px-opsin-4 py-opsin-3 text-opsin-body"
                : "border-b border-border bg-foreground px-opsin-4 py-opsin-3 text-opsin-body text-background"
            }
          >
            {row}
          </li>
        ))}
      </ul>
    </div>
  )
}
