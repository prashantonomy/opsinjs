/**
 * Button — the control you press to make something happen.
 *
 * THE LEAST CLINICAL COMPONENT, AND THE ONE WITH THE FEWEST PLACES TO HIDE. It
 * asserts nothing about a person, so every decision in this file is about the
 * two things a control owes everybody: a name you can read and a target you can
 * hit. Both are easier to get wrong here than anywhere else, because a button
 * is the component people copy first and read last.
 *
 * IT IS ALWAYS A REAL <button>. There is no `href`, no `as` and no `render`
 * escape hatch, and that is a refusal rather than an omission. A control that
 * produces a new URL is a link: it can be opened in a new tab, copied, and
 * found in a screen reader's list of links, and none of that survives being
 * reimplemented as a button with a click handler. The specification's anatomy
 * says "a real <button>, or an <a> only when it navigates" and this file
 * implements the first half; the second half belongs to `link`, which is on the
 * considered roster and is not this component wearing a different tag.
 *
 * The refusal is enforced rather than only typed. `render` and `nativeButton`
 * are Base UI's own props and are absent from `ButtonProps`, which stops a
 * TypeScript caller — but this file ships as source into JavaScript projects
 * where a type is advice, and `{...rest}` would carry either of them straight
 * through to the primitive. So both are pinned below, after the spread. Checked
 * by rendering the primitive: `render={<a href="/x" />}` emits a <button>.
 *
 * WHY BASE UI RATHER THAN A BARE <button>. Exactly one prop needs it. `busy`
 * has to make the control unactivatable WITHOUT removing it from the
 * accessibility tree — the native `disabled` attribute does both at once, and
 * losing the control mid-save loses the reader's place. Base UI's `useButton`
 * gives that combination directly: with `disabled` and `focusableWhenDisabled`
 * together it sets `aria-disabled`, leaves the native attribute off, keeps the
 * element in the tab order, and swallows activation. Rebuilding that by hand
 * means merging the caller's own onClick and onKeyDown with ours, which is the
 * kind of code that works until somebody passes a handler we did not expect.
 *
 * WHAT BASE UI COSTS, AND IT IS NOT NOTHING. `useButton` merges `type: 'button'`
 * into every native button before the caller's own props
 * (`internals/use-button/useButton.js`), so this component does NOT inherit the
 * platform's implicit `type="submit"`. A Button at the foot of a form needs
 * `type="submit"` written on it or the form will not submit. That is the
 * opposite of a bare <button> and it is the single most surprising thing about
 * this file, which is why `type` is redeclared in `ButtonProps` below with the
 * real default on it rather than left to be inherited silently. `useButton`
 * also stamps `tabIndex={0}` on every button, which is harmless — 0 is the
 * value a button already has — but it means "this component adds no tabindex"
 * is not a true sentence about the rendered DOM.
 *
 * THERE IS NO DESTRUCTIVE COLOUR IN THIS SYSTEM, AND THIS FILE DOES NOT INVENT
 * ONE. The product palette is the two axes plus eleven neutral roles; the
 * status axis is reserved for what a reading means, and
 * `handbook/migrating-from-shadcn` is explicit that a delete button is not a
 * clinical status and that mapping one onto the other is the fastest way to
 * contaminate the axis. So `destructive` is separated from `secondary` by
 * weight rather than by hue — the emphasis border width, and no fill — and the
 * signal a reader can actually rely on is the label and the confirmation step
 * around it. Colour is not carrying this, because in opsinjs there is no colour
 * available to carry it.
 *
 * AND THE WEIGHT IS NOT CARRYING IT EITHER, ON THE EVIDENCE SO FAR. The
 * boundary that is the whole of the non-label signal has not been measured
 * against the surfaces this button sits on, and the pairs are close enough that
 * a review by eye will not settle it. Until `scripts/check-contrast.mts` emits
 * a component scope, the honest description of the emphasis ladder is that its
 * unfilled rungs are told apart by their labels; the page says so rather than
 * promising a ladder that is legible in greyscale.
 *
 * WHAT IT DOES NOT DO. It does not derive anything, does not animate anything
 * but the busy spinner, does not move focus, and does not mount a live region.
 * `busy` is EXPOSED on the control as `aria-busy` and `aria-disabled`; whether
 * anything is spoken about it is a question of screen-reader behaviour that
 * nobody here has tested, and whether a save is worth announcing is the
 * product's call and not a decision a button is entitled to make.
 */

