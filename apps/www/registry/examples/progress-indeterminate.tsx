/**
 * An indeterminate task: work that is running with no known shape yet, so there
 * is no honest fraction to draw. The value is `null`, the fill spans the track
 * and pulses rather than filling to a guessed amount, and the readout says the
 * work is in progress instead of printing a number. Base UI drops
 * `aria-valuenow`, so a screen reader announces a busy state rather than a
 * false position.
 *
 * The label names a fictional export (ADR 0012). No number here is a reading,
 * because a progress bar counts a task and never a health value.
 */

import { Progress } from "@/registry/base-lyra/ui/progress"

export default function ProgressIndeterminate() {
  return (
    <div className="w-full max-w-sm">
      <Progress label="Preparing your export" value={null} />
    </div>
  )
}
