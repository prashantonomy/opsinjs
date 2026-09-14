/**
 * Button is the control you press to make something happen.
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
 * TypeScript caller. This file nevertheless ships as source into JavaScript
 * projects where a type is advice, and `{...rest}` would carry either of them
 * straight through to the primitive. So both are pinned below, after the
 * spread. Checked by rendering the primitive: `render={<a href="/x" />}` emits
 * a <button>.
 *
 * WHY BASE UI RATHER THAN A BARE <button>. Exactly one prop needs it. `busy`
 * has to make the control unactivatable WITHOUT removing it from the
 * accessibility tree. The native `disabled` attribute does both at once, and
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
 * also stamps `tabIndex={0}` on every button. That is harmless, because 0 is
 * the value a button already has. It does mean, though, that "this component
 * adds no tabindex" is not a true sentence about the rendered DOM.
 *
 * THERE IS NO DESTRUCTIVE COLOUR IN THIS SYSTEM, AND THIS FILE DOES NOT INVENT
 * ONE. The product palette is the two axes plus eleven neutral roles; the
 * status axis is reserved for what a reading means, and
 * `handbook/migrating-from-shadcn` is explicit that a delete button is not a
 * clinical status and that mapping one onto the other is the fastest way to
 * contaminate the axis. So `destructive` is separated from `secondary` by its
 * boundary ink rather than by hue. The boundary is drawn in `--foreground`,
 * the page's own near-black ink, with no fill. The label and the confirmation
 * step around it stay the signal a reader relies on, because in opsinjs there
 * is no colour available to carry a delete.
 *
 * THE EMPHASIS WIDTH WAS GIVEN UP ON PURPOSE. A 2px grey boundary said two
 * things at once, "this deletes" on this control and "act now" on the status
 * axis, and a width that the status axis already owns as its own carrier
 * cannot also be the whole of a delete signal. The boundary ink is measured
 * by hand against both surfaces this button sits on: `--foreground` reaches
 * 18.12:1 on `--background` and 18.61:1 on `--card` in light, and 17.53:1 on
 * `--background` and 15.96:1 on `--card` in dark, so every rung clears the 3:1
 * non-text floor with room. Measured, not gated: `scripts/check-contrast.mts`
 * reads only tokens/color.json and tokens/material.json and has never seen a
 * product surface role, so it cannot check this pair, and the page says so
 * rather than promising a gate that does not exist.
 *
 * WHAT IT DOES NOT DO. It does not derive anything, does not animate anything
 * but the busy spinner, does not move focus, and does not mount a live region.
 * `busy` is EXPOSED on the control as `aria-busy` and `aria-disabled`; whether
 * anything is spoken about it is a question of screen-reader behaviour that
 * nobody here has tested, and whether a save is worth announcing is the
 * product's call and not a decision a button is entitled to make.
 */

