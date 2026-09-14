"use client"

/**
 * Term shows a clinical word with its everyday meaning attached, so a sentence
 * can be read without leaving it.
 *
 * A DEFINITION SAYS WHAT A THING IS. It does not say what the reader should do
 * about theirs, and this file has no way to make it. There is no `status`, no
 * `severity`, no action slot and no `href`: everything Term can render is the
 * word, its full form, and one sentence of plain English that came out of a
 * glossary somebody reviewed. *Chronic means long-lasting* is a translation;
 * *chronic means you will have this for life* is a prognosis, and the shape of
 * the API is the only thing that reliably keeps the second one out.
 *
 * THE THREE PRIMITIVES THAT LOOK RIGHT AND ARE NOT. `term.mdx:118-120` says the
 * definition "is never removed from the accessibility tree by a presentation
 * choice… a reader using speech has no way to know something is there to open",
 * and `term.mdx:205-206` says the word "is never split from its definition in
 * the reading order". Those two sentences rule out every disclosure primitive in
 * `@base-ui/react`, and they rule them out for different reasons:
 *
 *   - `preview-card` opens on hover. This is a phone-first system and there is
 *     no hover on a phone, which is also why `present` has no `hover` value.
 *   - `popover` portals its content to the end of the document and hides it
 *     from assistive technology while closed. Both halves fail: the definition
 *     leaves the sentence, and a speech reader meets a control with nothing
 *     behind it until they guess to press it.
 *   - `collapsible` keeps the panel adjacent, which fixes the reading order, but
 *     its closed panel carries the `hidden` attribute even with `keepMounted`.
 *     `hidden` is exactly what "removed from the accessibility tree" means.
 *
 * So the disclosure here is hand-built, and it is built the other way round: the
 * definition is ALWAYS in the accessibility tree, and the control changes only
 * whether it is on the screen. Collapsed, it is `display: none` and reaches the
 * reader as the trigger's accessible DESCRIPTION. A node referenced by
 * `aria-describedby` is included in the name-and-description computation whether
 * or not it is displayed, which is the one hiding mechanism that keeps a promise
 * instead of breaking it.
 *
 * IT IS A CLIENT COMPONENT, ALL OF IT, AND THAT IS A COST RATHER THAN A CHOICE.
 * Only the disclosure needs state; the inline presentation is a span and two
 * strings. But `"use client"` is a file-level directive and a component is one
 * flat file in this registry, so the boundary lands on the whole component or
 * on none of it. Splitting the leaf into a second file would put a non-component
 * into `registry/bases/base/`, where the generator registers every direct child
 * as a component and would publish a route for half of this one.
 *
 * WHERE THE DEFINITIONS COME FROM, AND WHY NOT FROM A PROP. `term.mdx:155-158`
 * refuses a per-call-site definition outright: definitions live in a glossary so
 * they are consistent across every screen, reviewable in one place, translatable
 * and countable. A product can then ask *how many words are we asking our
 * readers to learn?* and get an answer. So the glossary arrives once, through
 * <TermGlossaryProvider>, and `id` is a key into it.
 *
 * A CONFLICT WITH THE AUTHORED GLOSSARY, PART NOW SETTLED AND PART STILL OPEN.
 * `tokens/glossary.json`'s `policy.rule` reads: "Plain wording is the
 * default and the clinical term is the annotation, never the other way around.
 * `<Term>` renders the plain wording as the visible text and exposes the
 * clinical term on demand; it must not render a clinical term with a tooltip
 * and call that plain English." This file does the reverse: the visible text is
 * the clinical word, and the plain wording is either attached in parentheses or
 * put behind a control. The argument for the implemented direction is the one
 * in `GlossaryEntry.word` below, and the same policy block makes it itself when
 * it explains why `showBoth: "always"` exists. A reader holding a printout has
 * to be able to match it to the screen. Both statements are in the same file and
 * they contradict each other, and neither this component nor the glossary may
 * settle the whole of it alone. The narrower half is now settled: where a call
 * site expresses no preference and leaves the presentation to `auto`, the
 * glossary's `always` governs, so both readings go on the screen inline rather
 * than the plain wording being hidden behind a press. What stays open is the
 * shape itself, whether the visible text should be the plain wording with the
 * clinical spelling as the annotation rather than the other way around. That is
 * a change to this component and to `policy.rule` together, so it is recorded
 * here and on `term.mdx` rather than settled quietly.
 */

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One word the product has decided its readers should not have to look up.
 *
 * The shape is the shape of `tokens/glossary.json` in this repository, minus the
 * authoring fields, so a product that already keeps its vocabulary in that form
 * can hand it straight to the provider. It is deliberately not imported from
 * anywhere: this file ships into other people's projects, the glossary is
 * theirs, and a component that arrived with 36 opinions about what English words
 * mean would be opsinjs writing clinical content for a product it has never
 * seen.
 */