import { Button as BaseButton } from "@base-ui/react/button"
import { LoaderCircle } from "lucide-react"
import { Children, type ButtonHTMLAttributes, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Four variants, in descending emphasis.
 *
 * Deliberately few, and deliberately NOT exported: the substrate contract fixes
 * a registry file at three public exports — the props interface, the component
 * and the zero-prop demo — so a consumer names this union as
 * `ButtonProps["variant"]` rather than importing a fourth symbol. The
 * specification writes it as an export; that difference is recorded on the page
 * rather than resolved in favour of a wider surface.
 */
type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive"

/**
 * Development warnings, said once per distinct message.
 *
 * `warnOnce` in the substrate is keyed to an `OpsinErrorCode`, and the codes in
 * tokens/errors.json describe mistakes a consumer makes with the CLINICAL API.
 * "This control shipped with no accessible name" is a mistake anybody can make
 * with any control and there is no code allocated for it. What the substrate is
 * right about is the discipline rather than the registry: a warning channel that
 * repeats on every render — and twice per render under Strict Mode — degrades
 * into noise, and a noisy channel is one somebody switches off. So this file
 * keeps its own small set. Allocating real codes and deleting this is a strict
 * improvement, and belongs in lib/opsinjs.ts rather than here.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Whether `children` will render no text at all.
 *
 * TypeScript cannot see this: `children` is required and every value below
 * satisfies a required `ReactNode`. Testing three sentinels — `""`, `null`,
 * `undefined` — misses the way it actually happens, which is
 * `{flag && "Save reading"}` evaluating to `false`, or a whitespace-only string
 * arriving from a translation table. `Children.toArray` drops `null`,
 * `undefined`, booleans and empty arrays for us; what it keeps and we must
 * still reject is a string that is all whitespace.
 *
 * `0` is NOT blank, and the distinction is deliberate. It renders the character
 * "0", which is a real accessible name — the same null-versus-zero split the
 * rest of this system insists on for values, applied to a label.
 */
function hasNoLabel(children: ReactNode): boolean {
  const parts = Children.toArray(children)
  if (parts.length === 0) return true
  return parts.every((part) => typeof part === "string" && part.trim() === "")
}

/**
 * Fill, ink and boundary per variant, written out as literal class strings.
 *
 * Tailwind reads class names out of source as text. `bg-${variant}` generates
 * no CSS whatsoever and the button renders unstyled, which is a defect that
 * reviews miss because the code reads as if it works. So the four are spelled
 * in full, once, here.
 *
 * Note what is NOT reached for. The secondary, accent and destructive roles a
 * shadcn button reaches for first are declared only in the docs chrome and
 * resolve to nothing under the product theme, so an emphasis ladder built from
 * them would look correct in review and arrive colourless in the product. The
 * four rungs below are built from the roles the product stylesheet actually
 * bridges: a strong fill, a soft fill, an outline, and nothing at all.
 *
 * Hover and press are approximations rather than derivations, and the gap is
 * wider than "two states that resolve alike".
 * `foundations/interaction-states` specifies a state as a transformation in
 * OKLCH applied to the role the component already uses, but no state token is
 * generated yet, so there is nothing to consume. The muted role the three
 * unfilled variants borrow sits a hair from the surfaces they sit on, so on
 * those three the hover fill is close to no signal at all — `active:translate-y-px`
 * is doing the work, and it is a press cue rather than a hover one. Measuring
 * these pairs into the generated contrast report is what turns this comment
 * into a number; nobody has done it.
 */
const TONE: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary:
    "border-border bg-card text-foreground hover:bg-muted active:bg-muted",
  quiet:
    "border-transparent bg-transparent text-foreground hover:bg-muted active:bg-muted",
  destructive:
    "border-border bg-transparent text-foreground hover:bg-muted active:bg-muted",
}

/**
 * The boundary width per variant, as the token rather than as a number.
 *
 * It is an inline style and not a class on purpose. Tailwind can take a border
 * width from a custom property, but a spelling that fails to compile produces
 * no declaration and no error — and the failure mode here is a secondary button
 * that silently loses its only boundary, which is the one thing that keeps it
 * visible in greyscale and under a reader stylesheet that strips backgrounds. A
 * declared `borderStyle` travels with it because the width alone does nothing
 * without it in a project whose reset differs from this one.
 */
const EDGE: Record<ButtonVariant, string> = {
  primary: "var(--opsin-border-hairline, 1px)",
  secondary: "var(--opsin-border-hairline, 1px)",
  quiet: "var(--opsin-border-hairline, 1px)",
  /* The whole of the destructive signal that is not the label. */
  destructive: "var(--opsin-border-emphasis, 2px)",
}

