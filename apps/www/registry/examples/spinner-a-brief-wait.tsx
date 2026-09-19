/**
 * The canonical pattern, shown in place: a ring beside a visible word, holding a
 * small region that is waiting on a brief action whose result has no known shape.
 * The ring turns while the wait resolves and carries its own hidden name for a
 * screen reader, and the visible "Loading" is the caption a sighted reader reads.
 * Both sit in the muted neutral tone, so the spinner reads as quiet status rather
 * than as a colour on either axis. The words are plain rather than clinical
 * vocabulary, because an opsinjs example must never be mistakable for a reading
 * (ADR 0012).
 */

import { Spinner } from "@/registry/base-lyra/ui/spinner"

export default function SpinnerABriefWait() {
  return (
    <div className="flex w-full max-w-sm items-center justify-center rounded-opsin-lg border border-border px-opsin-6 py-opsin-8 text-muted-foreground">
      <span className="inline-flex items-center gap-opsin-2">
        <Spinner label="Loading" />
        <span className="text-opsin-subheadline">Loading</span>
      </span>
    </div>
  )
}