export interface GlossaryEntry {
  /** The key a call site writes: `<Term id="egfr">`. Unique in the glossary. */
  id: string
  /**
   * The clinical word, spelt the way it appears on the reader's own paperwork.
   * That spelling is the point of showing it at all. A reader holding a printed
   * result and looking at a screen has to be able to match the two.
   */
  word: string
  /**
   * The everyday meaning. One sentence, and it says what the word IS. It is
   * never what to do, never what it means for this reader, and never a
   * reassurance.
   */
  plain: string
  /**
   * The full form, when `word` is an abbreviation. An expansion is a different
   * thing from a definition and most readers need both: expanding *eGFR* to
   * *estimated glomerular filtration rate* still explains nothing on its own.
   */
  expansion?: string
  /**
   * How the word is spoken, when speech synthesis would otherwise read it as a
   * word: `SpO2` is said as its letters and is not *spoh-two*. Write it as the
   * letters separated by spaces. Omitted means the written form is the spoken
   * form, which is true of nearly every entry.
   */
  speech?: string
  /**
   * The glossary's own policy for this entry, carried through unchanged from
   * `tokens/glossary.json`. The three values are the glossary's, not this
   * component's, and only one of them reaches the rendering.
   *
   * `plain-only` is the one that changes what is rendered, and it changes it
   * completely: that value means the clinical word is never shown to the reader
   * and the entry exists so an author can look up what to write instead. With no
   * children, Term honours it by rendering the plain wording as ordinary text
   * and marking nothing, because there is no clinical word on the screen to
   * explain. When a call site does supply `children`, Term renders them, because
   * a runtime cannot rewrite a sentence, and it warns in development that the
   * entry says the clinical word should not reach a reader. See
   * `TermProps.children`.
   *
   * `always` GOVERNS THE `auto` PATH. The glossary defines it as showing the
   * clinical word and the plain wording together every time, for matching a
   * printout, and where a call site leaves the presentation to `auto` that is
   * what it gets: the definition is shown inline whatever its length. What
   * `always` does not do is overrule the call site. An explicit `present` and
   * `once` still win over it, because they are the surface's own statements about
   * this occurrence and a component does not overrule the surface it stands on.
   * An `always` entry that a call site puts behind a press by naming
   * `present="disclosure"` on a first appearance warns in development.
   *
   * `first-use` is likewise the caller's to express, through `once`: opsinjs
   * cannot see where one surface ends and the next begins, which is the same
   * reason `once` is a prop rather than a count.
   *
   * There is no default. An entry that omits the field takes the budget path: it
   * is shown inline when it is short enough to share the line and behind a
   * control when it is not, which is not the same as `always`, since `always` is
   * shown inline whatever its length.
   */
  showBoth?: "always" | "first-use" | "plain-only"
}

/**
 * The glossary, as a lookup, with an empty one as the default.
 *
 * Empty rather than absent, because the honest behaviour for a Term outside any
 * provider is the same as the behaviour for an id nobody has defined: render the
 * word, mark nothing, and say so in development. A thrown error would take a
 * reader's whole screen down over a missing dictionary entry.
 */
const GlossaryContext = createContext<ReadonlyMap<string, GlossaryEntry>>(
  new Map(),
)

export interface TermGlossaryProviderProps {
  /**
   * Every term this subtree can name. Hoist it to a module constant: it is
   * rebuilt into a lookup whenever its identity changes, and an array literal
   * written inline in JSX is a new identity on every render.
   *
   * It may be handed straight across the server/client boundary. A plain array
   * of plain objects is serialisable, so the definitions can be read from a file
   * on the server and never reach the browser as code.
   */
  glossary: readonly GlossaryEntry[]
  children: ReactNode
}

/**
 * Mount this once, around everything that reads.
 *
 * A React context rather than a module-level registry, for two reasons that
 * both matter in a Next.js application. A module singleton exists once per
 * module graph, so a glossary registered on the server is not the glossary a
 * client component sees, and the failure is invisible until a term goes blank in
 * the browser. And a provider nests: a specialist area of a product can supply a
 * second, narrower glossary for its own subtree without editing the first.
 */
export function TermGlossaryProvider({
  glossary,
  children,
}: TermGlossaryProviderProps) {
  const lookup = useMemo(() => {
    const map = new Map<string, GlossaryEntry>()
    for (const entry of glossary) {
      /* A duplicate id is a silent defect otherwise: the second entry wins, the
         first one's definition never appears anywhere, and nothing in the
         interface looks wrong. Both texts are plausible English, so a reviewer
         reading the screen cannot tell which one they are looking at. */
      if (isDevelopment() && map.has(entry.id)) {
        warn(
          `duplicate:${entry.id}`,
          `two glossary entries share the id "${entry.id}". The later one wins ` +
            "and the earlier definition is unreachable. Ids are how a call site " +
            "names a definition; two definitions cannot share one.",
        )
      }
      map.set(entry.id, entry)
    }
    return map
  }, [glossary])

  return (
    <GlossaryContext.Provider value={lookup}>
      {children}
    </GlossaryContext.Provider>
  )
}

/** The point at which the warning channel stops rather than grows. */
const MAX_WARNED_KEYS = 500

/** Not a real key. It only records that the cap notice has been printed. */
const CAP_KEY = "\u0000cap"

const warnedKeys = new Set<string>()

