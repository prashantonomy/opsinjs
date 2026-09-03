"use client"

/**
 * Term — a clinical word with its everyday meaning attached, so a sentence can
 * be read without leaving it.
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
 * reader as the trigger's accessible DESCRIPTION — a node referenced by
 * `aria-describedby` is included in the name-and-description computation whether
 * or not it is displayed, which is the one hiding mechanism that keeps a
 * promise instead of breaking it.
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
 * AN UNRESOLVED CONFLICT WITH THE AUTHORED GLOSSARY, RECORDED RATHER THAN
 * SETTLED. `tokens/glossary.json`'s `policy.rule` reads: "Plain wording is the
 * default and the clinical term is the annotation, never the other way around.
 * `<Term>` renders the plain wording as the visible text and exposes the
 * clinical term on demand; it must not render a clinical term with a tooltip
 * and call that plain English." This file does the reverse: the visible text is
 * the clinical word, and the plain wording is either attached in parentheses or
 * put behind a control. The argument for the implemented direction is the one
 * in `GlossaryEntry.word` below, and the same policy block makes it itself when
 * it explains why `showBoth: "always"` exists — a reader holding a printout has
 * to be able to match it to the screen. Both statements are in the same file and
 * they contradict each other, and neither this component nor the glossary may
 * settle it alone. It is stated on `term.mdx` and it is open. Nothing here is a
 * decision; read it as a conflict that has been written down.
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
   * That spelling is the point of showing it at all — a reader holding a
   * printed result and looking at a screen has to be able to match the two.
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
   * thing from a definition and most readers need both: *eGFR — estimated
   * glomerular filtration rate* still explains nothing on its own.
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
   * and the entry exists so an author can look up what to write instead. Term
   * honours it by rendering the plain wording as ordinary text and marking
   * nothing, because there is no clinical word on the screen to explain.
   * `children` is discarded on that path — see `TermProps.children`.
   *
   * `always` IS NOT IMPLEMENTED HERE, and the type accepts it so that a glossary
   * can be handed over unaltered rather than so that this component obeys it.
   * The glossary defines it as showing the clinical word and the plain wording
   * together every time, for matching a printout; Term chooses its presentation
   * from `present`, `once` and the length of the definition, so an `always` entry
   * with a long definition still lands behind a control. Honouring it would mean
   * overriding the call site's own `present` and `once`, and a component does not
   * get to overrule the surface it is standing on. An entry that declares
   * `always` and resolves to a disclosure warns in development, and the call site
   * can pass `present="inline"` to get what the glossary asked for.
   *
   * `first-use` is likewise the caller's to express, through `once`: opsinjs
   * cannot see where one surface ends and the next begins, which is the same
   * reason `once` is a prop rather than a count.
   *
   * There is no default. An entry that omits the field is presented exactly as
   * one that declares `always`, minus the warning.
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
   * It may be handed straight across the server/client boundary — a plain array
   * of plain objects is serialisable — so the definitions can be read from a
   * file on the server and never reach the browser as code.
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
 * `tokens/errors.json`'s policy block — quoted in `lib/opsinjs.ts` — asks for
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
 * renders a bare em dash after nothing, or " ()" after a word, or a hole in the
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
 * A typographic budget, not a clinical threshold. `--opsin-measure-tight` is
 * 45ch, so a whole line of this system's narrowest column is about 45
 * characters; a parenthetical has to share that line with the sentence it
 * interrupts, and past roughly 40 characters it stops interrupting and starts
 * replacing. Counted rather than measured on purpose — see `resolvePresentation`
 * below.
 */
const INLINE_BUDGET = 40

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
 * against glyphs a low-vision reader has doubled in order to read them puts
 * the rule into the
 * descenders of the word it is marking — the sole affordance, and the sole
 * non-colour carrier, degrading precisely for the reader it matters most to.
 * There is no token for an underline offset, so this is a judgement rather than
 * a token lookup.
 *
 * It is dropped in print, where the definition is expanded beside the word and a
 * mark promising something further would be promising nothing.
 */
const TRIGGER_MARK =
  "underline decoration-dotted underline-offset-[0.25em] print:no-underline"

