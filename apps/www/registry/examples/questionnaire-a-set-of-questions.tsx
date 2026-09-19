/**
 * A set of questions the product owns, gathered under one title. This is the case
 * the shell was built for: several separate questions that read as one group, each
 * with a control the product composes. The shell renders the controls it is handed,
 * reads no answer from them, and totals nothing, because scoring is the product's
 * to do off this component.
 *
 * The questions, the options and the copy are invented and generic (ADR 0012).
 * They are deliberately not a real validated instrument, and nothing here is scored
 * or interpreted.
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

export default function QuestionnaireASetOfQuestions() {
  return (
    <Questionnaire
      title="Getting-ready check-in (example)"
      questions={[
        {
          id: "sleep",
          prompt: "How rested did you feel this morning?",
          control: (
            <Choice
              name="questionnaire-set-sleep"
              options={["Not much", "Somewhat", "A lot"]}
            />
          ),
        },
        {
          id: "water",
          prompt: "How often did you fill your water bottle today?",
          control: (
            <Choice
              name="questionnaire-set-water"
              options={["Rarely", "Sometimes", "Often"]}
            />
          ),
        },
        {
          id: "note",
          prompt: "Anything you would like your team to know?",
          control: (
            <textarea
              rows={2}
              className="w-full rounded-opsin-md border border-border bg-card p-opsin-2 text-opsin-body [color:var(--foreground)] focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
            />
          ),
        },
      ]}
    />
  )
}
