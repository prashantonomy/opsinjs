import { Stepper } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows a four-step
 * flow with one step complete, one current and two upcoming, which is the one
 * thing worth seeing at a glance: that the three states are told apart by the
 * solid marker and its Check glyph, the heavier ring on the current step, and
 * the faint ring on the ones still to come, without a colour doing the work.
 * Read it in greyscale to check that.
 *
 * The labels name a fictional walkthrough (ADR 0012). No number, no unit and
 * no measurement anybody could mistake for their own reading.
 */
export default function StepperDemo() {
  return (
    <Stepper
      current={1}
      label="Example setup progress"
      steps={[
        { label: "Create your example account" },
        { label: "Confirm the sample email" },
        { label: "Choose demo preferences" },
        { label: "Finish the sample tour" },
      ]}
    />
  )
}
