"use client"

import { Questionnaire } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the one thing
 * worth seeing at a glance: a named set of three fictional questions, each with
 * a control the product supplied, with the progress readout on. Read it in
 * greyscale to confirm the shell is neutral chrome and nothing in it reads as a
 * status.
 *
 * The questions, the options and the copy are invented and generic (ADR 0012).
 * They are deliberately not a real validated instrument, they carry no reading and
 * no score, and no answer is totalled anywhere, because that is the product's to do
 * off this component.
 */
export default function QuestionnaireDemo() {
  return (
    <Questionnaire
      title="Weekly check-in (example)"
      showProgress
      questions={[
        {
          id: "walks",
          prompt: "How often did you go for a walk this week?",
          control: (
            <DemoChoice
              name="questionnaire-demo-walks"
              options={["Rarely", "Sometimes", "Often"]}
            />
          ),
        },
        {
          id: "plan",
          prompt: "How easy was it to keep to your plan?",
          control: (
            <DemoChoice
              name="questionnaire-demo-plan"
              options={["Not easy", "Somewhat", "Very easy"]}
            />
          ),
        },
        {
          id: "note",
          prompt: "Anything you would like to add before your next visit?",
          control: (
            <textarea
              rows={2}
              aria-label="Anything you would like to add before your next visit"
              className="w-full rounded-opsin-md border border-border bg-card p-opsin-2 text-opsin-body [color:var(--foreground)] focus-visible:outline-ring focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)]"
            />
          ),
        },
      ]}
    />
  )
}

/**
 * A synthetic single-choice control for the demo and the examples, standing in for
 * the RadioGroup a product would compose. It is local and unexported: the shell
 * ships no control of its own, and this exists only so `/view` has something to
 * render in a question slot. Each option floors its target at the 44px minimum in
 * rem so it grows with the reader's text size, and carries its own focus ring so a
 * project without the product stylesheet keeps it. The words are plain and carry no
 * reading (ADR 0012).
 */
function DemoChoice({ name, options }: { name: string; options: string[] }) {
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
