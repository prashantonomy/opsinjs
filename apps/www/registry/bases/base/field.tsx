/**
 * Field — a label, its guidance, its error, and the wiring that ties all three
 * to one control.
 *
 * THIS IS THE COMPONENT THAT DECIDES WHETHER EVERY FORM IN A PRODUCT IS
 * ACCESSIBLE, once. Not because a label is hard, but because the relationships
 * are: an id that has to match a `for`, a description list that has to name two
 * elements and drop one when it unmounts, an invalid state that has to reach the
 * control rather than the wrapper. Hand-wired, those four things are correct on
 * the day they are written and wrong by the third refactor. Field's whole claim
 * is that a product never types any of them.
 *
 * WHAT IS BASE UI'S RESPONSIBILITY AND WHAT IS THIS FILE'S. A component that
 * delegates its central promise and does not say so is one nobody can audit, so
 * the split is written out here and repeated on the page.
 *
 *   Base UI (`@base-ui/react/field`, 1.7.0) owns EVERY id relationship:
 *     - `Field.Control` mints an id and registers it on the labelable context;
 *       `Field.Label` renders a real `<label for>` against that id, so the
 *       accessible name comes from a native label relationship rather than from
 *       `aria-label`.
 *     - `Field.Description` and `Field.Error` each register their own id into
 *       the same context on mount and REMOVE it on unmount; the control's
 *       `aria-describedby` is rebuilt from that set. This is the part hand-rolled
 *       forms get wrong: an error that unmounts and leaves its id behind points
 *       the description at nothing.
 *     - `aria-invalid` is applied to the control — not to the wrapper — whenever
 *       the field's computed validity is false.
 *     - `data-invalid`, `data-valid`, `data-touched`, `data-dirty`, `data-filled`,
 *       `data-focused` and `data-disabled` on the root and the control.
 *
 *   This file owns everything that is a JUDGEMENT rather than a mechanism:
 *     - that the label is required, visible and has no way to be hidden;
 *     - that the error appears IN ADDITION to the hint and never replaces it;
 *     - that the error is carried by a word, a glyph and the invalid state, and
 *       by no colour at all (see NO STATUS COLOUR below);
 *     - that optionality is marked in words inside the label, so it is part of
 *       the accessible name rather than a symbol beside it;
 *     - the `data-slot` names, the type steps, the spacing and the 44px floor.
 *
 * NO STATUS COLOUR, AND THIS IS THE DECISION MOST LIKELY TO BE "FIXED" BY
 * SOMEBODY LATER. A form error is not a clinical status. The four status
 * levels say how much attention a READING needs; painting a mistyped date in
 * `--opsin-status-attention-*` would teach a reader that the colour meaning
 * "this measurement needs a decision" also means "you typed the date wrong",
 * and the two-axis rule is worth nothing if the axes leak into ordinary form
 * chrome. There is also no non-clinical danger role in the product theme at
 * all: the one the docs chrome uses is declared in `app/globals.css` and
 * resolves to nothing under /view, which the accessibility gate fails a
 * component for reaching. So the error is carried by a glyph, a weight change,
 * the border
 * emphasis on the control, and the words — which is what the specification asks
 * for anyway ("text plus an icon plus the invalid state"), arrived at from the
 * other direction.
 *
 * The glyph is `CircleAlert` and it is deliberately NOT `TriangleAlert`. The
 * triangle is `attention`'s glyph in CLINICAL_STATUS_META, and four distinct
 * silhouettes only work as a vocabulary if nothing else in the system borrows
 * one of them.
 *
 * IT IS A SERVER COMPONENT. Every Base UI part it composes carries its own
 * 'use client', so the state, the effects and the id generation all happen
 * inside the client boundary the primitive already declares. This file adds no
 * hook, no state and no handler of its own — it maps props to markup — so a
 * directive here would only pull the wrapper into a bundle it does not need to
 * be in.
 */

import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react"

import { Field as FieldPrimitive } from "@base-ui/react/field"
import { CircleAlert } from "lucide-react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The two words Field ships, and the only reader-facing copy it owns.
 *
 * They are words rather than an asterisk on purpose: the specification asks for
 * required and optional to be "marked in text, with a legend where a symbol is
 * used", and a marker that needs a legend is a marker most readers meet without
 * one. Rendered inside the `<label>`, so the accessible name is
 * "Example measurement (optional)" and a screen-reader user hears the exception
 * at the same moment a sighted reader sees it — rather than as a floating
 * symbol somewhere near the field.
 *
 * They are English, and there is no prop to translate them. That is a real gap
 * and it is listed on the page rather than hidden here.
 */