import { Button as BaseButton } from "@base-ui/react/button"
import { Hourglass, LoaderCircle } from "lucide-react"
import { Children, type ButtonHTMLAttributes, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Four variants, in descending emphasis.
 *
 * Deliberately few, and deliberately NOT exported: the substrate contract fixes
 * a registry file at three public exports: the props interface, the component
 * and the zero-prop demo. A consumer therefore names this union as
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
 * right about is the discipline rather than the registry: a warning channel
 * degrades into noise if it repeats on every render, which under Strict Mode
 * means twice per render. A noisy channel is one somebody switches off. So this
 * file keeps its own small set. Allocating real codes and deleting this is a
 * strict improvement, and belongs in lib/opsinjs.ts rather than here.
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
 * satisfies a required `ReactNode`. Testing the three sentinels `""`, `null`
 * and `undefined` misses the way it actually happens, which is
 * `{flag && "Save reading"}` evaluating to `false`, or a whitespace-only string
 * arriving from a translation table. `Children.toArray` drops `null`,
 * `undefined`, booleans and empty arrays for us; what it keeps and we must
 * still reject is a string that is all whitespace.
 *
 * `0` is NOT blank, and the distinction is deliberate. It renders the character
 * "0", which is a real accessible name. This is the same null-versus-zero
 * split the rest of this system insists on for values, applied to a label.
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
 * Hover and press are consumed from the theme rather than approximated. Four
 * state roles now exist in `app/product.css`: `--state-hover`, `--state-press`
 * and the primary pair `--state-primary-hover` and `--state-primary-press`.
 * They are opaque and not alpha, so a state does not resolve to one colour on
 * `--background` and a different one on `--card`, and they move away from the
 * surface in the direction `foundations/interaction-states` specifies, darker
 * in light and lighter in dark, rather than back towards it the way the old
 * `bg-muted` borrow did. Press is a different value from hover, so a tap now
 * reads even without the 1px shift, and `active:translate-y-px` stays as the
 * one press cue that needs no colour at all. The honest figures, named in full
 * rather than by the friendlier one alone: the light neutral hover fill reaches
 * only 1.14:1 against the surfaces and the press fill 1.23:1, both under the
 * 1.5:1 the audit asked for, because `--background` and `--card` sit so near
 * white that no opaque step below them can climb higher without reading as a
 * different fill. Press is distinct from hover, so a tap reads, but the light
 * hover step still sits below the floor the finding set, and that residual
 * belongs to the theme layer that owns the values rather than to this file.
 * These pairs are hand-authored in the theme layer rather than emitted
 * by `scripts/build-tokens.mts`, so `interaction-states.mdx`'s Tokens section
 * is still `<NoDataYet>` and nothing gates them.
 *
 * WHY EVERY RUNG SPELLS ITS INK AS AN ARBITRARY PROPERTY. `cn`
 * is `twMerge(clsx(...))` and tailwind-merge is unconfigured, so it has never
 * been told that `--text-opsin-*` is a font-size namespace: it files
 * `text-opsin-headline` and `text-primary-foreground` in the SAME conflict group
 * and keeps whichever comes last. Written `text-primary-foreground`, the ink was
 * silently deleted by `SIZE[size]` on the line below it in the `cn()` call and
 * every primary button in the system rendered the page's default near-black
 * label on the primary fill. That is a dark ink on a mid-blue ground, on the
 * control that commits a reading. No gate could see it:
 * `scripts/check-contrast.mts` measures the `--primary` / `--primary-foreground`
 * token PAIR and that pair is fine, while the class that would have applied it
 * never reached the DOM. Reordering does not help either: it keeps the ink and
 * drops the type step and its weight instead, which is the regression
 * `care-card.tsx` documents at its own action list. `[color:…]` is an
 * arbitrary property, which tailwind-merge groups by the CSS property rather
 * than by the `text-` prefix, so the two no longer meet and both survive.
 * `disclaimer-note.tsx` answers the identical trap the same way, and its
 * comment is the longer version of this one. A Tailwind editor plugin will
 * offer to rewrite the line as `text-primary-foreground`; do not accept it,
 * because that is exactly the spelling that loses.
 *
 * The cost, stated: because the two no longer conflict, a caller cannot recolour
 * a button by passing a `text-*` class. Both declarations are emitted and source
 * order decides. `style={{ color: … }}` still works and is spread last, so that
 * is the way to do it. This treatment is on all four rungs and not on primary
 * alone, because the trap is on all four. tailwind-merge files `text-foreground`
 * in the same conflict group as `text-opsin-headline`, and `SIZE[size]` is passed
 * after `TONE[variant]` in the `cn()` call below, so a plain `text-foreground`
 * was deleted from `secondary`, `quiet` and `destructive` exactly as
 * `text-primary-foreground` was deleted from `primary`. The string
 * `text-foreground` has never reached the DOM on any button in this system. It
 * looked safe in-repo only because a label with no colour of its own inherits the
 * page colour, and on this repository's surfaces the page colour equals
 * `--foreground`. Under ADR 0002 this file ships into somebody else's project,
 * where an inherited label takes its colour from any ancestor that sets `color`:
 * a Card's `text-card-foreground`, or a status surface carrying
 * `--opsin-status-urgent-ink`. That last case is a route for a status colour to
 * land on a control label, which is the two-axis invariant failing by inheritance
 * rather than by anyone choosing it, so the arbitrary property is what keeps the
 * label's ink its own on any ground. Configuring `extendTailwindMerge` in
 * `lib/utils.ts` with the `text-opsin-*` namespace would retire this whole
 * comment. That is a change to every component in the registry at once and
 * belongs in `lib/utils.ts`, which this file does not own.
 *
 * QUIET IS THE ONE RUNG WHERE INK CARRIES THE EMPHASIS. It has no fill and no
 * boundary, so before this change it read as bold body text and a reader who
 * could not hover had no way to tell it was a control. It now asserts the
 * action colour, `[color:var(--primary)]`, so that reader can. The
 * arbitrary-property spelling is required and not decorative: a plain
 * `text-primary` lands in tailwind-merge's `text-*` group with the type step
 * `SIZE[size]` contributes and is deleted, exactly as `text-foreground` is
 * today, so it would never reach the DOM. `--primary` is the system's action
 * role and is neither a category nor a status colour, so this touches neither
 * axis. Recomputed with `lib/color` against the current chrome tokens, the WCAG
 * ratio clears the 4.5:1 body floor on every surface: 5.48:1 on `--background`
 * and 5.72:1 on `--card` in light, and 8.06:1 on `--background` and 7.31:1 on
 * `--card` in dark. APCA is where this rung is honest about a limit rather than
 * uniformly safe. In light the same pairs reach Lc 75.0 on `--background` and
 * Lc 78.1 on `--card`, at or above the Lc 75 body floor. In dark they fall to
 * Lc 53.7 and Lc 52.9, below that floor and below the Lc 60 large-text floor
 * too, so the dark quiet label passes WCAG and fails APCA. The cause is the ink
 * itself: `--primary` is the shared chrome action colour, and its dark step is
 * fixed in the theme rather than here, so bringing the quiet label to the APCA
 * floor is a change to that token and not to this control. The zero-prop demo
 * carries a quiet `Cancel`, so this is a pair a reader meets, and
 * `button.mdx` names it beside the `primary` label as the two dark-mode APCA
 * shortfalls. This is the one place the system lets ink rather than a fill or a
 * boundary carry a rung of emphasis.
 */
/**
 * WHY ONLY PRIMARY OPTS OUT OF FORCED COLOURS. The four rungs differ only in
 * fill and boundary. A forced-colours theme, which is what a Windows
 * high-contrast reader runs, replaces every author fill and every author ink
 * on a native button with the system's own pair, so without the classes on
 * the `primary` entry below all four rungs render as the same outlined box and
 * the emphasis ladder flattens to one level. Primary alone takes `Highlight`
 * as its fill, `HighlightText` as its ink and `Highlight` as its boundary,
 * which is the platform's own selected pair and the one place a component may
 * name a colour it did not measure, because the platform guarantees the pair
 * clears its own contrast floor. `forced-color-adjust-none` is scoped to the
 * primary rung alone: the other three keep the platform's rendering, so the
 * ladder holds two levels rather than one. `background-color` and not the
 * `background` shorthand, because the shorthand would also reset
 * `background-image`.
 */
const TONE: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary [color:var(--primary-foreground)] hover:bg-state-primary-hover active:bg-state-primary-press not-disabled:aria-busy:bg-state-primary-press forced-colors:[background-color:Highlight] forced-colors:[color:HighlightText] forced-colors:border-[Highlight] forced-colors:forced-color-adjust-none",
  secondary:
    "border-border bg-card [color:var(--foreground)] hover:bg-state-hover active:bg-state-press not-disabled:aria-busy:bg-state-press",
  quiet:
    "border-transparent bg-transparent [color:var(--primary)] hover:bg-state-hover active:bg-state-press not-disabled:aria-busy:bg-state-press",
  destructive:
    "border-foreground bg-transparent [color:var(--foreground)] hover:bg-state-hover active:bg-state-press not-disabled:aria-busy:bg-state-press",
}