/**
 * The development channel, and it is deliberately not an OPSIN code.
 *
 * `tokens/errors.json` has no entry for a term that is not in the glossary, and
 * a component may not mint one: the codes are a versioned contract and the table
 * on the errors page is generated from that file. Until an entry exists this is
 * the honest channel. It warns and renders; taking a word out of a sentence
 * because its definition is missing would break the sentence as well as the
 * definition.
 *
 * ONCE PER OFFENDING CALL SITE, WHICH IS WHAT THE KEY IS FOR. Every one of these
 * is raised during render, so an unkeyed channel reports a screen's four
 * unresolved terms on every render and twice again under Strict Mode, and a
 * warning channel that degrades into noise is one somebody switches off.
 * `tokens/errors.json`'s policy block, which `lib/opsinjs.ts` quotes, asks for
 * "once per offending call site". `warnOnce` itself still cannot be reused here,
 * because it is keyed on an `OpsinErrorCode` and there is no code for any of
 * this; but the de-duplication is independent of the code table, so the shape is
 * borrowed rather than the function, cap and all. The cap exists because the set
 * is never cleared and a development session can run for days.
 */
function warn(key: string, message: string): void {
  if (!isDevelopment()) return
  if (warnedKeys.has(key)) return

  if (warnedKeys.size >= MAX_WARNED_KEYS) {
    if (warnedKeys.has(CAP_KEY)) return
    warnedKeys.add(CAP_KEY)
    report(
      `${MAX_WARNED_KEYS} distinct warnings have been reported in this session, ` +
        "so this channel is now quiet. Fix what is already reported, or reload " +
        "to start counting again.",
    )
    return
  }

  warnedKeys.add(key)
  report(message)
}

function report(message: string): void {
  try {
    console.warn(`[opsinjs] <Term> ${message}`)
  } catch {
    /* A patched or absent console is not a reason to take a health product
       down. */
  }
}

/**
 * An empty string is an absent field, not a present one.
 *
 * `??` catches `null` and `undefined` and nothing else, so a glossary row whose
 * column was exported but never filled in resolves to `""` and is then treated
 * as a value somebody wrote. That is not a hypothetical shape: a spreadsheet
 * export and a half-finished translation pass both produce it, and a
 * product-owned glossary is authored in exactly those two ways. Left alone it
 * renders a bare comma after nothing, or " ()" after a word, or a hole in the
 * middle of a clinical sentence. Trimmed as well as compared, because a cell
 * holding one space is the same defect wearing a different coat.
 */
function filled(field: string | undefined): string | undefined {
  const trimmed = field?.trim()
  return trimmed === undefined || trimmed === "" ? undefined : trimmed
}

/**
 * How long an attached definition may be before it stops being a parenthetical.
 *
 * A typographic budget, not a clinical threshold. The surface a definition
 * actually lands on is the comfortable measure, `--opsin-measure-comfortable` at
 * 66ch, which the demo and both examples set; the tight measure is for narrower
 * columns this component does not sit in. A parenthetical that occupies up to
 * about one and a quarter lines of that measure still interrupts the sentence it
 * sits in, and past that it replaces it, which is why the budget is 80 rather
 * than the 40 it once was.
 *
 * The number is derived out loud because it is checkable against this
 * repository's own glossary, so read it against the code as it stands rather
 * than against an earlier version of this file. 80 is the threshold on the
 * budget path only, which is an entry the glossary has not marked `always`,
 * because an `always` entry is shown inline whatever its length before the
 * budget is ever consulted (see `resolvePresentation`). Three entries in
 * `tokens/glossary.json` run past 80 counting plain plus expansion: systolic at
 * 90, blood pressure at 88 and diastolic at 85. Of those only blood pressure
 * reaches the budget at all, because systolic and diastolic are `always` and go
 * inline regardless, so run over the whole glossary the auto path puts 35 of the
 * 36 entries inline and leaves exactly one behind a control, blood pressure. The
 * number an author should act on is therefore the budget for an entry the
 * glossary has not marked `always`: keep such a definition inside 80 characters
 * and the reader gets it without pressing anything.
 *
 * It is still counted rather than measured, for the hydration reason argued at
 * `resolvePresentation` below: a width is knowable only in the browser, and
 * measuring after the server has already rendered the other branch is a flash on
 * every phone, while a character count is knowable identically on both sides.
 */
const INLINE_BUDGET = 80

