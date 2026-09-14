/**
 * Two vertical dividers separating three inline labels in a flex row. The
 * rules draw only because the flex `items-center` row gives them a cross-axis
 * height; there is no number anywhere so nothing reads as a reading
 * (ADR 0012).
 */

import { Divider } from "@/registry/base-lyra/ui/divider"

export default function DividerVerticalBetweenInlineFacts() {
  return (
    <div className="flex items-center gap-opsin-3 text-opsin-footnote [color:var(--muted-foreground)]">
      <span>Example label</span>
      <Divider orientation="vertical" />
      <span>Another label</span>
      <Divider orientation="vertical" />
      <span>A third label</span>
    </div>
  )
}