/**
 * The boundary width per variant, as the token rather than as a number.
 *
 * It is an inline style and not a class on purpose. Tailwind can take a border
 * width from a custom property, but a spelling that fails to compile produces
 * no declaration and no error. The failure mode here is a secondary button
 * that silently loses its only boundary, which is the one thing that keeps it
 * visible in greyscale and under a reader stylesheet that strips backgrounds. A
 * declared `borderStyle` travels with it because the width alone does nothing
 * without it in a project whose reset differs from this one.
 */
const EDGE: Record<ButtonVariant, string> = {
  primary: "var(--opsin-border-hairline, 1px)",
  secondary: "var(--opsin-border-hairline, 1px)",
  quiet: "var(--opsin-border-hairline, 1px)",
  /* Hairline like the rest. The destructive rung is told apart by its
     boundary ink in `--foreground`, not by width; the emphasis width is the
     status axis's own carrier and no longer appears in this file. */
  destructive: "var(--opsin-border-hairline, 1px)",
}

/**
 * Padding and type step per size.
 *
 * `md` takes the headline step, which is body size at weight 600. The ramp
 * carries `subheadlineEmphasis`, which is subheadline's geometry at headline's
 * weight, so `sm` points at it and is narrower and a smaller type step without
 * becoming lighter. A component that reached for `font-medium` here would be
 * authoring a weight the type scale does not own, and pointing at a ramp step
 * is not that.
 *
 * Neither size sets a height. The height floor is the target minimum, applied
 * below, and it is the same for both. `sm` is narrower and quieter, never
 * shorter. `density-and-touch` is unambiguous that compact must not become
 * harder to hit.
 */
