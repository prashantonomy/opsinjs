/**
 * The two sizes side by side. `sm` is a ring beside a line of text, `md` is a
 * ring that anchors a small in-place wait on its own. Both are sized in `em`, so
 * each grows with the surrounding text rather than pinning at a fixed size, and
 * both draw in the muted neutral tone: read in greyscale, they are two quiet
 * rings and neither carries a colour on either axis. Each names its own wait for
 * a screen reader through the required `label` (ADR 0012, plain words only).
 */

import { Spinner } from "@/registry/base-lyra/ui/spinner"

export default function SpinnerTwoSizes() {
  return (
    <div className="flex items-center gap-opsin-4 text-muted-foreground">
      <Spinner label="Loading" size="sm" />
      <Spinner label="Loading" size="md" />
    </div>
  )
}