const OPTIONALITY_WORD: Record<"required" | "optional", string> = {
  required: "(required)",
  optional: "(optional)",
}

/**
 * `validateOn` in this system's vocabulary, mapped to Base UI's.
 *
 * TWO OF THE THREE VALUES COLLAPSE ONTO ONE MODE, and pretending otherwise
 * would be the more comfortable lie. Base UI's `onSubmit` is documented as
 * "triggers validation when the form is submitted, and re-validates on change
 * after submission" — which IS this system's `submit-then-change`. There is no
 * mode that validates on submit and then refuses to look again, so `"submit"`
 * takes the same one.
 *
 * That is the harmless direction of the two. A field that re-checks itself
 * after the reader corrects it clears its error as soon as the correction is
 * typed; the mode this cannot express would leave a corrected field still
 * marked invalid until the next submit, which is the cruelty the specification
 * names. Field is more forgiving than asked, never less.
 *
 * AND BOTH SUBMIT MODES NEED BASE UI'S `<Form>`, WHICH IS NOT SOMETHING THE
 * NAME SUGGESTS. `onSubmit` is not "the browser submitted the form": Base UI
 * gates it on a `submitAttemptedRef` that lives on its own form context
 * (`form/Form.js`), and the context's default value is a ref that is
 * permanently `false`. So inside a plain `<form onSubmit={…}>` with no
 * `<Form>` ancestor, the control's OWN constraints are never checked on submit
 * and never re-checked on change; the only remaining trigger is Base UI's
 * Enter-key commit, and that fires on `<input>` alone. `"blur"` needs no
 * `<Form>` and works as its name reads.
 *
 * This does not touch the `error` prop, which is the path a product should be
 * on: `invalid` is applied from `error` directly and does not go through a
 * validation mode at all. What it changes is how much the un-styled fallback
 * branch below is really worth without a `<Form>`, and the page says so.
 */
const VALIDATION_MODE: Record<
  "blur" | "submit" | "submit-then-change",
  "onBlur" | "onSubmit" | "onChange"
> = {
  blur: "onBlur",
  submit: "onSubmit",
  "submit-then-change": "onSubmit",
}

/**
 * Written out rather than assembled, because Tailwind reads class names as
 * literal strings and anything built at runtime generates no CSS at all.
 *
 * Four things here are load-bearing and easy to mistake for taste:
 *
 *   `min-h-` AND `min-w-[var(--opsin-target-minimum,2.75rem)]` — the product
 *   stylesheet's 44px backstop covers `button`, `[role="button"]`, checkboxes
 *   and radios, and NOT a text input. The floor has to be set here or it is not
 *   set. The generated token is a rem, so it grows with the reader's own text
 *   size; the shorter authored spelling in `app/product.css` is a hard 44px
 *   that does not, and it is being retired.
 *
 *   Both axes, not just the block one, because `w-full` holds the inline axis
 *   only while nobody narrows the control. `FieldControlProps.className` is
 *   merged onto the control and the caller's classes win, so a two-digit
 *   numeric entry written `<Field.Control className="w-8" />` is a 32px target
 *   and nothing says so. `app/product.css` sets both `min-block-size` and
 *   `min-inline-size` on the controls it does cover; this matches it.
 *
 *   And the `2.75rem` fallback is not decoration. This file ships to a
 *   consumer through `shadcn add`, and `app/tokens.generated.css` — the one
 *   place `--opsin-target-minimum` is declared — does not go with it. Without
 *   the fallback the declaration is invalid at computed-value time in an app
 *   that has not wired the token sheet, `min-height` becomes `auto`, and the
 *   input still looks like an input and is simply short. That is the one
 *   degradation of this component nobody would notice. `app/product.css` and
 *   `button.tsx` both write the same fallback, for the same reason.
 *
 *   No focus styles. `app/product.css` already gives every `:focus-visible` a
 *   two-pixel ring in `--ring` with a two-pixel offset, so a component that
 *   writes its own is a component that will drift from the rest of the product
 *   the first time that rule changes.
 *
 *   `data-[invalid]:` and not a colour. Base UI stamps `data-invalid` on the
 *   control, so the emphasis border tracks the field's real validity — the
 *   `error` prop AND a native constraint that failed — rather than only the
 *   half this file knows about. It is an inset shadow rather than a wider
 *   border so that nothing moves by a pixel when the error appears. Know what
 *   that costs: a `box-shadow` is dropped by forced-colors mode and by the
 *   docs stylesheet's print rules, so on paper and under Windows High Contrast
 *   this carrier is gone. It is the third of four, and the two that carry the
 *   meaning — the glyph and the words — survive both. It is not swapped for an
 *   `outline` because `app/product.css` already spends the control's outline
 *   on `:focus-visible`, and a focused invalid field would then show one state
 *   or the other rather than both. `--opsin-border-emphasis` carries its
 *   `2px` fallback for the same reason the two above carry theirs, and the
 *   consequence here is worse: an invalid `box-shadow` is not a short shadow but
 *   no shadow at all, so in an app without the token sheet the whole
 *   declaration drops and the third carrier is gone before forced-colors mode
 *   or a printer ever gets to it. `button.tsx` writes the token the same way.
 *
 * AND ONE TRAP, because this list goes through `cn()` and the parts above do
 * not. `cn` is `twMerge(clsx(...))`, and tailwind-merge is unconfigured — it
 * has never been told that `--text-opsin-*` is a font-size namespace, so it
 * files `text-opsin-body` and `text-foreground` in the SAME conflict group and
 * silently drops whichever comes first. There is no ordering that keeps both.
 * So the size is set here and the colour is not: Tailwind's preflight already
 * gives every form control `color: inherit`, which takes the page's foreground
 * and is one fewer value to keep in step. Adding a text colour to this list
 * would remove the type step, not sit beside it.
 */