const SIZE: Record<"sm" | "md", string> = {
  sm: "gap-opsin-1 px-opsin-3 py-opsin-1 text-opsin-subheadline-emphasis",
  md: "gap-opsin-2 px-opsin-5 py-opsin-2 text-opsin-headline",
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /**
   * Emphasis. Four values, in descending order: `primary`, `secondary`,
   * `quiet`, `destructive`. One primary per surface. The hierarchy is the
   * answer to "what should I do here?", and three primaries answer it with a
   * shrug. Defaults to `secondary`, because the safe default is the one that
   * does not claim to be the most important thing on the screen.
   */
  variant?: ButtonVariant
  /**
   * Visual weight only. Both sizes clear the 44pt target floor; `sm` is
   * narrower and takes a smaller type step at the same weight, and is never
   * shorter. Defaults to `md`.
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
   * value you pass wins, so submitting is one word away. It is a word you have
   * to write, though.
   */
  type?: "button" | "submit" | "reset"
  /**
   * An optional glyph beside the label. Always decorative and always hidden
   * from assistive technology. The label carries the meaning, and an announced
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
   * disappearing. What a sighted reader sees is the press tone, the same fill a
   * tap gives, held for the duration and paired with a busy glyph in the icon
   * slot, so a busy control reads as working rather than as a live control that
   * does nothing when pressed. What assistive technology is told is EXPOSED on
   * the control as `aria-busy` plus `aria-disabled`; whether any screen reader
   * says anything about it has not been tested here, and `aria-busy` on a
   * control that is not a live region is a hint rather than a promise. The glyph
   * replaces the icon slot, so a button that has no icon grows by one glyph when
   * it becomes busy; give a button an icon if its width must not move. An icon
   * settles the glyph alone: a `busyLabel` adds its word to the same slot beside
   * the glyph, so a control that passes one widens on becoming busy whatever its
   * icon, and only `fullWidth` or a container that fixes the width holds it
   * steady then.
   */
  busy?: boolean
  /**
   * The product's own word for what a busy control is doing, `Saving` or
   * `Sending`, supplied by the product and never invented or translated by
   * opsinjs. When `busy` is set and this is a non-empty string, it renders as a
   * visible word beside the busy glyph and, unlike the glyph, reaches the
   * accessibility tree. That word is the state's static carrier: a reader who
   * turned motion off sees a still glyph and the word rather than a spin, and a
   * reader who cannot see the glyph at all still has the word. Leave it unset
   * and a busy control shows the glyph alone, which under reduced motion is a
   * still glyph and the unchanged label with no word for what is happening. The
   * word occupies the busy slot beside the glyph, so a control that passes it
   * grows wider when it becomes busy, an icon notwithstanding; give the control
   * `fullWidth`, or a container that fixes its width, if that width must not
   * move under the reader's thumb.
   */
  busyLabel?: string
  /**
   * Fills its container. For the bottom of a sheet or a form, where the primary
   * action should be as wide as the thumb's reach. Not for a row of buttons,
   * because two full-width buttons stacked read as two primary actions.
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
  busyLabel,
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
        "There is no icon-only Button. If the design calls for one, it needs " +
        "its own name and its own target rules.",
    )
  }

  /* Tabindex above zero is banned outright by `accessibility/keyboard-and-focus`:
     it reorders the whole document rather than this control, and the damage
     lands on a page nobody testing this button will have open. `ButtonProps`
     extends ButtonHTMLAttributes, so `tabIndex` is part of the public surface
     and reaches the DOM through the spread below. This file cannot make the
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
     element left in the tree. Asking for both at once is a contradiction. The
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
     Busy REPLACES the icon and never the label. The label is the reader's
     record of what they pressed, and a control whose name disappears while it
     works is a control that has lost their place. */
  const hasBusyLabel =
    busy && typeof busyLabel === "string" && busyLabel.trim() !== ""
  const slot = busy ? (
    <span
      data-slot="button-busy"
      /* The span is hidden from assistive technology only when it carries no
         word. With a `busyLabel` the word is the state's carrier for a reader
         who cannot see the glyph, so the span stays in the accessibility tree
         and each glyph hides on its own instead. Without one, the span is
         decorative in full and hides as before. */
      aria-hidden={hasBusyLabel ? undefined : "true"}
      className="inline-flex shrink-0 items-center gap-opsin-1"
    >
      {/* ROTATION IS COLLAPSED UNDER `prefers-reduced-motion: reduce`, AND A
          STILL GLYPH STANDS IN FOR IT. `foundations/motion/reduced-motion`
          collapses rotation and names a looping animation as the classic
          offender, and `health/motion-in-health-ui` rule 5 asks every animation
          for a reduced behaviour that is "an instant, complete, equally
          informative state". The still fallback is a glyph: an hourglass, which
          says waiting without saying anything a patient could read as a
          measurement, in place of a frozen arc, which says nothing at all.
          Exactly one of the two glyphs is ever laid out, because `motion-reduce:`
          and its unprefixed default are complementary in Tailwind, so the seat
          is the same width under either preference and the button does not jump
          when the preference changes. `animate-spin` is Tailwind's own keyframe
          rather than an opsinjs motion token, so the spinner is gated by
          `motion-reduce:hidden` here rather than by the per-token reduced-motion
          block. Both glyphs are `aria-hidden` in their own right so that they
          stay decorative even when the span around them is exposed.

          THE STATIC CARRIER A PRODUCT CAN READ IS THE WORD, NOT THE GLYPH. A
          swapped glyph is more informative than a frozen arc but it is still
          only a glyph. Where the caller passes `busyLabel`, the word renders
          beside the glyph and is left in the accessibility tree, so a reader who
          turned motion off perceives the state as a word rather than a shape,
          and a reader who cannot see the glyph perceives it at all. The residual
          gap is a busy control given no `busyLabel`: under reduced motion its
          reader sees a still hourglass and the unchanged label, and no word for
          what is happening, which is honest about what a glyph alone can carry.

          SC 2.2.2 (anything moving for more than five seconds) is satisfied
          under the reduced preference, where nothing here moves. It is still
          unassessed for the default preference, where the rotation may run past
          five seconds while a slow save completes, so this is not a claim that
          the criterion is closed for every reader. */}
      <LoaderCircle
        aria-hidden="true"
        className="size-[1em] animate-spin motion-reduce:hidden"
      />
      <Hourglass
        aria-hidden="true"
        className="hidden size-[1em] motion-reduce:block"
      />
      {hasBusyLabel ? (
        <span data-slot="button-busy-label">{busyLabel}</span>
      ) : null}
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
         after the spread is what stops a JavaScript caller from turning this
         into an anchor or into a non-native control with a synthetic role.
         Anything that forwards a props object wholesale is stopped too. */
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
           button has to grow with it. A truncated label is unreadable and
           unspeakable, and a fixed height is how it happens. */
        "relative inline-flex items-center justify-center whitespace-normal rounded-opsin-md text-center align-middle",
        /* The second piece of motion in this file, and the one that needs no
           branch: `--opsin-duration-fast` collapses to 1ms inside the product
           stylesheet's own reduced-motion block, so the colour change becomes
           instant for a reader who asked for that and nothing here has to know. */
        "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard",
        /* The press acknowledgement, and the only state signal in this file that
           does not depend on colour. `transition-colors` deliberately excludes
           transform, so the shift is instantaneous rather than animated. That
           is what `prefers-reduced-motion` asks a press feedback to be, so this
           needs no reduced-motion branch and behaves identically for everybody. */
        "active:translate-y-px",
        /* Drawn outside the box with an offset, so it never changes layout.
           It IS clipped by an ancestor that clips. An outline is painted by the
           element and an `overflow: hidden` parent eats it, which is a property
           of outlines and not a defect here; a surface that clips has to leave
           room for it. Declared on the component as well as in the product theme
           because a consumer installs this file without that stylesheet. The
           width and the offset read the generated tokens with a 2px fallback
           each, which is the same discipline `EDGE` uses above, so the ring
           follows a consumer who raises `--opsin-border-focus` for a low-vision
           theme and still draws in a project that installed this file without
           the stylesheet. The `length:` hint is required: without it a bare
           `var()` in an arbitrary outline value is read as an outline colour and
           the ring silently loses its width. The colour stays a class,
           `outline-ring`, and not a token, because `--ring` is a product surface
           role and is not a generated token. */
        "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring",
        /* THE TWO UNAVAILABLE STATES LOOK DIFFERENT BECAUSE THEY ARE DIFFERENT,
           and the selectors land on exactly one each. Base UI sets the native
           attribute when `focusableWhenDisabled` is off and `aria-disabled`
           when it is on, so `:disabled` is the caller's own disabled and
           `[aria-disabled]` is `busy`. There is no state where both match. That
           partition holds for `:disabled` against `[aria-disabled]`, and it does
           not hold for `:disabled` against `[aria-busy]`: a caller who
           contradicts themselves by passing `busy` and `disabled` together gets
           the native attribute set while `aria-busy` stays on. So the busy fill
           in TONE is scoped `not-disabled:`, which is `:not(:disabled)`, and
           native disabled therefore outranks the busy fill and keeps its measured
           muted pair rather than rendering `--muted-foreground` ink on a press
           fill at near 1:1.

           Native disabled no longer dims the whole control, and dimming it was
           the bug. A control faded until nobody can read it turns "you cannot do
           this yet" into "you cannot find out what this is", and a group
           `opacity` cannot honour that rule, because it composites the label and
           the fill together over the page and lets both drift towards it: a
           disabled primary's white label fell from 5.58:1 against its own fill to
           2.60:1, and a disabled secondary's boundary to 1.18:1, well under the
           floors the rest of this file clears. So the disabled state swaps in a
           measured neutral pair instead, the `--muted` fill behind
           `--muted-foreground` ink, which reaches 7.04:1 in light and 10.46:1 in
           dark, both clear of the 4.5:1 body floor, inside a `--border` boundary
           at 4.27:1 light and 3.27:1 dark, both clear of the 3:1 non-text floor.
           That is the theme's own body-on-muted pairing, so the control reads as
           unavailable without becoming unreadable, and it holds on every variant
           because each `disabled:` class outranks the rung's own fill, ink and
           boundary at the `:disabled` pseudo-class. Nothing in the corpus renders
           a disabled Button, so this has source-and-token evidence and no
           screenshot, and the page's own "Contrast, for every variant" bullet
           still does not list the disabled state.

           Busy does NOT take the muted pair, for the reason the fade argument
           gives and a further one: the label is the reader's record of what they
           pressed, so it has to stay at full contrast while the work happens, and
           muting it would say the control is unavailable when the truer thing to
           say is that it is working. So busy takes the press tone instead,
           through the `not-disabled:aria-busy:` fill in TONE. That tone is one of the opaque
           state roles, not an alpha wash, so the label's contrast is measured
           rather than left to whatever sits behind it: `--primary-foreground`
           reaches 7.88:1 on the light primary press fill and 10.47:1 on the dark
           one, both clear of the 4.5:1 body floor. That is why busy also departs
           from the report's `bg-primary/80`, which is an alpha fill that
           composites with the page and drops the label to 3.78:1 on
           `--background` and 3.75:1 on `--card`, below the floor. The busy glyph
           is a second signal, not the only one.

           They part ways on pointer events. The natively disabled control
           drops them, because it is not a target and a tap on it should mean
           nothing. The busy control keeps them. `pointer-events: none` would
           forward an impatient second tap to whatever sits behind the button,
           and on a card that is a link or a row that navigates that carries the
           reader away in the middle of the save they are still waiting on. The
           class also bought no correctness: Base UI's own `useButton` swallows
           activation while `aria-disabled` is set, so the press was already
           refused without it. What the busy control takes instead is
           `cursor-progress`, so the pointer itself says wait, which
           `pointer-events: none` would have hidden along with the hover it was
           there to suppress. Keeping the events also restores `:active` on a
           control that refuses activation, so `aria-disabled:active:translate-y-0`
           cancels the 1px press nudge: the impatient tap is swallowed here rather
           than forwarded, and a control that answers no activation gives no press
           movement either, because there is no press to acknowledge. The hover
           fill is suppressed anyway, because the busy fill in TONE now carries a
           `not-disabled:` guard as well, which lifts it above the plain `hover:`
           fill on specificity, so it wins whether or not the pointer is over the
           control. Neither state touches the tab order. Busy keeps its stop by construction, and a natively disabled
           control loses it to the platform rather than to this rule. */
        "disabled:bg-muted disabled:[color:var(--muted-foreground)] disabled:border-border disabled:pointer-events-none",
        "aria-disabled:cursor-progress aria-disabled:active:translate-y-0",
        TONE[variant],
        SIZE[size],
        fullWidth ? "w-full" : null,
        className,
      )}
    >
      {/* Button.Target is the hit area, and the reason it is an element rather
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

/* The three fragments every card action is built from. `FLOOR` is the target
   minimum in both axes, `BOX` is the flex box that carries it, and `RING` is
   the focus outline. They are declared once so the arms below cannot drift in
   the parts they share. Not exported: a caller composes an action through
   `cardActionClassName`, not by reassembling the fragments. */
const CARD_ACTION_FLOOR =
  "min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)"
const CARD_ACTION_BOX = `inline-flex ${CARD_ACTION_FLOOR} max-w-full items-center justify-center`
const CARD_ACTION_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/**
 * The card action recipe: the class list for a single action rendered on a
 * card, a banner or an empty state, spelled once so the surfaces that draw one
 * cannot drift.
 *
 * WHY IT LIVES IN BUTTON.TSX. A card action is either an anchor or a Button, and
 * the `as: "button"` arms return only the delta Button does not already bring,
 * so the recipe and the control have to share a file to stay in step. The
 * alternative homes are worse. A new direct child of `registry/bases/base/` is
 * collected by `scripts/build-registry.mts` as a component with its own `/view`
 * route, and that route resolves a preview as `(await entry.component()).default`,
 * which a module of class strings has not got. `lib/opsinjs.ts` ships with every
 * installed component but holds runtime data and pure functions, and a consumer's
 * Tailwind content scan is guaranteed to reach the files `shadcn add` writes
 * beside their components and is not guaranteed to reach their `lib/`, so class
 * strings placed there can arrive with no CSS. `button.tsx` is already a
 * `registryDependency` of all four action-bearing cards and is already imported
 * by each, so this export costs no new dependency, no new registry item and no
 * catalogue row.
 *
 * WHY THE EXPORT AT ALL. The substrate contract fixes a registry file at three
 * public exports, the props interface, the component and the zero-prop demo, and
 * several registry files state the rule. This is a departure, and what buys it is
 * real: the `ACTION_LINK` constant was byte-identical in `alert-banner.tsx`,
 * `result-card.tsx` and `empty-state.tsx`, `disclaimer-note.tsx` carried a fifth
 * anchor, and `care-card.tsx` re-spelled Button's own fills by hand because
 * Button's `TONE` is private. One recipe replaces all of them, so a change to how
 * an action looks is made here and nowhere else.
 *
 * WHY IT CONCATENATES RATHER THAN MERGES. `cn` is `twMerge(clsx(...))` with
 * tailwind-merge unconfigured, so a `text-*` colour class and a `text-opsin-*`
 * type step land in one conflict group and one of them is deleted, which is the
 * trap the `TONE` comment above spells out. The four original `ACTION_LINK`
 * constants were template-joined for exactly this reason, and so is this. Every
 * neutral ink is the arbitrary property `[color:var(--foreground)]` for the same
 * reason, and so is the quiet neutral button arm, which carries the same
 * `[color:var(--foreground)]` its link twin does. A tinted arm asserts no ink
 * and no fill: on a status tint the ink is the level's own `-ink` role, which
 * the caller's surface supplies, and the recommended tinted arm brings a 2px
 * boundary whose colour the caller passes per level beside this return. Nothing
 * here names a status colour, so the two colour axes never meet on one class
 * list. The neutral quiet button arm now carries its own ink for a reason the
 * link arms never had: `Button`'s `quiet` variant asserts `[color:var(--primary)]`
 * of its own, the shared action role, so a quiet button that supplied no ink
 * fell through to the brand colour while its anchor twin stayed foreground, and
 * the same alternative action drifted by transport. Asserting
 * `[color:var(--foreground)]` on the neutral button arm reconciles both
 * transports on one ink at this shared source: it wins because it is an
 * arbitrary property, so `cn()` files it in the same `color` group as Button's
 * `[color:var(--primary)]` rather than beside a type step, and because the
 * caller's `className` is the last argument to Button's own `cn()`. The tinted
 * button arm still asserts no ink, so a tinted caller who supplies the level's
 * `-ink` role by inheritance keeps it. Such a caller must supply that ink above
 * a single class, which a descendant wrapper like `alert-banner.tsx`'s
 * `[&_button]:` selector carrying the level's own `-ink` role already does, or
 * pass it as its own arbitrary property in `className`, which wins because
 * `cn()` puts the caller's classes last.
 *
 * WHY THE WEIGHT UNION HAS NO BRAND OPTION. The `weight` union is
 * `"recommended" | "quiet"` and carries no brand-filled arm, because a card's
 * primary action is neutral and bordered rather than brand-filled. The argument
 * is already written in the tree in two places, and both are load-bearing.
 * `alert-banner.tsx:545-558` refuses a brand fill on a status surface, because
 * `Button variant="primary"` would need a measured contrast pair on each of the
 * four tints in two themes, which is eight measurements for one control that
 * nobody has taken, so the link branch was given a neutral opaque fill instead.
 * `result-card.tsx:155-160` refuses a fill for a different reason: `bg-primary`
 * sits on the card's own ground, so the fill that is meant to mark the action
 * out is the card's ground and marks nothing. A brand-for-everything rule would
 * have to exempt AlertBanner, and a rule with an exemption that large is not a
 * rule, so the recipe makes a brand card action unreachable at the type level.
 *
 * `ButtonVariant` is untouched, and this restriction is not a deprecation of
 * Button `primary`. `primary` is still available for a form submit inside a
 * Dialog or a Sheet, where the ground is neutral and the control is the only
 * action on the surface. The restriction on a brand fill is on the card action,
 * not on Button.
 */
export function cardActionClassName(options: {
  weight: "recommended" | "quiet"
  ground?: "neutral" | "tinted"
  as: "link" | "button"
}): string {
  const { weight, ground = "neutral", as } = options

  if (as === "button") {
    /* The caller renders a real <Button>, whose TONE and SIZE supply the box,
       the fill and the type step. Only the delta is returned here. The tinted
       recommended arm still needs the boundary and the radius, because a tinted
       Button brings neither; the caller passes the level's line colour beside
       this return. A Button with neither a fill nor a boundary takes the
       underline so a handler-form action never reads as a paragraph. */
    if (weight === "recommended") {
      return ground === "tinted"
        ? "rounded-opsin-md border-2 underline underline-offset-4"
        : ""
    }
    /* The quiet neutral button arm asserts the same neutral ink the quiet
       neutral link arm does, `[color:var(--foreground)]`, so a quiet card
       action is foreground ink whether the caller passes `href` or `onSelect`.
       Without it a `<Button variant="quiet">` falls through to Button's own
       `TONE.quiet`, which is `[color:var(--primary)]`, the shared action role,
       and the same alternative action then reads brand blue on a handler and
       foreground ink on an anchor, the drift by transport the recipe exists to
       remove. The ink wins because it is spelled as an arbitrary property and
       arrives last: `cn()` files `[color:var(--foreground)]` and Button's
       `[color:var(--primary)]` in one `color` conflict group, and the caller's
       `className` is the last argument to Button's own `cn()`, so the recipe's
       ink outranks the rung's. The tinted arm still asserts no ink, because on
       a status tint the surrounding ink is the level's own `-ink` role, which
       the caller's surface supplies, and a neutral ink there would put a chrome
       colour on a status surface nothing has measured. */
    return ground === "tinted"
      ? "underline underline-offset-4"
      : "underline underline-offset-4 [color:var(--foreground)]"
  }

  /* as === "link". The anchor brings nothing of its own, so the recipe returns
     the whole class list: the box, the type step, the ink, the underline and
     the ring, plus a fill and a boundary on the neutral recommended arm only. */
  if (weight === "recommended") {
    return ground === "tinted"
      ? `${CARD_ACTION_BOX} rounded-opsin-md border-2 px-opsin-5 py-opsin-2 ` +
          "text-center text-opsin-headline underline underline-offset-4 " +
          `hover:bg-muted ${CARD_ACTION_RING}`
      : `${CARD_ACTION_BOX} rounded-opsin-md border border-border bg-card px-opsin-5 py-opsin-2 ` +
          "text-center text-opsin-headline [color:var(--foreground)] underline underline-offset-4 " +
          `hover:bg-muted ${CARD_ACTION_RING}`
  }
  return ground === "tinted"
    ? `${CARD_ACTION_BOX} px-opsin-2 py-opsin-1 ` +
        "text-center text-opsin-subheadline underline underline-offset-4 " +
        `hover:bg-muted ${CARD_ACTION_RING}`
    : `${CARD_ACTION_BOX} px-opsin-2 py-opsin-1 ` +
        "text-center text-opsin-subheadline [color:var(--foreground)] underline underline-offset-4 " +
        `${CARD_ACTION_RING}`
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it into a
 * consumer's project, so it is reviewed public code rather than a scratch
 * demo. It shows the four variants together because the only question worth
 * answering at a glance is whether the emphasis ladder reads as a ladder.
 * That question is worth asking in greyscale, where three of the four rungs
 * have only fill and boundary to be told apart by. The boundary is now
 * measured: `destructive`'s `--foreground` edge reaches 18.12:1 on
 * `--background` and 18.61:1 on `--card` in light, and 17.53:1 and 15.96:1 in
 * dark, well clear of the 3:1 non-text floor, so the ladder is carried by the
 * styling rather than propped up by the words below it.
 *
 * The shape obeys two rules and each names a source. One primary per surface,
 * per `foundations/space/density-and-touch`: the first row holds a single
 * filled primary, then secondary and quiet in descending weight. And a
 * destructive control is separated from the rest rather than set beside it, per
 * `accessibility/target-size-and-motor`, which is why Delete sits on its own
 * row under a `gap-opsin-4` step and is never a thumb-slip from Save or Add.
 * `sm` and `busy` are left to their own examples: a size is not a rung of
 * emphasis, `busy` already has a worked example, and folding either into the
 * row is what made the ladder wrap into four lines on a phone.
 *
 * No two controls here share an accessible name, and that is deliberate. ADR
 * 0009 makes this the file people copy first, and a voice-control user who says
 * "click Save example reading" against two identical labels gets a
 * disambiguation prompt rather than the action they asked for.
 *
 * The labels name a fictional reading (ADR 0012). No number, no unit, nothing a
 * screenshot could be mistaken for.
 */
export default function ButtonDemo() {
  return (
    <div className="flex flex-col gap-opsin-4">
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="primary">Save example reading</Button>
        <Button variant="secondary">Add a note</Button>
        <Button variant="quiet">Cancel</Button>
      </div>
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="destructive">Delete this example reading</Button>
      </div>
    </div>
  )
}
