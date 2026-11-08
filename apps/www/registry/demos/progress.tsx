import { Progress } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the case the
 * component was built for, a task part way through, so the one thing worth
 * seeing at a glance is clear: the fill means "this much is done" and the
 * readout says how much, with no colour asked to carry a level. The label names
 * a fictional upload and the number is synthetic (ADR 0012), because a progress
 * bar counts a task and nothing here is a reading anybody could mistake for
 * their own.
 */
export default function ProgressDemo() {
  return (
    <div className="w-full max-w-sm">
      <Progress label="Uploading photos" value={72} />
    </div>
  )
}