/**
 * The mark that says an explanation exists.
 *
 * A dotted underline and nothing else. Not a colour: `term.mdx:79-81` puts Term
 * outside both axes, and a word tinted from the category ramp looks like a
 * status while a word tinted from the status ramp IS one. The underline survives
 * greyscale, increased contrast and a black-and-white printout, which is the
 * whole reason it is the carrier.
 *
 * The offset is in `em` and not in pixels, which is the one length in this file
 * that could have opted out of the reader's own text size. A fixed 4px offset
 * against glyphs a low-vision reader has doubled in order to read them puts the
 * rule into the descenders of the word it is marking. The sole affordance, and
 * the sole non-colour carrier, would then degrade precisely for the reader it
 * matters most to. There is no token for an underline offset, so this is a
 * judgement rather than a token lookup.
 *
 * The thickness is in `em` too, and for the same reason. The mark is the sole
 * affordance and the sole non-colour carrier, so it has to stay legible to a
 * reader who has enlarged their type, and the default `auto` thickness pins at
 * roughly one device pixel and barely grows when they do. `decoration-[0.12em]`
 * is about 2px at the 1.0625rem body size and about 4px at 200%, so the rule
 * thickens with the word rather than staying a hairline a phone reader may never
 * notice. There is no token for an underline thickness, so this is a judgement
 * stated as one, the same judgement the `em` offset makes two lines above.
 *
 * The 2026-09-05 audit also asked for a resting `bg-muted` tint on every
 * clinical word, and this file departs from that half of the proposal and says
 * why. A resting tint on every clinical word would stripe a paragraph that holds
 * three of them, which is a worse read for the older reader this finding is
 * about, and a running text peppered with filled boxes is harder to follow than
 * one marked only where the eye needs to stop. The tint is also already
 * spoken for: `TRIGGER_BUTTON` spends three theme fills on hover, press and open,
 * so a fourth fill sitting under the word at rest would compete with the states
 * rather than rest beneath them. So the resting cue is thickness and the tint
 * means state.
 *
 * A press moves the word down by one pixel. The dotted underline is the resting
 * mark, the ring is focus, and `active:translate-y-px` is the press: it is the
 * same one-pixel shift `button.tsx` uses, and it is the only state a thumb can
 * see, because a term sitting inside a paragraph has no hover on a phone. It is a
 * transform and not a fill, so it adds no colour to a word that is deliberately
 * outside both axes.
 *
 * It is dropped in print, where the definition is expanded beside the word and a
 * mark promising something further would be promising nothing.
 *
 * The rule is dotted while the definition is hidden and solid while it is
 * showing: `aria-expanded:decoration-solid` turns the dots into a continuous
 * line the moment the word is opened. The dotted rule is a promise that
 * something further exists, and while the definition is on the screen beside the
 * word that promise has been kept, so the mark stops hinting and settles. This
 * is a change of form and not of colour, so it survives greyscale exactly as the
 * resting mark does, and it never carries the open state alone: `aria-expanded`
 * carries it to assistive technology and the definition appearing beside the
 * word is the primary signal to everyone.
 */
const TRIGGER_MARK =
  "underline decoration-dotted decoration-[0.12em] underline-offset-[0.25em] aria-expanded:decoration-solid active:translate-y-px print:no-underline"

/**
 * The button, stripped back to the word it contains.
 *
 * A `<button>` does not reliably honour `display: inline`. The engine computes
 * it as an inline-block whatever the class asks for, and the 2026-09-05 layout
 * audit is the proof: the trigger measured 45 by 44 on a 22px line. So vertical
 * padding on it is not free, and none is carried. An earlier version paid that
 * padding in the belief that the box was inline and that the padding left the
 * line box alone; the measurement disproved both, and every line that held a
 * term was taller than its neighbours.
 *
 * The product theme floors every `button` at `--opsin-target-minimum`, and this
 * one is opted out of that floor by name with `[min-block-size:0]` and
 * `[min-inline-size:0]`. It relies on SC 2.5.8's exemption for a target that is
 * inline in a sentence, which `accessibility/target-size-and-motor` asks to be
 * named out loud rather than assumed. The arbitrary-property spelling is
 * deliberate: `[min-block-size:0]` names the very property `product.css` sets,
 * and a Tailwind utility sits in the utilities layer while the floor sits in
 * `@layer base`, so the opt-out wins on layer order rather than on specificity.
 * `min-h-0 min-w-0` is the fallback spelling if the arbitrary form is ever
 * rejected; do not carry both.
 *
 * The hit area therefore does not come from the box. It comes from an absolutely
 * positioned `::before` that takes no part in layout. `before:-inset-y-[0.5em]`
 * grows the target from roughly 20px to roughly 37px tall, in `em` so it scales
 * with the reader's own text against a 1.0625rem body, and because the
 * pseudo-element is out of flow the paragraph's leading is identical on a line
 * that carries a term and a line that does not. The pseudo-element takes pointer
 * events because it is part of the button's own rendering, which is the
 * distinction `accessibility/target-size-and-motor` draws between a real
 * enlarged target and a decorative halo. `px-opsin-0-5` with a cancelling
 * `-mx-opsin-0-5` stays: the 2px of horizontal room is what the tint and the
 * press state paint into so they do not sit flush against the neighbouring
 * glyphs, and the negative margin means the words either side do not move.
 *
 * The second-order effect survives the change, because only its mechanism moved,
 * from padding to pseudo-element. The `::before` reaches past the line box above
 * and below, so two terms on adjacent wrapped lines that sit over one another
 * have targets that overlap, and a reader with a tremor can land on the wrong
 * definition rather than on nothing. SC 2.5.8's inline exemption covers the SIZE
 * of a target and says nothing about two of them meeting. The nightly layout run
 * measures each box and does not measure overlap, so nothing will surface this;
 * it is named on `term.mdx` instead.
 *
 * Hover, press and open each take a neutral fill from the theme, and they take
 * different ones. `hover:bg-state-hover` and `active:bg-state-press` come from
 * the interaction-state roles `product.css` bridges (`--state-hover` and
 * `--state-press`), which is the same source `button.tsx` draws its hover and
 * press from, and press is a darker step than hover in light and a lighter one
 * in dark, so a tap changes the fill rather than repeating it. The accent and
 * secondary chrome roles live only in the docs stylesheet, so under the product
 * theme they resolve to nothing and this control does not reach for them. The
 * open state keeps the chrome
 * `bg-muted`, a third fill distinct from either transient state, so a word held
 * open never wears the same value as a word merely being pressed. The states are
 * therefore told apart by value as well as by when they happen. `hover:` costs a
 * phone reader nothing, because Tailwind wraps it in a hover-capable query;
 * `active:` is the press feedback a thumb gets on a term sitting in a paragraph;
 * `aria-expanded:bg-muted` holds the word on the open tint for as long as its
 * definition is showing. The tint never carries a state alone: `aria-expanded`
 * carries the open state to assistive technology, the solid rule (see
 * `TRIGGER_MARK`) carries it to a sighted reader, and the definition beside the
 * word is the primary signal.
 */
