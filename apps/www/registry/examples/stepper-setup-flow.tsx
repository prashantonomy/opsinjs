import { Stepper } from "@/registry/base-lyra/ui/stepper"

export default function StepperSetupFlow() {
  return (
    <Stepper
      current={2}
      steps={[
        { label: "Create your example account" },
        { label: "Confirm the sample email" },
        { label: "Choose demo preferences" },
        { label: "Add an example contact" },
        { label: "Finish the sample tour" },
      ]}
    />
  )
}
