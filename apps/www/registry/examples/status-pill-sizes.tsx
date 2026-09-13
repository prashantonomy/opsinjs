/**
 * Both sizes, side by side, because the interesting thing about `size` is what
 * it does NOT change.
 *
 * `sm` is visual weight and nothing else. It does not drop the word, it does not
 * drop the icon, and there is no size at which a pill becomes a coloured dot.
 * That is the request this prop exists to refuse. A dot in a dense table is a
 * status carried by colour alone, and the measured CVD audit says that is
 * unreadable for a real share of readers whatever hue it is.
 *
 * If a pill will not fit, the row is too narrow for a status, not too narrow for
 * a word.
 */

import { StatusPill } from "@/registry/base-lyra/ui/status-pill"

export default function StatusPillSizes() {
  return (
    <div className="flex flex-col gap-opsin-4">
      <div className="flex flex-wrap items-center gap-opsin-3">
        <span className="text-opsin-caption1 text-muted-foreground">md</span>
        <StatusPill status="watch" describes="example measurement" />
        <StatusPill status="attention" describes="example measurement" />
      </div>
      <div className="flex flex-wrap items-center gap-opsin-3">
        <span className="text-opsin-caption1 text-muted-foreground">sm</span>
        <StatusPill status="watch" size="sm" describes="example measurement" />
        <StatusPill status="attention" size="sm" describes="example measurement" />
      </div>
    </div>
  )
}