/**
 * The button, stripped back to the word it contains.
 *
 * `inline` rather than a button's own `inline-block` is load-bearing. On an
 * inline box, vertical padding enlarges the hit area without enlarging the line
 * box, so the target grows and the paragraph's leading does not change wherever
 * a term appears. An equal margin in the opposite direction cancels the
 * horizontal padding for the same reason: the target grows, and the words either
 * side of it do not move.
 *
 * What this does NOT do is reach 44x44, and the exception is named out loud as
 * `accessibility/target-size-and-motor` asks. An inline target inside running
 * text cannot reach the floor without overlapping the line above it, which
 * trades one motor problem for a worse one; SC 2.5.8 exempts inline targets, and
 * this is that exemption being relied on rather than an oversight. The padding
 * is in rem, so the target grows with the reader's own text size.
 *
 * The second-order effect is the one that is easy to miss, so it is written
 * down. Vertical padding on an inline box leaves the line box alone but not the
 * hit test: the padding box reaches past the line box above and below, so two
 * terms on adjacent wrapped lines that happen to sit over one another have
 * targets that overlap, and the reader with a tremor lands on the wrong
 * definition rather than on nothing. SC 2.5.8's inline exemption covers the SIZE
 * of a target and says nothing about two of them meeting. The nightly layout run
 * measures each box and does not measure overlap, so nothing will surface this;
 * it is named on `term.mdx` instead.
 */
const TRIGGER_BUTTON =
  "inline cursor-pointer appearance-none border-0 bg-transparent " +
  "px-opsin-0-5 -mx-opsin-0-5 py-opsin-2 text-left [font:inherit] text-inherit " +
  "rounded-opsin-xs focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-ring"

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
   * The word as it should read in this sentence, when it differs from the
   * glossary's headword — plural, tense, or capitalisation. It changes what is
   * printed and nothing else: the definition and the expansion still come from
   * the entry, and so does the spoken form of an abbreviation, which is appended
   * to the control's name rather than replacing what is written there.
   *
   * Two paths do not print it, and both are cases where printing it would be
   * worse. A `plain-only` entry discards it, because `children` is where a call
   * site writes the clinical word inflected for its sentence and that entry's
   * whole content is that the clinical word is never shown; the discard warns in
   * development. An `id` that is not in the glossary prints it and prints it
   * gratefully — there it is the only real word available, and without it the raw
   * key appears in the sentence instead.
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
   * away and still in the accessibility tree, and it is not printed again — on
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
 * Which presentation this occurrence gets.
 *
 * `auto` chooses by the LENGTH of what would be attached, not by the width
 * available. Width is only knowable by measuring, measuring only happens in the
 * browser, and a component that measures after the server has already rendered
 * the other branch produces a hydration mismatch by construction and a visible
 * flash on every phone. Length is knowable identically on both sides, so `auto`
 * resolves to the same answer in both and there is nothing to reconcile.
 *
 * It is a weaker rule than the specification's, and it is a rule that keeps its
 * promise. The stronger one could not.
 */