const CONTROL_CLASS = [
  "block w-full min-h-[var(--opsin-target-minimum,2.75rem)]",
  "min-w-[var(--opsin-target-minimum,2.75rem)]",
  "rounded-opsin-sm border border-input bg-background",
  "px-opsin-3 py-opsin-2",
  "placeholder:text-muted-foreground text-opsin-body",
  "data-[invalid]:shadow-[inset_0_0_0_var(--opsin-border-emphasis,2px)_currentColor]",
  "disabled:opacity-70",
].join(" ")

/**
 * Once per cause, not once per render.
 *
 * `tokens/errors.json`'s policy says warnings are emitted "once per offending
 * call site, through console.warn", and `warnOnce()` in `lib/opsinjs.ts`
 * implements that half for the codes in the table. Neither warning below has a
 * code — see the note at the top of `Field` — but the once-per-cause half of
 * the policy is not attached to the code, and dropping it along with the code
 * is how a component floods a console. Field is imported into a product's own
 * form, which is a client component with state, so an empty `label` on a
 * controlled field prints once per keystroke; Strict Mode doubles it; and the
 * warning that gets buried is somebody else's.
 *
 * The key is the cause, never the whole message, so a message that carries the
 * label does not mint a new key every time the label changes. Two consequences,
 * both the same trade `warnOnce()` documents: the empty-`label` cause has
 * nothing to distinguish one offender from another, so it collapses to one
 * warning for the whole session; and on the server the module scope is the
 * process, so it is one warning per process rather than per request. Coarse is
 * the right direction — a repeated identical complaint teaches nothing.
 */
const warnedCauses = new Set<string>()

function warnDevelopmentOnce(cause: string, message: string): void {
  if (!isDevelopment() || warnedCauses.has(cause)) {
    return
  }
  warnedCauses.add(cause)
  console.warn(message)
}

/**
 * The error's classes, shared by both branches below so they cannot drift.
 *
 * `items-start` and not `items-center`: at 200% text a message wraps to three
 * lines, and a centred glyph then floats in the middle of the paragraph.
 */
const ERROR_CLASS =
  "m-0 flex items-start gap-opsin-1 text-opsin-headline text-foreground"

export interface FieldProps {
  /**
   * Required, visible, and never hidden. There is no `hideLabel` prop and no
   * value of any other prop that removes it: a control whose name lives only in
   * a placeholder loses it the moment somebody types.
   */
  label: string
  /**
   * The control. Put a `Field.Control` here — Field supplies its id, its
   * `aria-describedby` and its invalid state through context, so a product
   * never wires them by hand. Anything else that participates in Base UI's
   * field context works too; anything that does not gets a label pointing at
   * nothing, which is the one failure this component cannot detect for you.
   */
  children: ReactNode
  /**
   * Guidance shown before a mistake rather than after it. Stays visible when an
   * error appears, because a reader who has just made a mistake still needs the
   * guidance that would have prevented it.
   */
  hint?: string
  /**
   * The error message, in the product's own words. Its presence marks the
   * control invalid and adds the message to the control's description; it never
   * removes the hint. Omit it and the field falls back to whatever the browser
   * says about the control's own constraints, which is words opsinjs has not
   * written.
   */
  error?: string
  /**
   * Which state is marked, in words, inside the label. Mark the exception: in a
   * form where most fields are required, mark the optional ones, and the
   * reverse. Defaults to `"none"`, because marking both is the same as marking
   * neither.
   */
  optionality?: "required" | "optional" | "none"
  /**
   * When the control's own constraints are checked. Governs the invalid state,
   * not the `error` prop — a message the product passed in is a message the
   * product has already decided to show. Defaults to `"submit-then-change"`:
   * never tell somebody their answer is wrong while they are still typing it.
   *
   * Both submit values need Base UI's `<Form>` around the fields. Base UI gates
   * them on a flag that only its own form primitive ever sets, so inside a
   * plain `<form>` the constraints are checked on Enter in a text input and at
   * no other moment. `"blur"` needs no `<Form>`. Passing `error` is unaffected
   * either way, and is the path to be on.
   */
  validateOn?: "blur" | "submit" | "submit-then-change"
  /**
   * Merged onto the root. Field lays its own parts out in a column and leaves
   * the space BETWEEN fields to the form, which is the only place that knows
   * how many there are.
   */
  className?: string
}

