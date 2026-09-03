/**
 * The primary use: a known number of items, arriving at a known size.
 *
 * The rule this demonstrates is the one about announcement. There are three
 * rows, nine Skeleton roots and twelve placeholder blocks here, and between
 * them they say nothing to a screen reader — every Skeleton root is
 * `aria-hidden`. The single polite message belongs to the REGION, is mounted by
 * this file rather than by the component, and says once what nine skeletons
 * would otherwise say nine times.
 *
 * `aria-busy` marks the list rather than the whole section, and the message
 * sits OUTSIDE it. That ordering is load-bearing: `aria-busy="true"` tells
 * assistive technology to hold off on the subtree beneath it, which includes
 * holding off on a live region inside it, so a status message placed within the
 * busy element is the one message the reader does not get.
 *
 * WHAT THIS EXAMPLE DOES NOT DEMONSTRATE. It is static, so it is always
 * loading: nothing ever clears `aria-busy`, and the message and its region
 * arrive together in the first paint rather than being inserted when the
 * request starts. A live region reports MUTATIONS, so a screen reader meeting
 * this page reads the message in reading order rather than announcing it on
 * arrival. In a real implementation the region is on the surface before the
 * request begins and the message is written into it when loading starts, which
 * is the case that announces. Nobody has run a screen reader against either,
 * and the component page says so rather than claiming it.
 *
 * Every skeleton here carries `appearAfterMs`, which is the other half of the
 * pattern and the half that gets left out. A list that comes back from a warm
 * cache in eighty milliseconds should never have shown a placeholder at all;
 * the delay is what turns "always flashes" into "only appears when there is
 * actually a wait", and it costs nothing because it is an `animation-delay`
 * rather than a timer.
 *
 * The rows carry no numbers and no units. A screenshot of an opsinjs example
 * must never be mistakable for somebody's result — which is also why the
 * placeholder for each row's second line is a text bar and not a short block
 * where a reading would sit.
 */

import { Skeleton } from "@/registry/base-lyra/ui/skeleton"

const ROWS = ["first", "second", "third"]

/* This example's own choice, and nothing more. `foundations/data-states` names
   a floor — below roughly a tenth of a second a skeleton is worse than nothing,
   because the flash reads as a glitch — and then says the number itself is a
   product decision. This is one, made for a list of three rows, not a figure
   opsinjs holds: opsinjs owns no thresholds of any kind. Pick your own from
   what the request actually costs. */
const APPEAR_AFTER_MS = 200

export default function SkeletonALoadingList() {
  return (
    <section className="flex w-full max-w-md flex-col gap-opsin-4">
      {/* One message for the whole region, polite, and never one per row. It is
          `sr-only` because a sighted reader already has the answer: the shapes
          are the answer. It is a SIBLING of the busy list rather than a child of
          it, because a live region inside an `aria-busy` element is suppressed
          for as long as the element stays busy. */}
      <p role="status" className="sr-only">
        Loading example items
      </p>

      {/* The part that is still settling. A reader who arrives mid-load is not
          walked through a list of nothing; when the content lands, the product
          clears this. */}
      <div aria-busy="true" className="flex flex-col gap-opsin-4">
        {ROWS.map((row) => (
          <div
            key={row}
            className="flex items-start gap-opsin-3 border-b border-border pb-opsin-3"
          >
            {/* The avatar's seat. It is a circle because a circle is coming,
                and for no other reason — a shape chosen to fill space rather
                than to match what lands is where the layout shift comes back. */}
            <Skeleton
              shape="circle"
              appearAfterMs={APPEAR_AFTER_MS}
              className="shrink-0"
            />
            <div className="flex min-w-0 grow flex-col gap-opsin-2">
              {/* The title: one line, full width, never shortened. */}
              <Skeleton
                shape="line"
                appearAfterMs={APPEAR_AFTER_MS}
                className="w-1/2"
              />
              {/* The description: two lines of body text, the last one short.
                  The reservation is two lines exactly where the row is at the
                  body step; this row inherits whatever the surrounding surface
                  sets, so put `text-opsin-body` on the row when the reservation
                  has to be exact. */}
              <Skeleton shape="text" lines={2} appearAfterMs={APPEAR_AFTER_MS} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
