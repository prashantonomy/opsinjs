import { GoalRing } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows a reading
 * part-way towards a goal, in the activity category so the fill carries an
 * identity tint. Every number is invented and non-clinical: a step count
 * towards a daily step goal, which is exactly the shape ADR 0012 asks for, a
 * figure nobody could mistake for their own reading, and no reference range,
 * threshold or clinical vocabulary appears anywhere.
 */
export default function GoalRingDemo() {
  return (
    <GoalRing
      label="Steps today"
      value={6200}
      goal={8000}
      unit="steps"
      category="activity"
    />
  )
}