export function Field({
  label,
  children,
  hint,
  error,
  optionality = "none",
  validateOn = "submit-then-change",
  className,
}: FieldProps) {
  /* THE TWO FAILURES THAT ARE WORTH A WARNING, and neither gets an OPSIN code.
     `tokens/errors.json` has no entry for either, and a component may not mint
     one: the table is generated from that file and the codes are a versioned
     contract. A plain development warning, de-duplicated by cause the way that
     file's policy asks for, is the honest channel.

     Nothing is dropped from the render in either case. Field wraps somebody's
     form control, and refusing to draw it in order to report a copy mistake
     takes the form off the screen. */
  if (label.trim() === "") {
    warnDevelopmentOnce(
      "empty-label",
      "[opsinjs] <Field> was given an empty `label`. The control now has no " +
        "accessible name, which is the single thing this component exists to " +
        "prevent. No substitute is invented here on purpose: a made-up name " +
        'like "Field" would silence the audit that would otherwise catch this. ' +
        "See /docs/components/field.",
    )
  }

  const message = error !== undefined && error.trim() !== "" ? error : undefined

  if (error !== undefined && message === undefined) {
    warnDevelopmentOnce(
      "empty-error:" + label,
      '[opsinjs] <Field label="' +
        label +
        '"> was given an empty `error` string. An ' +
        "empty message would have marked the control invalid and then said " +
        "nothing about why, so it was ignored. Pass a sentence that says what " +
        "went wrong and what to do, or omit the prop.",
    )
  }

  const marker = optionality === "none" ? null : OPTIONALITY_WORD[optionality]

  return (
    <FieldPrimitive.Root
      data-slot="field"
      /* App-controlled invalidity. Base UI keeps this true even while the
         field's own constraint validation says otherwise, which is what makes
         a form library's verdict win over the browser's. */
      invalid={message !== undefined}
      validationMode={VALIDATION_MODE[validateOn]}
      className={cn("flex w-full flex-col gap-opsin-2", className)}
    >
      {/* `text-opsin-headline` is body size at the emphasis weight — the same
          size, leading and tracking as the answer the reader is about to type,
          heavier. A label set smaller than the field it labels is a label that
          stops being read. It wraps rather than truncating, which is the whole
          of the 200%-text requirement for this part. */}
      <FieldPrimitive.Label
        data-slot="field-label"
        className="text-opsin-headline text-foreground"
      >
        {label}
        {marker === null ? null : (
          <>
            {" "}
            {/* Inside the label, so it joins the accessible name. It takes the
                full foreground colour and is distinguished by WEIGHT rather
                than by being greyed out: required-or-optional is information a
                reader acts on, and information does not go in the colour
                reserved for things that can be skipped. */}
            <span data-slot="field-optionality" className="font-normal">
              {marker}
            </span>
          </>
        )}
      </FieldPrimitive.Label>

      {/* The hint is set at BODY size, not smaller. Shrinking guidance is how
          it stops being read, and this system's readers are laypeople looking
          at their own health data rather than people who have used the form
          before. The muted role is what separates it from the label. */}
      {hint === undefined || hint.trim() === "" ? null : (
        <FieldPrimitive.Description
          data-slot="field-hint"
          className="m-0 text-opsin-body text-muted-foreground"
        >
          {hint}
        </FieldPrimitive.Description>
      )}

      {children}

      {/* ONE ELEMENT, TWO SOURCES OF WORDS.
          With `error`, `match` is forced on and the product's sentence is the
          content — the branch that should be taken in a shipped product.
          Without it, Base UI decides: the element mounts only when the
          control's own constraints have failed at the moment `validateOn`
          prescribes, and the content is the browser's message.

          The fallback is kept rather than suppressed because the alternative is
          worse: `aria-invalid` on a control with nothing describing it tells a
          reader something is wrong and refuses to say what. It is still a
          fallback, and it is still the browser's tone rather than this
          system's, which is why the page tells you to pass `error`.

          Both branches render the same element type in the same position, so
          React reuses the node and the id registered on the description
          context does not churn. */}
      {message === undefined ? (
        <FieldPrimitive.Error data-slot="field-error" className={ERROR_CLASS} />
      ) : (
        <FieldPrimitive.Error match data-slot="field-error" className={ERROR_CLASS}>
          {/* Decorative: the sentence beside it carries the meaning. Sized in
              em so it grows with the text rather than staying put while the
              words around it get bigger, and pushed down by a fraction of a
              line so it sits on the first line's baseline rather than at the
              top of a two-line message. */}
          <CircleAlert aria-hidden="true" className="mt-[0.2em] size-[1em] shrink-0" />
          <span>{message}</span>
        </FieldPrimitive.Error>
      )}
    </FieldPrimitive.Root>
  )
}

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "children" | "className" | "color" | "defaultValue" | "style"
>