const TRIGGER_BUTTON =
  "relative inline cursor-pointer appearance-none border-0 bg-transparent " +
  "[min-block-size:0] [min-inline-size:0] px-opsin-0-5 -mx-opsin-0-5 " +
  "[font:inherit] text-inherit rounded-opsin-xs " +
  "hover:bg-state-hover active:bg-state-press aria-expanded:bg-muted " +
  "before:absolute before:content-[''] before:-inset-y-[0.5em] before:-inset-x-opsin-1 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/** The definition itself: quieter than the sentence, never smaller than it. */
const DEFINITION = "text-muted-foreground"

export interface TermProps {
  /**
   * The glossary key. Resolved against the glossary supplied by
   * <TermGlossaryProvider>.
   *
   * `term.mdx:132-134` asks for an unknown id to be a build error. A component
   * cannot fail somebody else's build from inside a render, so what happens
   * instead is stated rather than implied: the word is rendered unmarked, no
   * affordance is drawn, and development gets a warning naming the id. Marking a
   * word whose explanation does not exist is the one outcome that is worse than
   * leaving it plain. The build-time half of that promise belongs in a lint rule
   * over the product's own source, and it does not exist yet.
   */
  id: string
  /**
   * The word as it should read in this sentence, where a plural, a tense or a
   * capitalisation makes it differ from the glossary's headword. It changes
   * what is printed and nothing else: the definition and the expansion still
   * come from the entry, and so does the spoken form of an abbreviation, which
   * is appended to the control's name rather than replacing what is written
   * there.
   *
   * Every path that can render prints it when a call site supplied it, because
   * the author's sentence is the only grammatical one available and a runtime
   * cannot rewrite it. A `plain-only` entry is the case where doing so is a
   * contradiction rather than a convenience: `children` is where a call site
   * writes the clinical word inflected for its sentence, and that entry's whole
   * content is that the clinical word is never shown, so the component renders
   * the children and warns loudly in development that the two disagree. Only
   * when no children are supplied does that path fall back to the entry's plain
   * wording. An `id` that is not in the glossary prints children gratefully,
   * because there it is the only real word available and without it the raw key
   * appears in the sentence instead.
   */
  children?: ReactNode
  /**
   * How the definition is presented. `inline` puts it in parentheses after the
   * word; `disclosure` puts it behind a control. `auto` chooses by the length of
   * the definition.
   *
   * There is no `hover` value, on purpose. A hover-only definition does not
   * exist on a phone, does not exist for a keyboard, and is unreliable for
   * anybody with a tremor.
   *
   * @default "auto"
   */
  present?: "auto" | "inline" | "disclosure"
  /**
   * Suppress the repeat. Set it on the second and later appearances of a term on
   * one surface: the word is still marked, the definition is still one press
   * away and still in the accessibility tree, and it is not printed again on
   * screen or on paper.
   *
   * opsinjs does not count the appearances for you. It cannot see where one
   * surface ends and the next begins, and a component that guessed would either
   * repeat itself down a page or silently drop a definition the reader had not
   * yet met. Repetition is noise and absence is a barrier; this is the
   * compromise, and the caller is the only party that can make it.
   */
  once?: boolean
  /**
   * Merged onto the root. Layout belongs here; the mark, the control and the
   * definition's own treatment do not, because each of them is an accessibility
   * claim this component makes on the page.
   */
  className?: string
}

/**
 * Which presentation this occurrence gets, and the order is the whole argument.
 *
 * `once` and an explicit `present` come first, because they are the call site's
 * statements about this occurrence and a component does not overrule the surface
 * it stands on. `once` says the reader has already met both readings here, so the
 * repeat goes behind a control; an explicit `present` is a deliberate choice and
 * is returned unchanged.
 *
 * `auto` is the call site expressing no opinion, and that is where the authored
 * glossary gets to govern. An entry the glossary marks `showBoth: "always"` is
 * shown inline whatever its length, both the clinical word and the plain wording
 * together, because that is what the glossary asked for and where nobody at the
 * call site has an opinion the glossary's own policy is a better authority than a
 * character count. Only when the glossary is silent too does the budget decide.
 *
 * The budget chooses by the LENGTH of what would be attached, never by the width
 * available. Width is knowable only by measuring, measuring only happens in the
 * browser, and a component that measures after the server has already rendered
 * the other branch produces a hydration mismatch by construction and a visible
 * flash on every phone. Length is knowable identically on both sides, so `auto`
 * resolves to the same answer in both and there is nothing to reconcile.
 */
