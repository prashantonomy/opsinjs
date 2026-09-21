"use client"

/**
 * Questionnaire is the styled shell around a set of questions a product owns. It
 * groups them, gives the group one accessible name, shows the reader where they
 * are in it, and tells the product when the reader has reached the end. It scores
 * nothing, interprets nothing, and ships no question of its own.
 *
 * WHY THE ROSTER DECLINED IT, AND WHY THAT SHAPES EVERY LINE. The name was kept
 * off the roster because a validated instrument is licensed, worded, scored and
 * interpreted by its publisher, and a component that rendered one would invite a
 * product to edit its wording or its scoring, which is a clinical-safety problem
 * rather than an API one. This build answers that by owning none of it. The
 * component holds no instrument, no question text, no options, no score, no band
 * and no interpretation. Every question, every control and every word of a result
 * arrives from the product through props, and the product does its own scoring off
 * this component, where opsinjs cannot reach it. What is left is a container: a
 * form, a title, a progress readout, and a list of question slots the product
 * fills. That is the whole component, and the smallness is the point.
 *
 * IT RENDERS THE CONTROLS IT IS HANDED AND BUILDS NONE. Each question carries a
 * `control`, which is a React node the product composes from whatever single
 * input the question needs: a Field, a RadioGroup, a ScaleInput, a Textarea. The
 * shell never reaches inside that node, never reads its value and never knows what
 * the answer was. So it cannot total the answers and it cannot grade them, which
 * is exactly the guarantee the roster asked for: there is no code path here that
 * could turn a set of answers into a verdict.
 *
 * IT IS A CLIENT COMPONENT FOR ONE REASON. The progress readout says which
 * question the reader is on, "Question 2 of 3", and to know that the shell tracks
 * a current index as focus moves through the list. That single piece of state is
 * why the file carries the client directive. The index is a plain ordinal count of
 * position in the list. It is not a health value, it is not a score, and it is
 * never coloured or dressed as one. A questionnaire with `showProgress` off tracks
 * the index still, so a product can turn the readout on without a remount, and the
 * cost is one integer.
 *
 * IT OWNS THE SUBMIT EVENT SO A STRAY RETURN KEY CANNOT NAVIGATE. The root is a
 * real `<form>`, and a form with no action that receives a submit reloads the page,
 * which on a half-answered questionnaire loses the reader's work. So the shell
 * always intercepts submit, cancels the default, and calls `onComplete` when the
 * product passed one. The product places its own submit control among the question
 * controls, and pressing it, or pressing Return in a text field, is what completes
 * the set. `onComplete` is told that the reader finished and nothing more: no
 * answers, no total, no reading. What happens next belongs to the product.
 *
 * NEITHER COLOUR AXIS. A questionnaire states no clinical level and names no
 * category of measurement, so it carries neither `data-status` nor `data-category`
 * and draws only neutral chrome. Colour that arrives through `className`, or inside
 * a product's own control, is the product's to keep off both axes; the shell adds
 * none. A result the product computes from the answers is the product's surface to
 * build with the status components, well away from this container.
 */