export interface FieldControlProps extends NativeInputProps {
  /**
   * Renders a different element in place of the `<input>`, keeping every id and
   * aria attribute Field generated: `render={<textarea rows={3} />}`. This is
   * the escape hatch that makes the wiring guarantee survive a control opsinjs
   * does not ship.
   */
  render?: ReactElement
  /**
   * Only meaningful alongside `render`, for an element that has children of its
   * own — the `<option>` list of a `<select>`. An `<input>` is void and takes
   * none.
   */
  children?: ReactNode
  /** Merged onto the control. The control's own classes win where they conflict. */
  className?: string
  /** The uncontrolled starting value. Use `value` and `onChange` for a controlled control. */
  defaultValue?: string | number | readonly string[]
  /** Merged onto the control. */
  style?: CSSProperties
}

/**
 * The one part of Field that is a real export rather than a `data-slot`.
 *
 * Everywhere else in opsinjs a part is internal structure identified by
 * `data-slot`, because the content arrives as a prop. Field is one of three
 * exceptions, and the reason is specific: the CONSUMER supplies the control, and
 * there is no prop that could carry an `<input>` with its own type, name,
 * `autocomplete`, `inputmode`, value and change handler. So the slot is a
 * component, and it is the only way to get the generated id, the description
 * list and the invalid state onto an element this file never sees.
 *
 * It sets no `autocomplete` and no `inputmode` of its own. Both are required by
 * the accessibility contract and both are answers only the product has: the
 * right `autocomplete` token depends on what is being asked for, and a guess
 * would fill somebody's postcode into a field asking for something else.
 */
export function FieldControl({ className, ...props }: FieldControlProps) {
  return (
    <FieldPrimitive.Control
      {...props}
      data-slot="field-control"
      className={cn(CONTROL_CLASS, className)}
    />
  )
}

/* Assigned after the declaration rather than through `Object.assign`, so the
   function keeps its name in a stack trace and in React devtools. */
Field.Control = FieldControl

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the three states that
 * decide whether this component is worth having: a field with guidance, a field
 * whose exception is marked, and a field with an error — where the point is
 * what has NOT happened, because the hint is still there underneath it.
 *
 * The labels are deliberately unreal (ADR 0012). Nothing here is a measurement
 * anybody could mistake for their own, and the date is one nobody has.
 *
 * `autoComplete="off"` is the one thing here NOT to copy. The accessibility
 * contract wants the reader's own stored details to be able to fill the field,
 * and `off` is the opt-out; it is used here because these fields collect
 * nothing real and a token like `bday` on "Example measurement" would be a
 * made-up answer to a made-up question. Replace it with the token for whatever
 * you are actually asking for. `inputMode` is set where it changes the keyboard
 * and omitted on the free-text note, where it does not.
 */
export default function FieldDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-6">
      <Field label="Example measurement" hint="For example, 14.">
        <Field.Control
          name="example-measurement"
          inputMode="decimal"
          autoComplete="off"
        />
      </Field>

      <Field
        label="Example note"
        optionality="optional"
        hint="Anything you want to remember about this entry."
      >
        <Field.Control name="example-note" autoComplete="off" />
      </Field>

      <Field
        label="Example date"
        hint="For example, 27 3 1985."
        error="Enter a date in the past."
      >
        <Field.Control
          name="example-date"
          inputMode="numeric"
          autoComplete="off"
          defaultValue="27 3 3985"
        />
      </Field>
    </div>
  )
}
