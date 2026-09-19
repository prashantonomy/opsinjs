/**
 * The two neutral weights side by side. `soft` is a filled muted chip and
 * `outline` is a hairline chip, and the thing worth checking is that neither
 * carries a colour from either axis: read in greyscale, both are quiet chrome
 * and neither competes with a status. The labels are plain words rather than
 * clinical vocabulary (ADR 0012).
 */

import { Badge } from "@/registry/base-lyra/ui/badge"

export default function BadgeTheTwoWeights() {
  return (
    <div className="flex items-center gap-opsin-4">
      <Badge>Soft</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}
