"use client"

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
 * THE PANEL OPENS ALREADY SCROLLED, AND THAT IS WHAT MAKES THE RESTING FRAME
 * TEACH ANYTHING. A pinned header at a scroll position of zero has only the
 * container's own background behind it, so at rest the blur and the scrim have
 * nothing to work over and the depth reads only from the drop shadow, which is
 * indistinguishable from any other surface. The point of this rung is what the
 * material does over content, so the example opens with a dark row already
 * tucked under the header: the frame the page opens on shows the scrim holding
 * the heading legible over a tone that would otherwise swallow it, before the
 * reader touches anything. Scrolling then moves further rows, light and dark in
 * turn, under the header.
 *
 * WHY THIS FILE IS `"use client"` AND SURFACE IS NOT. Surface answers every
 * state it has with a media or support query, so it renders once on the server
 * and is correct forever, and it stays a server component whatever imports it.
 * The scroll position is not one of those states: there is no CSS that opens a
 * scroll container part-way down, so setting it needs an effect that runs after
 * layout, and a file whose demo runs an effect is a client file whatever its
 * imports say. This sets a scroll offset on mount, never the material, so it is
 * not the flash of the wrong depth the server rule exists to prevent. It has one
 * honest limit worth naming: because the offset is set in an effect, a reader
 * whose browser never runs the script sees the panel at the top of the list
 * rather than opened on the tucked dark row, and so does a plain HTML fetch, a
 * print taken before hydration, or a capture tool that does not execute
 * JavaScript. That reader still gets a correct material on a correct rung; what
 * they lose is only the scrolled resting frame the effect arranges.
 *
 * The scroll container is a labelled tab stop. WebKit does not make an overflow
 * container focusable on its own, and this example asks the reader to scroll,
 * so without `tabIndex` the instruction is one only a mouse or a touchscreen
 * can follow.
 */

import { useEffect, useRef } from "react"

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

/* The row the panel opens with sitting under the header. Its index is odd, so
   it is a dark row, and it is near the top so the reader can still scroll both
   up and down from the resting frame. The offset is measured from where the row
   sits relative to the scroll container rather than computed from a padding sum,
   so it stays correct whatever the type size the preview is set to. */
const RESTING_ROW_INDEX = 1

export default function SurfaceOverScrollingContent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const restingRowRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const scroller = scrollRef.current
    const row = restingRowRef.current
    if (!scroller || !row) return
    /* Open with the dark row behind the header. The header height and a row
       height are the same padding and the same-size text, so aligning the row's
       top to the scroll origin lands the row squarely under the pinned header,
       and the heading is read over a dark backdrop in the resting frame. The
       row's top is measured against the scroll container's own top and not read
       from `offsetTop`. Nothing in this tree is positioned, so `offsetTop` would
       resolve against the document body and return a figure far past this
       container's scroll range; the browser would then clamp it to the maximum,
       every row would land on that same clamped frame, and the chosen row would
       stop mattering. A rect difference stays relative to the container whatever
       is positioned around it. */
    scroller.scrollTop =
      row.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop
  }, [])

  return (
    <div
      ref={scrollRef}
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
            ref={index === RESTING_ROW_INDEX ? restingRowRef : undefined}
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