function resolvePresentation(
  present: "auto" | "inline" | "disclosure",
  once: boolean,
  attached: number,
): "inline" | "disclosure" {
  /* `once` outranks an explicit `inline`, because it is a statement about this
     occurrence and `present` is a statement about the component. A caller who
     asked for both has asked for the definition not to be repeated inline, and
     that is the one of the two that carries information. */
  if (once) return "disclosure"
  if (present !== "auto") return present
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
     prints "egfr" — the wrong spelling for matching a reader's own paperwork,
     which is the entire reason the clinical word is on the screen at all. The
     alternative is a hole where a word belongs, which breaks the sentence for
     everybody rather than only for the reviewer, so the key stays and the
     behaviour is stated here, in `TermProps.children` and on `term.mdx` instead
     of being discovered. The warning below is development-only by policy, so in
     a build a reader uses there is no signal: the real gate is a lint rule over
     the product's own source, and it does not exist yet. */
  if (entry === undefined) {
    warn(
      `missing:${id}`,
      `id="${id}" is not in the glossary this subtree was given. The word is ` +
        "rendered unmarked, and with no `children` to print, what appears in " +
        `the sentence is the raw key — "${id}". Add the entry, or drop the ` +
        "<Term> and write the word plainly — there is no third option that is " +
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
     instead. So there is nothing to explain, nothing to mark, and the honest
     render is the plain wording as ordinary text. */
  if (entry.showBoth === "plain-only") {
    warn(
      `plain-only:${id}`,
      `id="${id}" is marked showBoth: "plain-only", which means its clinical ` +
        "word is never shown to a reader. Its plain wording is rendered as " +
        "ordinary text and nothing is marked. Write the plain wording directly " +
        "and drop the <Term>.",
    )
    /* `children` is DISCARDED here rather than honoured, and the warning is the
       whole of the remedy. `TermProps.children` is where a call site writes the
       clinical word inflected for its own sentence, and this entry's entire
       content is that the clinical word never reaches a reader; printing it
       would be the component overruling the refusal it is implementing. The
       cost is real and belongs on the record: the sentence a reader gets is not
       the sentence the author wrote. */
    if (children !== undefined) {
      warn(
        `plain-only-children:${id}`,
        `id="${id}" is marked showBoth: "plain-only" and was given children. ` +
          "They are discarded and the glossary's plain wording is printed " +
          "instead, so the sentence on the screen is not the one written at " +
          "the call site. Honouring them would put the clinical word in front " +
          "of a reader, which is the one thing this entry refuses. Write the " +
          "plain wording directly and drop the <Term>.",
      )
    }
    if (plain === undefined) {
      warn(
        `plain-only-empty:${id}`,
        `id="${id}" is marked showBoth: "plain-only" and has no plain wording. ` +
          "There is nothing this component may render — the clinical word is " +
          "refused by the entry and its replacement does not exist — so " +
          "nothing is printed. Fill the definition in.",
      )
    }
    return (
      <span data-slot="term" className={className}>
        {plain}
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
    plain.length + (expansion?.length ?? 0),
  )
  const visible = children ?? entry.word

  /* `showBoth: "always"` IS RECORDED AND NOT IMPLEMENTED, and saying so out
     loud is the whole of what this component can honestly do about it. See
     `GlossaryEntry.showBoth` for why obeying it would mean overruling the call
     site. The warning fires only where the value actually cost something — an
     `always` entry that resolved to inline already shows both. */
  if (entry.showBoth === "always" && presentation === "disclosure") {
    warn(
      `always:${id}`,
      `id="${id}" is marked showBoth: "always", which the glossary defines as ` +
        "showing the clinical word and the plain wording together every time, " +
        "so that a reader holding a printout can match it to the screen. This " +
        "occurrence resolved to a disclosure, so the plain wording is behind a " +
        "press. <Term> does not implement `always`. Pass `present=\"inline\"` " +
        "here, without `once`, if both have to be on the screen.",
    )
  }

  /* Expansion first, then definition, then stop — `term.mdx:166-168`. The
     em dash is a separator between two different kinds of statement, and it is
     the only punctuation this component owns. */
  const definition = (
    <>
      {expansion === undefined ? null : (
        <>
          <span data-slot="term-expansion">{expansion}</span>
          {" — "}
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
     written word behind `aria-hidden`, which took the paperwork spelling — the
     stated reason `word` exists — away from precisely the readers who cannot see
     the screen: a braille reader got "S P O 2" and never "SpO2". Both forms are
     exposed, written first and letters second. The cost is that a speech reader
     hears the synthesiser's attempt at the word before the letters, and that is
     the smaller of the two costs rather than no cost at all. It is on
     `term.mdx`, and no screen reader has been run against either shape. */
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
             independently — so without preventDefault one Escape closed the
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
          leave a double space in the middle of the sentence — invisible in
          review, and exactly the kind of thing that makes generated prose look
          machine-made. */}
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
 * The two entries are copied verbatim from this repository's own
 * `tokens/glossary.json`, which is authored opsinjs prose written for exactly
 * this audience. Nothing here is invented and nothing here is a number: a
 * definition explains a word, and a demo that put a reading on the screen would
 * be showing somebody a result (ADR 0012).
 *
 * They are the exception to the sentence at the top of `GlossaryEntry`, and the
 * exception is worth stating rather than hoping nobody notices. This file
 * refuses to import the repository's glossary because the glossary belongs to
 * the product; two of its entries are then hard-coded here, because a zero-prop
 * demo has to have something to define and the preview is what proves the
 * component renders. `DEMO_GLOSSARY` is not exported and no `<Term>` outside
 * this function can reach it, so what ships is a demonstration rather than a
 * dictionary — but "opsinjs ships no definitions" is true of the API and not of
 * the bytes, and `term.mdx` says it that way.
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
      <p className="m-0 max-w-(--opsin-measure-comfortable) text-opsin-body">
        An <Term id="acute" /> problem is not the same as a long-lasting one, and
        your <Term id="egfr" /> is measured differently again.
      </p>
    </TermGlossaryProvider>
  )
}
