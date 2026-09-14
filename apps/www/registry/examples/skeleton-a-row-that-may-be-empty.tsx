/**
 * The exclusion the whole component is built around, shown as a pair.
 *
 * On the left, a row is loading. The label has a placeholder because a label is
 * certain to arrive. Every row has one. The value column has NOTHING in it,
 * only reserved height, because whether a reading exists is the question the
 * request is being made to answer.
 *
 * On the right is one of the answers, and it is the answer that catches
 * products out: there is no reading. Because the loading state drew no block
 * where the number goes, nothing was promised and nothing is taken away. Put a
 * rounded rectangle in that column and the same resolution reads as a failure
 * of the app rather than as an absence in the data.
 *
 * The height of the value column is reserved with `min-h`, in `em`, so it holds
 * the same space at 200% text that the resolved row will take at 200% text. A
 * skeleton would have reserved it too. The point is that reserving space and
 * asserting content are two different jobs, and only one of them needs a shape.
 *
 * The precondition that reservation rests on: `em` reserves the same space only
 * when both seats sit at the same type step, because `em` is whatever font size
 * is in force. So the loading panel carries the steps the resolved panel
 * carries, the label at `footnote` and the value seat at `headline`, and a
 * reader copying this example copies those steps too. Drop them and the two
 * columns are the same height only by accident, until the width or the step
 * changes and they drift.
 *
 * WHAT THIS EXAMPLE LEAVES OUT, DELIBERATELY. It is a side-by-side of two
 * moments rather than a loading surface, so it mounts no `role="status"` and no
 * `aria-busy`, and a screen reader meeting it hears only the two captions. That
 * is a limit of the demonstration, not the pattern: a real implementation still
 * owes the region around a loading state the one polite message, which is what
 * `skeleton-a-loading-list` shows. Read the two together.
 */

import type { ReactNode } from "react"

import { Skeleton } from "@/registry/base-lyra/ui/skeleton"

function Panel({
  caption,
  children,
}: {
  caption: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 basis-full flex-col gap-opsin-2 sm:grow sm:basis-0">
      <p className="m-0 font-mono text-opsin-caption1 text-muted-foreground">
        {caption}
      </p>
      <div className="flex flex-col gap-opsin-1 rounded-opsin-md border border-border bg-card p-opsin-4">
        {children}
      </div>
    </div>
  )
}

export default function SkeletonARowThatMayBeEmpty() {
  return (
    <div className="flex w-full max-w-lg flex-wrap gap-opsin-4">
      <Panel caption="loading">
        {/* The label is certain to arrive, so it gets a placeholder. The step
            goes on the root because the bar is `1em` of the font size it
            inherits, and the root is what the caller can reach: this is the
            repair the component's own JSDoc asks the caller to make, so that the
            bar and the resolved label are the same line. */}
        <Skeleton shape="line" className="w-2/3 text-opsin-footnote" />
        {/* The value is not certain to arrive, so it gets height and no shape.
            The step matches the resolved seat so the identical `1.75em`
            reservation resolves against the identical font size on both sides. */}
        <div className="min-h-[1.75em] text-opsin-headline" />
      </Panel>

      <Panel caption="resolved">
        <p className="m-0 text-opsin-footnote text-muted-foreground">
          Example measurement
        </p>
        {/* Words, never `0` and never a dash: an absent reading and a reading of
            zero are different facts about a person. `data-opsinjs-value=""` is
            the empty-string form the attribute takes when the value is null, so
            an absence is as greppable as a number. In a product this seat is the
            Value component, and the attribute comes from it. It is written by
            hand here only because this example is about the SHAPE of the seat
            and imports nothing but Skeleton. */}
        <p
          data-opsinjs-value=""
          className="m-0 min-h-[1.75em] text-opsin-headline"
        >
          No reading yet
        </p>
      </Panel>
    </div>
  )
}
