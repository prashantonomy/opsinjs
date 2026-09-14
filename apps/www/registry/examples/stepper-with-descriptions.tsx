import { Stepper } from "@/registry/base-lyra/ui/stepper"

export default function StepperWithDescriptions() {
  return (
    <Stepper
      current={1}
      steps={[
        {
          label: "Sample details",
          description: "Fictional profile fields, nothing here is stored.",
        },
        {
          label: "Example preferences",
          description:
            "How a walkthrough would ask about reminders, using placeholder copy only.",
        },
        {
          label: "Review the sample",
          description: "A read-only summary step in this demo flow.",
        },
      ]}
    />
  )
}
