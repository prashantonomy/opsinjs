/**
 * The same shell with its progress readout on. `showProgress` draws a "Question N
 * of M" line above the list that names where the reader is as focus moves through
 * the questions. Move focus into the second question and the readout reads
 * "Question 2 of 3". The count is a plain ordinal of position in the list, never a
 * health value, so it is drawn as quiet text and never coloured.
 *
 * The questions and options are invented and generic (ADR 0012). Nothing here is a
 * real validated instrument, and nothing is scored.
 */

import { Questionnaire } from "@/registry/base-lyra/ui/questionnaire"

function Choice({ name, options }: { name: string; options: string[] }) {
  return (
    <div role="radiogroup" className="flex flex-col gap-opsin-1">
      {options.map((option) => (
        <label
          key={option}
          className="inline-flex min-h-(--opsin-target-minimum,2.75rem) cursor-pointer items-center gap-opsin-2 text-opsin-body [color:var(--foreground)]"
        >
          <input
            type="radio"
            name={name}
            value={option}
            className="size-[1em] focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
          />
          {option}
        </label>
      ))}
    </div>
  )
}

export default function QuestionnaireShowingProgress() {
  return (
    <Questionnaire
      title="Weekly reflection (example)"
      showProgress
      questions={[
        {
          id: "walks",
          prompt: "How often did you take a short walk this week?",
          control: (
            <Choice
              name="questionnaire-progress-walks"
              options={["Rarely", "Sometimes", "Often"]}
            />
          ),
        },
        {
          id: "plan",
          prompt: "How easy was it to keep to your plan?",
          control: (
            <Choice
              name="questionnaire-progress-plan"
              options={["Not easy", "Somewhat", "Very easy"]}
            />
          ),
        },
        {
          id: "mood",
          prompt: "How would you describe your week overall?",
          control: (
            <Choice
              name="questionnaire-progress-mood"
              options={["Quiet", "Mixed", "Busy"]}
            />
          ),
        },
      ]}
    />
  )
}