/**
 * Padding and type step per size.
 *
 * `md` takes the headline step, which is body size at weight 600 — the system
 * has no "small and emphasised" step, so `sm` takes subheadline and its weight
 * of 400 with it. That is a real limitation of the eleven-step ramp and not a
 * choice: a component that reached for `font-medium` here would be authoring a
 * weight the type scale does not own.
 *
 * Neither size sets a height. The height floor is the target minimum, applied
 * below, and it is the same for both — `sm` is narrower and quieter, never
 * shorter. `density-and-touch` is unambiguous that compact must not become
 * harder to hit.
 */
const SIZE: Record<"sm" | "md", string> = {
  sm: "gap-opsin-1 px-opsin-3 py-opsin-1 text-opsin-subheadline",
  md: "gap-opsin-2 px-opsin-5 py-opsin-2 text-opsin-headline",
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /**
   * Emphasis. Four values, in descending order: `primary`, `secondary`,
   * `quiet`, `destructive`. One primary per surface — the hierarchy is the
   * answer to "what should I do here?", and three primaries answer it with a
   * shrug. Defaults to `secondary`, because the safe default is the one that
   * does not claim to be the most important thing on the screen.
   */
  variant?: ButtonVariant
  /**
   * Visual weight only. Both sizes clear the 44pt target floor; `sm` is
   * narrower and takes a smaller type step, and is never shorter. Defaults to
   * `md`.
   */
  size?: "sm" | "md"
  /**
   * Required. The label, and there is no way to remove it: no `iconOnly` prop
   * and no size at which the icon stands alone. An icon-only control needs its
   * accessible name supplied some other way and a different target treatment,
   * which makes it a different component.
   */
  children: ReactNode
  /**
   * Inherited from `button`, redeclared here because its default is the
   * surprising one. **Defaults to `button`, not to `submit`.** Base UI's
   * `useButton` merges `type: "button"` into every native button, so this
   * component does not inherit the platform's implicit submit behaviour: a
   * control at the foot of a form needs `type="submit"` written on it. The
   * value you pass wins, so submitting is one word away — but it is a word you
   * have to write.
   */
  type?: "button" | "submit" | "reset"
  /**
   * An optional glyph beside the label. Always decorative and always hidden
   * from assistive technology — the label carries the meaning, and an announced
   * icon makes a screen reader say the action twice.
   */
  icon?: ReactNode
  /**
   * Which side the icon sits on. Defaults to `leading`. Use `trailing` for a
   * control that moves the reader forward through a flow, so the glyph points
   * the way the action goes.
   */
  iconPosition?: "leading" | "trailing"
  /**
   * In-place loading. The label stays visible and unchanged, and the button
   * stays in the accessibility tree and in the tab order rather than
   * disappearing. The state is EXPOSED on the control as `aria-busy` plus
   * `aria-disabled`; whether any screen reader says anything about it has not
   * been tested here, and `aria-busy` on a control that is not a live region is
   * a hint rather than a promise. It replaces the icon slot, so a button that
   * has no icon grows by one glyph when it becomes busy; give a button an icon
   * if its width must not move.
   */
  busy?: boolean
  /**
   * Fills its container. For the bottom of a sheet or a form, where the primary
   * action should be as wide as the thumb's reach. Not for a row of buttons —
   * two full-width buttons stacked read as two primary actions.
   */
  fullWidth?: boolean
}

