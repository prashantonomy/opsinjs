/**
 * The exclusion the whole component is built around, shown as a pair.
 *
 * On the left, a row is loading. The label has a placeholder because a label is
 * certain to arrive — every row has one. The value column has NOTHING in it,
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
 * skeleton would have reserved it too — the point is that reserving space and
 * asserting content are two different jobs, and only one of them needs a shape.
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
    <div className="flex min-w-0 grow basis-0 flex-col gap-opsin-2">
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
        {/* The label is certain to arrive, so it gets a placeholder. */}
        <Skeleton shape="line" className="w-2/3" />
        {/* The value is not certain to arrive, so it gets height and no shape. */}
        <div className="min-h-[1.75em]" />
      </Panel>

      <Panel caption="resolved">
        <p className="m-0 text-opsin-footnote text-muted-foreground">
          Example measurement
        </p>
        {/* Words, never `0` and never a dash: an absent reading and a reading of
            zero are different facts about a person. `data-opsinjs-value=""` is
            the empty-string form the attribute takes when the value is null, so
            an absence is as greppable as a number. In a product this seat is the
            Value component, and the attribute comes from it — it is written by
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