function resolvePresentation(
  present: "auto" | "inline" | "disclosure",
  once: boolean,
  showBoth: GlossaryEntry["showBoth"],
  attached: number,
): "inline" | "disclosure" {
  /* `once` outranks an explicit `inline`, because it is a statement about this
     occurrence and `present` is a statement about the component. A caller who
     asked for both has asked for the definition not to be repeated inline, and
     that is the one of the two that carries information. */
  if (once) return "disclosure"
  if (present !== "auto") return present
  /* `auto` with no call-site opinion: the glossary's own policy governs before
     the budget. An `always` entry is shown inline whatever its length. */
  if (showBoth === "always") return "inline"
  return attached <= INLINE_BUDGET ? "inline" : "disclosure"
}

export function Term({
  id,
  children,
  present = "auto",
  once = false,
  className,
}: TermProps) {
  const glossary = useContext(GlossaryContext)
  const entry = glossary.get(id)
  const definitionId = useId()
  const [open, setOpen] = useState(false)

  /* NO ENTRY, NO MARK. A dotted underline is a promise that pressing or reading
     on will produce an explanation, and a promise with nothing behind it is
     worse than plain text: the reader spends attention on it once and stops
     trusting the mark everywhere else on the screen. The word still renders,
     because the sentence still has to make sense.

     WHAT RENDERS WITHOUT `children` IS THE KEY, AND THE KEY IS NOT A WORD.
     `<Term id="blood-pressure" />` in an application that has forgotten the
     provider prints "blood-pressure" mid-sentence, and `<Term id="egfr" />`
     prints "egfr". That is the wrong spelling for matching a reader's own
     paperwork, which is the entire reason the clinical word is on the screen at
     all. The alternative is a hole where a word belongs, which breaks the
     sentence for everybody rather than only for the reviewer, so the key stays
     and the behaviour is stated here, in `TermProps.children` and on `term.mdx`
     instead of being discovered. The warning below is development-only by
     policy, so in a build a reader uses there is no signal: the real gate is a
     lint rule over the product's own source, and it does not exist yet. */
  if (entry === undefined) {
    warn(
      `missing:${id}`,
      `id="${id}" is not in the glossary this subtree was given. The word is ` +
        "rendered unmarked, and with no `children` to print, the sentence " +
        `shows the raw key "${id}" instead. Add the entry, or drop the ` +
        "<Term> and write the word plainly. There is no third option that is " +
        "honest.",
    )
    return (
      <span data-slot="term" className={className}>
        {children ?? id}
      </span>
    )
  }

  /* Read once, through `filled`, so that an empty column is an absent field
     everywhere in this component rather than in the two places that happened to
     compare against `undefined`. */
  const plain = filled(entry.plain)
  const expansion = filled(entry.expansion)
  const speech = filled(entry.speech)

  /* `plain-only` IS THE GLOSSARY REFUSING. `tokens/glossary.json`'s own policy
     is that plain wording is the default and the clinical term is the
     annotation; a `plain-only` entry says the clinical word is never shown to
     this reader at all and exists so an author can look up what to write
     instead. So there is nothing to explain and nothing to mark. When a call
     site has already written a sentence into `children`, that sentence is what
     renders, because a runtime cannot rewrite a sentence and a gloss dropped
     into a word's slot reads as broken grammar. When there are no children the
     plain wording renders as ordinary text. Either way the contradiction is
     reported rather than hidden. */
  if (entry.showBoth === "plain-only") {
    warn(
      `plain-only:${id}`,
      `id="${id}" is marked showBoth: "plain-only", which means its clinical ` +
        "word should never be shown to a reader. Nothing is marked here. Write " +
        "the plain wording directly and drop the <Term>.",
    )
    /* `children` is HONOURED here, not discarded, and the warning is what
       carries the contradiction. `TermProps.children` is where a call site
       writes the clinical word inflected for its own sentence, and this entry's
       entire content is that the clinical word never reaches a reader. The two
       cannot both be satisfied. A runtime cannot rewrite a sentence, and
       printing the gloss where the word belongs produces an ungrammatical
       sentence a reader meets with no signal in the build they use, so the
       component renders what the author actually wrote and reports the conflict
       loudly instead. The cost is real and stays on the record: a reader now
       meets a clinical word the glossary said to keep away from them, but that
       word is visible and reviewable in the source, where a silently garbled
       sentence was neither. The repair is to write the plain wording directly
       and drop the <Term>. */
    if (children !== undefined) {
      warn(
        `plain-only-children:${id}`,
        `id="${id}" is marked showBoth: "plain-only", which declares that its ` +
          "clinical word never reaches a reader, and it was given children " +
          "that write the clinical word into a sentence anyway. The component " +
          "cannot rewrite the sentence and will not print a gloss where a word " +
          "belongs, so it renders the children as written and reports this " +
          "contradiction. Write the plain wording directly and drop the " +
          "<Term>.",
      )
    }
    if (children === undefined && plain === undefined) {
      warn(
        `plain-only-empty:${id}`,
        `id="${id}" is marked showBoth: "plain-only", has no plain wording, ` +
          "and was given no children. There is nothing this component may " +
          "render: the clinical word is refused by the entry, its replacement " +
          "does not exist, and the call site wrote nothing. Fill the " +
          "definition in.",
      )
    }
    return (
      <span data-slot="term" className={className}>
        {children ?? plain}
      </span>
    )
  }

  /* AN ENTRY WITH NO DEFINITION IS NOT AN ENTRY, and it takes the same exit as
     a missing one for the same reason: a mark promises an explanation, and
     there is nothing here to explain with. Rendering the mark anyway would put
     " ()" after a word, or a control that opens onto an empty pair of brackets,
     which reads as the product having lost the definition rather than as never
     having written one. */
  if (plain === undefined) {
    warn(
      `empty-plain:${id}`,
      `id="${id}" has no plain wording: the field is empty or is whitespace. ` +
        "The word is rendered unmarked. A glossary row with no definition is a " +
        "defect in the glossary rather than a presentation to fall back to, " +
        "and an empty column is what a spreadsheet export and an unfinished " +
        "translation pass both produce.",
    )
    return (
      <span data-slot="term" className={className}>
        {children ?? entry.word}
      </span>
    )
  }

  const presentation = resolvePresentation(
    present,
    once,
    entry.showBoth,
    plain.length + (expansion?.length ?? 0),
  )
  const visible = children ?? entry.word

  /* `showBoth: "always"` NOW GOVERNS THE `auto` PATH, so the only way an
     `always` entry lands behind a press is a call site that named
     `present="disclosure"` on a first appearance. That is the one case worth a
     warning: the author asked for a disclosure and the glossary asked for both
     on the screen, and the call site is allowed to win, but it is probably a
     mistake. `once` does not warn, because it means the reader has already met
     both readings on this surface, so the glossary's matching argument was
     served by the first occurrence and the repeat going behind a control is not
     a violation. */
  if (!once && present === "disclosure" && entry.showBoth === "always") {
    warn(
      `always:${id}`,
      `id="${id}" is marked showBoth: "always", which the glossary defines as ` +
        "showing the clinical word and the plain wording together every time, " +
        "so that a reader holding a printout can match it to the screen. This " +
        'occurrence set present="disclosure", so the plain wording is behind a ' +
        "press against the glossary's policy. Drop the explicit present here, or " +
        'pass present="inline", if both have to be on the screen.',
    )
  }

  /* Expansion first, then definition, then stop. See `term.mdx:279` and `:296`
     onwards. The expansion and the gloss are one apposition and are joined as
     one, because a separator glyph here is punctuation a screen reader either
     skips or reads out, on a component whose entire job is to be heard
     correctly. The comma is the only punctuation this component owns. */
  const definition = (
    <>
      {expansion === undefined ? null : (
        <>
          <span data-slot="term-expansion">{expansion}</span>
          {", "}
        </>
      )}
      {plain}
    </>
  )

  /* THE NAME COMES FROM THE CONTENT, AND THAT IS THE FIX RATHER THAN THE
     SHORTCUT. An earlier version put `aria-label="What does <spoken> mean?"` on
     the control. `aria-label` REPLACES the accessible name, so the word on the
     screen was not in the name at all: a reader saw "eGFR" and the control was
     called "What does e G F R mean?". That is SC 2.5.3 Label in Name (Level A)
     unmet on every disclosure this component drew, and it is a Voice Control
     user saying "click eGFR" and nothing happening. There was no honest way to
     repair the string either, because `children` is a `ReactNode` and may not be
     a string at all. Content-derived, the name contains the visible word by
     construction, whatever `children` holds.

     `speech` IS ADDITIVE NOW, NOT SUBSTITUTIVE. It used to be swapped in for the
     written word behind `aria-hidden`, which took the paperwork spelling away
     from precisely the readers who cannot see the screen: a braille reader got
     "S P O 2" and never "SpO2". That spelling is the stated reason `word`
     exists. Both forms are exposed, written first and letters second. The cost
     is that a speech reader hears the synthesiser's attempt at the word before
     the letters, and that is the smaller of the two costs rather than no cost
     at all. It is on `term.mdx`, and no screen reader has been run against
     either shape. */
  const trigger =
    speech === undefined ? (
      visible
    ) : (
      <>
        {visible}
        <span className="sr-only">{` ${speech}`}</span>
      </>
    )

  if (presentation === "inline") {
    return (
      <span data-slot="term" className={className}>
        {/* No mark in the inline presentation. The definition is already beside
            the word, so an underline would be pointing at something that is not
            hidden. The part still exists, because the anatomy names it and
            because a product may want to style the word it is defining. */}
        <span data-slot="term-trigger">{trigger}</span>
        <span data-slot="term-definition" className={DEFINITION}>
          {" ("}
          {definition}
          {")"}
        </span>
      </span>
    )
  }

  return (
    <span data-slot="term" className={className}>
      <button
        type="button"
        data-slot="term-trigger"
        aria-expanded={open}
        aria-controls={definitionId}
        /* THE DEFINITION IS IN THE TREE WHETHER OR NOT IT IS OPEN. A node
           referenced by aria-describedby contributes its text to the accessible
           description even while it is display:none, which is what lets the
           definition be hidden from the screen and never from a screen reader.
           It stays referenced when open too: a relationship that appears and
           disappears as a control is used is one an assistive technology may or
           may not re-read.

           The cost of the constant version is larger than "if you go back to
           the control", and is written down at its real size both here and on
           `term.mdx`. Once the definition is open it is the control's
           description AND the text immediately after it, so a reader moving
           through the sentence meets it twice on every pass. Dropping the
           reference while open would trade that for a relationship that changes
           under the reader, which some assistive technology will not re-read;
           both answers are defensible and this one is a choice rather than an
           oversight. It is paid only by the reader who asked to see it. */
        aria-describedby={definitionId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onKeyDown={(event) => {
          /* Escape closes it, and focus is already on the control that opened
             it, so there is nothing to return. The component never moves focus:
             opening a definition does not take a reader out of the sentence.

             preventDefault as well as stopPropagation, because they stop
             different things. stopPropagation ends React's delegated dispatch,
             which is enough inside this system's own Sheet and Dialog, whose
             listeners are React listeners. It does nothing to a native
             <dialog>'s own cancel behaviour, which the user agent performs
             independently. So without preventDefault one Escape closed the
             definition and the dialog around it together. The guard on `open`
             is what keeps the key available to that dialog the rest of the
             time. */
          if (event.key === "Escape" && open) {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
          }
        }}
        className={cn(TRIGGER_BUTTON, TRIGGER_MARK)}
      >
        {trigger}
      </button>
      {/* The space that separates the word from its definition lives INSIDE the
          definition, so it disappears with it. Left outside, a closed term would
          leave a double space in the middle of the sentence. That is invisible
          in review, and exactly the kind of thing that makes generated prose
          look machine-made. */}
      <span
        id={definitionId}
        data-slot="term-definition"
        className={cn(
          DEFINITION,
          /* `hidden` here is Tailwind's `display: none` class rather than the
             HTML attribute, so the print rule beside it can win. The attribute
             would need `!important` to beat, and an element hidden by attribute
             reads as hidden to tooling that never looks at the stylesheet.

             Print expands the definition beside its word, because a printed page
             has no disclosures and the definition is the part the reader takes
             to the appointment. A repeat occurrence stays closed on paper too:
             `once` means "do not say this again", and paper is where saying it
             four times is most expensive. */
          open ? "inline" : once ? "hidden" : "hidden print:inline",
        )}
      >
        {" ("}
        {definition}
        {")"}
      </span>
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the two presentations in
 * one sentence, because the single thing worth seeing about this component is
 * that `auto` sends a three-word definition inline and a longer one behind a
 * control, and that both of them are readable without a pointer.
 *
 * The two entries are copied from this repository's own `tokens/glossary.json`,
 * which is authored opsinjs prose written for exactly this audience, with one
 * field left off on purpose: `showBoth`. The glossary marks eGFR `"always"`,
 * which would send its definition inline, and the whole job of this demo is to
 * show both presentations in one sentence, so the field is omitted and eGFR's
 * length sends it behind a control instead. Nothing else is changed, nothing is
 * invented and nothing here is a number: a definition explains a word, and a
 * demo that put a reading on the screen would be showing somebody a result (ADR
 * 0012).
 *
 * They are the exception to the sentence at the top of `GlossaryEntry`, and the
 * exception is worth stating rather than hoping nobody notices. This file
 * refuses to import the repository's glossary because the glossary belongs to
 * the product; two of its entries are then hard-coded here, because a zero-prop
 * demo has to have something to define and the preview is what proves the
 * component renders. `DEMO_GLOSSARY` is not exported and no `<Term>` outside
 * this function can reach it, so what ships is a demonstration rather than a
 * dictionary. Even so, "opsinjs ships no definitions" is true of the API and
 * not of the bytes, and `term.mdx` says it that way.
 */
const DEMO_GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "acute",
    word: "acute",
    plain: "sudden, or short-lasting",
  },
  {
    id: "egfr",
    word: "eGFR",
    expansion: "estimated glomerular filtration rate",
    plain: "an estimate of how well your kidneys are filtering",
    speech: "e G F R",
  },
]

export default function TermDemo() {
  return (
    <TermGlossaryProvider glossary={DEMO_GLOSSARY}>
      <p className="m-0 max-w-(--opsin-measure-comfortable,66ch) text-opsin-body">
        An <Term id="acute" /> problem is not the same as a long-lasting one, and
        your <Term id="egfr" /> is measured differently again.
      </p>
    </TermGlossaryProvider>
  )
}