export function Button({
  variant = "secondary",
  size = "md",
  children,
  icon,
  iconPosition = "leading",
  busy = false,
  fullWidth = false,
  className,
  style,
  ...rest
}: ButtonProps) {
  /* An unlabelled button is the exact failure the missing `iconOnly` prop
     exists to prevent, and it is invisible to the type system. */
  if (isDevelopment() && hasNoLabel(children)) {
    warnDev(
      "no-label",
      "[opsinjs] <Button> was rendered with no label. The visible label is the " +
        'accessible name; without it the control is announced as "button" and ' +
        "nothing else, and it is unreachable by voice control. Note that a " +
        "whitespace-only string and a falsy `&&` branch both count as no label. " +
        "There is no icon-only Button — if the design calls for one, it needs " +
        "its own name and its own target rules.",
    )
  }

  /* Tabindex above zero is banned outright by `accessibility/keyboard-and-focus`:
     it reorders the whole document rather than this control, and the damage
     lands on a page nobody testing this button will have open. `ButtonProps`
     extends ButtonHTMLAttributes, so `tabIndex` is part of the public surface
     and reaches the DOM through the spread below — this file cannot make the
     ban structural without narrowing the type and losing every legitimate
     `tabIndex={-1}`. So it is reported, in the same channel as the other two. */
  if (typeof rest.tabIndex === "number" && rest.tabIndex > 0) {
    warnDev(
      `tab-index-${rest.tabIndex}`,
      `[opsinjs] <Button> was given tabIndex={${rest.tabIndex}}. A tabindex above ` +
        "zero moves this control ahead of every element in the natural document " +
        "order, across the whole page, and the resulting tab sequence is one " +
        "nobody can predict from the markup. Use 0 to keep the natural order, or " +
        "-1 to take the control out of the tab sequence, and reorder the DOM " +
        "instead.",
    )
  }

  /* The caller's own `disabled` and our `busy` are different states and the
     first wins. A caller who asked for a genuinely unavailable control gets
     native disabled semantics; `busy` on its own gets `aria-disabled` with the
     element left in the tree. Asking for both at once is a contradiction — the
     native attribute takes the button out of the tab order, so the `aria-busy`
     nobody can reach is exposed to nobody. */
  const nativeDisabled = rest.disabled === true
  if (busy && nativeDisabled) {
    warnDev(
      "busy-and-disabled",
      "[opsinjs] <Button> has both `busy` and `disabled`. `disabled` removes the " +
        "control from the tab order and from the accessibility tree, so the busy " +
        "state it is meant to carry reaches nobody. Use `busy` alone: it " +
        "blocks activation and keeps the button reachable and named.",
    )
  }

  /* The icon slot, rendered once and placed on whichever side was asked for.
     Busy REPLACES the icon and never the label — the label is the reader's
     record of what they pressed, and a control whose name disappears while it
     works is a control that has lost their place. */
  const slot = busy ? (
    <span
      data-slot="button-busy"
      aria-hidden="true"
      className="inline-flex shrink-0 items-center"
    >
      {/* THE SPIN IS KEPT UNDER `prefers-reduced-motion`, AND THAT IS AN
          EXCEPTION RATHER THAN A DEFAULT. `foundations/motion/reduced-motion`
          collapses rotation and names a looping animation as the classic
          offender; `health/motion-in-health-ui` rule 5 asks every animation for
          a reduced behaviour that is "an instant, complete, equally informative
          state". This has no such state to fall back to: a frozen spinner
          communicates nothing at all, and the non-motion carriers — the label,
          `aria-busy`, `aria-disabled`, dropped pointer events — are already
          present for everybody but are not VISIBLE. `animate-spin` is Tailwind's
          own keyframe rather than an opsinjs motion token, so it sits outside
          the per-token reduced-motion block and no stylesheet here stops it.

          What would close this properly is a still busy treatment that a
          sighted reader can see, promoted to a motion token with a declared
          reduced fallback. That is a design decision and a token, neither of
          which belongs in this file. Until then the exception is stated here,
          on the page, and — where it is still missing — on the doctrine page it
          excepts itself from. SC 2.2.2 (anything moving for more than five
          seconds) has not been assessed for it. */}
      <LoaderCircle className="size-[1em] animate-spin" />
    </span>
  ) : icon ? (
    <span
      data-slot="button-icon"
      aria-hidden="true"
      className="inline-flex shrink-0 items-center [&_svg]:size-[1em]"
    >
      {icon}
    </span>
  ) : null

  return (
    <BaseButton
      {...rest}
      data-slot="button"
      /* The tag refusal, made structural. Both are Base UI props absent from
         `ButtonProps`, so a TypeScript caller cannot reach them; pinning them
         after the spread is what stops a JavaScript caller — or anything
         forwarding a props object wholesale — from turning this into an anchor
         or into a non-native control with a synthetic role. */
      render={undefined}
      nativeButton
      /* `disabled` + `focusableWhenDisabled` is the whole mechanism behind
         `busy`: Base UI sets `aria-disabled`, leaves the native attribute off,
         keeps the tab stop and refuses activation. With a real `disabled` from
         the caller, `focusableWhenDisabled` goes false and the native attribute
         comes back, which is what that caller asked for. */
      disabled={busy || nativeDisabled}
      focusableWhenDisabled={busy && !nativeDisabled}
      aria-busy={busy || undefined}
      style={{ borderStyle: "solid", borderWidth: EDGE[variant], ...style }}
      className={cn(
        /* `relative` is load-bearing: the hit-area part below is positioned
           against it. `whitespace-normal` and `items-center` rather than a
           fixed height, because at 200% text the label has to wrap and the
           button has to grow with it — a truncated label is unreadable and
           unspeakable, and a fixed height is how it happens. */
        "relative inline-flex items-center justify-center whitespace-normal rounded-opsin-md text-center align-middle",
        /* The second piece of motion in this file, and the one that needs no
           branch: `--opsin-duration-fast` collapses to 1ms inside the product
           stylesheet's own reduced-motion block, so the colour change becomes
           instant for a reader who asked for that and nothing here has to know. */
        "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard",
        /* The press acknowledgement, and the only state signal in this file that
           does not depend on colour. `transition-colors` deliberately excludes
           transform, so the shift is instantaneous rather than animated — which
           is what `prefers-reduced-motion` asks a press feedback to be, so this
           needs no reduced-motion branch and behaves identically for everybody. */
        "active:translate-y-px",
        /* Drawn outside the box with an offset, so it never changes layout.
           It IS clipped by an ancestor that clips — an outline is painted by the
           element and an `overflow: hidden` parent eats it, which is a property
           of outlines and not a defect here; a surface that clips has to leave
           room for it. Declared on the component as well as in the product theme
           because a consumer installs this file without that stylesheet — and
           declared as a literal for the same reason, which is the trade: the
           ring survives installation elsewhere but does not follow
           `--opsin-border-focus` when a consumer retunes it. */
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        /* THE TWO UNAVAILABLE STATES LOOK DIFFERENT BECAUSE THEY ARE DIFFERENT,
           and the selectors land on exactly one each. Base UI sets the native
           attribute when `focusableWhenDisabled` is off and `aria-disabled`
           when it is on, so `:disabled` is the caller's own disabled and
           `[aria-disabled]` is `busy` — there is no state where both match.

           Native disabled dims, but only to 60%: a control faded until nobody
           can read it turns "you cannot do this yet" into "you cannot find out
           what this is". Busy does NOT dim, because the label is the reader's
           record of what they pressed and it has to stay at full contrast while
           the work happens; the spinner is the signal, not a fade.

           Both drop pointer events. That is what stops a hover fill promising
           an activation neither state will honour. Neither touches the tab
           order — busy keeps its stop by construction, and a natively disabled
           control loses it to the platform rather than to this rule. */
        "disabled:opacity-60 disabled:pointer-events-none",
        "aria-disabled:pointer-events-none",
        TONE[variant],
        SIZE[size],
        fullWidth ? "w-full" : null,
        className,
      )}
    >
      {/* Button.Target — the hit area, and the reason it is an element rather
          than a rule on the root.

          The product stylesheet floors every `button` at
          `--opsin-target-minimum`, so inside this repository this span agrees
          with the backstop rather than doing anything. Its job is the consumer
          project that installed this file and not that stylesheet: centred on
          the button and floored in both axes, it keeps a 44pt pressable region
          even where the visible box is smaller, because pointer events on a
          descendant activate the button.

          The floor is a rem and not 44px on purpose. At 200% text the root font
          size genuinely doubles, so a rem floor grows with the label while a
          pixel one leaves a doubled label overflowing a fixed box.

          THE EXPANSION IS NOT CLAMPED, and that is the sharp edge. A button
          smaller than the floor grows a hit area that reaches past its own
          border box with nothing stopping it, so two small controls set closer
          together than the overhang will have overlapping hit areas and the
          later one in the DOM wins the overlap. The fix for SC 2.5.5 can
          therefore create an SC 2.5.8 problem, in a project without the product
          stylesheet. A caller spacing small buttons owes them
          `--opsin-target-separation` plus whatever this span adds. */}
      <span
        data-slot="button-target"
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 size-full min-h-[var(--opsin-target-minimum,2.75rem)] min-w-[var(--opsin-target-minimum,2.75rem)] -translate-x-1/2 -translate-y-1/2"
      />
      {iconPosition === "leading" ? slot : null}
      <span data-slot="button-label">{children}</span>
      {iconPosition === "trailing" ? slot : null}
    </BaseButton>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it into a
 * consumer's project, so it is reviewed public code rather than a scratch
 * demo. It shows the four variants together because the only question worth
 * answering at a glance is whether the emphasis ladder reads as a ladder — and
 * that question is worth asking in greyscale, where three of the four rungs
 * have only fill and boundary to be told apart by. It has not been answered:
 * the boundary carrying it is unmeasured against both surfaces, which is why
 * the labels below are doing more work than the styling is.
 *
 * The labels name a fictional reading (ADR 0012). No number, no unit, nothing a
 * screenshot could be mistaken for.
 */
export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-opsin-2">
      <Button variant="primary">Save example reading</Button>
      <Button variant="secondary">Add a note</Button>
      <Button variant="quiet">Cancel</Button>
      <Button variant="destructive">Delete this example reading</Button>
      <Button variant="secondary" size="sm">
        Edit
      </Button>
      <Button variant="primary" busy>
        Save example reading
      </Button>
    </div>
  )
}
