/**
 * The case the bar was built for: a task part of the way through. The fill
 * shows how much of a fictional upload is done and the readout says the same
 * amount in words, so a reader who cannot use the fill still learns the figure.
 *
 * Nothing here is a reading (ADR 0012). A progress bar counts a task, so the
 * label names an upload and the number is a count of that task rather than
 * anybody's health value, which a progress bar must never carry.
 */

import { Progress } from "@/registry/base-lyra/ui/progress"

export default function ProgressATaskCompleting() {
  return (
    <div className="w-full max-w-sm">
      <Progress label="Uploading 3 photos" value={45} />
    </div>
  )
}