import { useId, useState, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One question in the set. Kept as a local type rather than a fourth public
 * export, for the reason `badge.tsx` gives about its own variant union: the
 * registry contract fixes this file at three public exports, so a consumer names
 * this shape as `QuestionnaireProps["questions"][number]` rather than importing a
 * fourth symbol.
 */
interface QuestionnaireQuestion {
  /**
   * A stable identifier for the question, unique within the set. It keys the list
   * and is the product's handle on the question. It is never shown to the reader
   * and never scored.
   */
  id: string
  /**
   * The question as the reader reads it, in the product's own words. A string, or
   * a richer node when the product needs a link or emphasis inside it. The shell
   * shows it and reads it to assistive technology; it never edits it.
   */
  prompt: ReactNode
  /**
   * The answer control, composed by the product. This is where a Field, a
   * RadioGroup, a ScaleInput or a Textarea goes. The shell renders it untouched,
   * reads no value from it, and reaches no verdict about the answer.
   */
  control: ReactNode
}

/**
 * The root form, spelled once. A column of the title, the progress readout and the
 * question list, with the space between them from the space scale so the whole
 * group grows with the reader's text size. It sets no surface and no colour beyond
 * the neutral ink, so it drops into a card or a page without claiming either axis.
 */
const ROOT = "flex flex-col gap-opsin-5 [color:var(--foreground)]"

/** The questionnaire's name, at the title step, in the neutral ink. */
const TITLE = "m-0 text-opsin-title3 font-semibold [color:var(--foreground)]"

/**
 * The progress readout. A quiet footnote in the muted ink, so it orients the
 * reader without competing with the questions. It is a plain ordinal count of
 * position, never a health value, so it takes no status colour and no emphasis a
 * reading would earn.
 */
const PROGRESS = "m-0 text-opsin-footnote [color:var(--muted-foreground)]"

/** The list of questions, an ordered list with its own bullets stripped. */
const LIST = "m-0 flex list-none flex-col gap-opsin-5 p-0"

/**
 * One question, spelled once. A list item that stacks its prompt over its control
 * with a hairline above it, so the set reads as a sequence of separated steps
 * rather than one dense block. The first item drops the rule and the padding it
 * pays for, so the list does not open on a stray line.
 */
const QUESTION =
  "flex flex-col gap-opsin-2 border-t border-border pt-opsin-5 " +
  "first:border-t-0 first:pt-0"

/** The prompt, at the body step in the neutral ink. */
const PROMPT = "text-opsin-body font-medium [color:var(--foreground)]"

/**
 * The control wrapper, which is also the per-question group. It sets spacing only
 * and no colour, so the product's own control keeps its look. It carries
 * `role="group"` and is named by the prompt through `aria-labelledby`, so a
 * screen-reader user hears which question a control belongs to even when the
 * control the product passed carries no accessible name of its own.
 */
const CONTROL = "flex flex-col gap-opsin-2"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a consumer
 * makes with the clinical API, and a questionnaire shell asserts nothing clinical.
 * `badge.tsx` and `segmented-control.tsx` keep the same small set for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface QuestionnaireProps {
  /**
   * The questionnaire's name, in the product's own words. Supplied as the group's
   * accessible name and shown as the title, so a screen-reader user hears what the
   * set is before its first question. Optional, because a product may name the set
   * in the surrounding page instead; when it is omitted the form carries no name of
   * its own, and a development warning suggests supplying one.
   */
  title?: string
  /**
   * The questions, in the order they are asked. Each is an id, a prompt and a
   * control the product composes. The shell renders them as a list and never reads
   * an answer from a control, so it can neither total nor grade them. An empty
   * array renders nothing and warns in development, because a questionnaire with no
   * questions is a shell around nothing.
   */
  questions: QuestionnaireQuestion[]
  /**
   * Called when the reader completes the set, which is when the form is submitted.
   * It is told that the reader finished and nothing else: no answers, no total and
   * no reading, because the shell scores nothing. The product reads its own
   * controls and does its own scoring off this component. Omitted, submit is still
   * cancelled so a stray Return key cannot reload the page.
   */
  onComplete?: () => void
  /**
   * Shows a "Question N of M" readout above the list that names where the reader is
   * as focus moves through the questions. It is a plain ordinal count of position,
   * not a health value, so it is drawn as quiet text and never coloured. Defaults
   * to `false`.
   */
  showProgress?: boolean
  /**
   * Merged onto the root form. Width, margin and place in a layout belong here. It
   * is the one route by which colour can reach the shell, and the two colour axes
   * rule applies to it in full: a questionnaire takes neither a status nor a
   * category tint. A class you pass wins where it conflicts, because it is merged
   * last.
   */
  className?: string
}

export function Questionnaire({
  title,
  questions,
  onComplete,
  showProgress = false,
  className,
}: QuestionnaireProps) {
  const titleId = useId()
  const promptBaseId = useId()
  const [current, setCurrent] = useState(0)

  if (isDevelopment()) {
    if (!Array.isArray(questions) || questions.length === 0) {
      warnDev(
        "no-questions",
        "[opsinjs] <Questionnaire> was rendered with no questions, so it has " +
          "nothing to draw. Supply the set through the `questions` prop, where each " +
          "question is an id, a prompt and a control your product composes.",
      )
    } else {
      const seen = new Set<string>()
      for (const question of questions) {
        if (seen.has(question.id)) {
          warnDev(
            `duplicate-id:${question.id}`,
            `[opsinjs] <Questionnaire> was given two questions with id="${question.id}". ` +
              "The id keys the list and is your handle on the question, so it has to be " +
              "unique within the set.",
          )
        }
        seen.add(question.id)
      }
    }

    if (typeof title !== "string" || title.trim() === "") {
      warnDev(
        "no-title",
        "[opsinjs] <Questionnaire> was rendered with no `title`. The form then " +
          "carries no accessible name of its own. Either pass `title` with the name " +
          "of the set, or name the set in the surrounding page so a screen-reader " +
          "user still learns what the questions are for.",
      )
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return null
  }

  const named = typeof title === "string" && title.trim() !== ""
  const position = Math.min(current, questions.length - 1) + 1

  return (
    <form
      data-slot="questionnaire"
      aria-labelledby={named ? titleId : undefined}
      onSubmit={(event) => {
        event.preventDefault()
        onComplete?.()
      }}
      className={cn(ROOT, className)}
    >
      {named ? (
        <div id={titleId} data-slot="questionnaire-title" className={TITLE}>
          {title}
        </div>
      ) : null}

      {showProgress ? (
        <p
          data-slot="questionnaire-progress"
          aria-live="polite"
          className={PROGRESS}
        >
          Question {position} of {questions.length}
        </p>
      ) : null}

      <ol className={LIST}>
        {questions.map((question, index) => {
          const promptId = `${promptBaseId}-${index}`
          return (
            <li
              key={question.id}
              data-slot="questionnaire-question"
              data-question-index={index}
              onFocus={() => setCurrent(index)}
              className={QUESTION}
            >
              <div
                id={promptId}
                data-slot="questionnaire-prompt"
                className={PROMPT}
              >
                {question.prompt}
              </div>
              <div
                role="group"
                aria-labelledby={promptId}
                data-slot="questionnaire-control"
                className={CONTROL}
              >
                {question.control}
              </div>
            </li>
          )
        })}
      </ol>
    </form>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the one thing worth seeing at
 * a glance: a named set of three fictional questions, each with a control the
 * product supplied, with the progress readout on. Read it in greyscale to confirm
 * the shell is neutral chrome and nothing in it reads as a status.
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
