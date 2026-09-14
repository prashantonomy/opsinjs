/**
 * CareCard is one instruction, from a named author, with the timing in words.
 *
 * THE COMPONENT CARRIES TWO VOCABULARIES AND MAPS NEITHER ONTO THE OTHER.
 * `urgency` says WHEN the reader should do the thing this card is asking of
 * them. `status` says how much attention the thing that PROMPTED the card
 * needs. Those are different questions with different owners: a clinician can
 * call a reading `attention` and still ask for a repeat test whenever the
 * reader next has a moment, and an app can ask somebody to do something today
 * about a reading nobody has assessed at all. So this file contains no table
 * from one to the other, no derivation in either direction, and no combination
 * it refuses. All fifteen pairs render, and each of them is the product's to
 * justify. That is the only answer available to a component that does not
 * know the reader.
 *
 * The open question the specification page asks is whether a steady CareCard
 * is a contradiction. It is answered no, for the same reason. `steady`
 * describes a reading that is where it was expected to be; it does not
 * describe an empty diary. "Book your next check when you next get a chance,
 * because everything we have seen is where we expected it" is the commonest
 * care instruction there is, and a component that refused it would push
 * products into inventing a fifth level for it.
 *
 * IT READS NO CLOCK. `urgency` is a phrase the product asserted at render time,
 * and "Do this today" means the day it was rendered. A card left on a screen
 * overnight still says "today" and now means a different day; nothing here
 * detects that, because nothing here polls, ticks or re-renders on its own. The
 * deadline is the part built to survive it, because a written date does not
 * drift past midnight. That is why `dueBy` renders as a date rather than as a
 * relative phrase, and why `overdue` is an input the product supplies rather
 * than a comparison this file performs. Keeping a screen alive across a day
 * boundary is the product's problem, and re-rendering is the product's answer.
 *
 * IT DRAWS NO STATUS OF ITS OWN. The whole status axis on this card is a
 * StatusPill, which owns the word, the glyph, the colour and `data-status`
 * together. Nothing else on the card takes a status colour: not the surface,
 * not the boundary, not the heading. See the specification deviation recorded
 * on the page. The tree asks for a status-tinted heading rule, and a tinted
 * rule beside a timing phrase gives the reader a colour to read the timing
 * from, when the two vocabularies do not map.
 *
 * IT MOUNTS NO LIVE REGION AND NEVER MOVES FOCUS. A card that announced itself
 * when it appeared, or that spoke when its deadline passed, would interrupt on
 * a schedule nobody agreed to. `AlertBanner` is the one component in this
 * system entitled to `role="alert"`.
 *
 * IT IS A SERVER COMPONENT. No state, no hook, no Base UI primitive. An
 * `onSelect` handler does not change that: a function cannot cross the
 * server/client boundary, so a CareCard given one is already being rendered by
 * a client component and this file joins that graph without a directive of its
 * own. The `href` form stays server-rendered, and it is the form to prefer.
 */

import type { ReactNode } from "react"

import { isDevelopment, type ClinicalStatus } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button, cardActionClassName } from "@/registry/base-lyra/ui/button"
import { Card } from "@/registry/base-lyra/ui/card"
import { Link } from "@/registry/base-lyra/ui/link"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"

/**
 * Urgency as words, because a colour cannot say "within a week".
 *
 * Three values and no fourth. There is no `whenever` and no `emergency`: the
 * first is what "when you next get a chance" already says, and the second is an
 * escalation this component is not the right surface for.
 */
export type CareUrgency = "when-convenient" | "this-week" | "today"

/**
 * The phrase each level is written with.
 *
 * `Record<CareUrgency, string>` on purpose: adding a level without writing its
 * phrase is a compile error rather than a card whose timing silently vanishes.
 * The three phrases are the specification's own, and they are the only copy
 * this component owns besides the two admissions below.
 *
 * THE THREE RENDER IDENTICALLY EXCEPT FOR THEIR WORDS. Same type step, same
 * ink, same position, no glyph, no rule, no weight change. That is what makes
 * the claim "urgency lives in the text" checkable rather than asserted: put the
 * three side by side in greyscale and the only difference is the sentence. The
 * step is body rather than subheadline because the timing is the claim the card
 * exists to make, and it may not be set below the reason that qualifies it.
 */
const TIMING_PHRASE: Record<CareUrgency, string> = {
  "when-convenient": "When you next get a chance",
  "this-week": "Do this within a week",
  today: "Do this today",
}

/**
 * What the card says when nobody has been named as asking.
 *
 * The specification is unambiguous that a card with no author reads as advice
 * from a clinician, and that the reader fills the gap with the most
 * authoritative answer available. There are three things this file could do
 * with that: refuse to render, render the instruction with the gap left blank,
 * or render the instruction and say in words that the gap is there. The first
 * silently drops an instruction a clinician may have issued; the second is the
 * failure itself. So the card renders and admits.
 *
 * It is deliberately unlovely, for the reason EmptyState's admissions are: an
 * author who sees it on a screen fixes it, and a reader who sees it has at
 * least not been told something untrue.
 */
const MISSING_AUTHOR = "This card does not say who is asking."

/** What the deadline line says once the product has told us the date is behind. */
const DEADLINE_PASSED = "This date has passed."

/**
 * The vertical rhythm between the parts, as a class each part carries.
 *
 * `:not(:first-child)` rather than a gap on a flex parent, because the parent
 * here is the Card's own content layer and this component does not reach inside
 * another component to lay its children out. It also survives every part being
 * optional: whichever part happens to come first gets no margin without this
 * file having to work out which one that is.
 *
 * THIS STRING IS A SECOND COPY. `card.tsx` declares the identical one, and
 * applies it through `Card.Header`, `Card.Body` and `Card.Footer`. This
 * component bypasses those, because every one of its parts is optional and
 * arrives as a prop rather than as caller-supplied children, and Card's own
 * prop documentation sanctions raw children for exactly that case. The
 * constant is private there, so the copy cannot be removed from inside this
 * file; removing the reason for the copy means exporting it from Card, which
 * is an edit to another component and is recorded in this component's review
 * instead.
 */
const PART_RHYTHM = "[&:not(:first-child)]:mt-4"

/**
 * THE ACTION LOOK IS THE SHARED RECIPE NOW, NOT A COPY OF BUTTON'S TONES.
 *
 * This file once carried two class lists that re-spelled Button's `primary` and
 * `secondary` fills by hand, with a comment declaring the drift a defect it
 * could not close from inside itself because Button's `TONE` was private. Both
 * halves of that sentence are false after this run. The recipe now lives in
 * `button.tsx` as `cardActionClassName`, the navigating transport reaches it
 * through `Link`'s `action` and `secondary` emphasis and the acting transport
 * through Button's own variants, so a change to how a card action looks reaches
 * the anchor and the button together rather than in two places that disagree.
 *
 * CareCard asks for the same weight ResultCard asks for, and no card action is
 * brand-filled any more. The recommended action is a neutral bordered control,
 * because a brand fill on the card's own ground marks nothing and a status
 * surface has no measured contrast pair for it. `Button variant="primary"` is
 * still there for a form submit inside a Dialog or a Sheet; it is the card
 * action, not Button, that the neutral rule binds. The underline is the one
 * sanctioned difference between the two transports, under D3 rule 2: an anchor
 * is underlined so it reads and announces as a link, a Button carrying a fill
 * or a boundary is not, and a quiet Button with neither takes the underline so
 * a handler-form action never reads as a paragraph.
 */

/**
 * What the reader is told when a next step was supplied and none could render.
 *
 * The same discipline as `MISSING_AUTHOR`, applied to the other input whose
 * absence the reader can act on. An action with no label, or with neither a
 * destination nor a handler, is dropped. Dropping it in silence leaves a
 * demand on the screen with nothing to press, which is the harm this component
 * is least able to afford.
 *
 * This sentence is for the reader, so it says what is true and what to do and
 * names no cause it cannot know. It points at the attribution line, which is
 * the card's own vocabulary for whoever is asking. The developer-facing account
 * of the failure lives in the console, in the "no label" warning and the
 * "neither `href` nor `onSelect`" warning that `actionControl` raises in
 * development; this string carries none of that and says only what the reader
 * can act on.
 */
const ACTION_UNAVAILABLE =
  "The next step for this is not available in this app. Contact whoever is asking instead."

/**
 * The spoken half of "recommended", for a reader who meets neither the box nor
 * the boundary that mark it.
 *
 * Emphasis on the leading action is carried by shape now that the brand fill has
 * gone: the recommended control is the larger bordered box at the headline step,
 * the alternative the smaller unbordered one beside it, and the flag
 * deliberately does not reorder the two. So with the flag on the second action
 * even the position signal points at the wrong one. That shape difference
 * survives greyscale, but it reaches nobody listening rather than looking, and
 * with the fill gone the qualifier is carrying more of the distinction than
 * before, not less. Appended to the visible label rather than replacing it, so
 * the visible name is still contained in the accessible name (SC 2.5.3) and
 * voice control still matches what is written on the control.
 *
 * Rendered only when there are two controls to tell apart. On a card with one
 * action there is nothing to distinguish it from, and the qualifier would be
 * noise read out on every card in a list.
 */
const RECOMMENDED_QUALIFIER = "the step this card is asking for"

/**
 * Development warnings, said once per distinct offender.
 *
 * `warnOnce` in the substrate is keyed to an `OpsinErrorCode`, and the codes in
 * tokens/errors.json describe mistakes a consumer makes with the clinical API.
 * Nothing this file complains about has a code, and a component may not mint
 * one. The codes are a versioned contract and the table on the errors page is
 * generated from that file. What the substrate is right about is the
 * discipline: a warning printed on every render, and twice per render under
 * Strict Mode, degrades into noise, and a noisy channel is one somebody
 * switches off. So this file keeps its own small set, keyed on the complaint
 * plus whatever names the offender.
 *
 * The key is coarser than "once per call site", because a call site is not
 * observable from inside a function. Two cards with the same heading and the
 * same mistake share one warning. That is the most this can honestly promise.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/** Whether a value is one of the three timings. */
function isCareUrgency(value: unknown): value is CareUrgency {
  return typeof value === "string" && value in TIMING_PHRASE
}

/** A calendar date, and nothing looser. */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * The caller's language tag, or `undefined` where it is not a language tag.
 *
 * `Intl` throws a `RangeError` on a malformed tag, and it throws it during
 * render. A component that takes a screen down because a locale arrived as
 * `"en_GB"` from a settings table has turned a cosmetic defect into an outage.
 */
function usableLocale(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined
  try {
    Intl.getCanonicalLocales(locale)
    return locale
  } catch {
    warnDev(
      `locale:${locale}`,
      `[opsinjs] <CareCard> was given locale="${locale}", which is not a BCP 47 ` +
        "language tag, so the deadline was written with the runtime's default " +
        'instead. A tag looks like "en-GB", with a hyphen.'
    )
    return undefined
  }
}

/**
 * The deadline as a written date, or `null` when there is no honest one.
 *
 * A DEADLINE IS A CALENDAR DATE AND NOT AN INSTANT, which is the whole reason
 * this does not route through RelativeTime. That component takes an RFC 3339
 * timestamp, requires an event from a fixed list of five things that have
 * already happened, and treats a future timestamp as two clocks disagreeing.
 * All three behaviours are correct for a reading and wrong for a due date. "Due
 * by 12 October" is a day in the reader's own calendar, and it means the same
 * day whether it is read from a server in another time zone or from a phone at
 * one minute past midnight.
 *
 * The shift-then-format-as-UTC step is what keeps that deterministic: a date
 * built at UTC midnight and formatted in UTC produces the same day everywhere,
 * where handing `Intl` the runtime's own zone would render 12 October as
 * 11 October for any reader west of it. The round trip is what rejects
 * 31 February. `Date.UTC` rolls an impossible date forward without complaint,
 * and a deadline silently moved to 3 March is worse than one that did not
 * render.
 *
 * The time zone is pinned to UTC deliberately, and the locale is pinned to
 * nothing. So an absent `locale` is the one remaining way this function can
 * produce a date the reader reads wrongly: it falls to the runtime's default,
 * which on a server is the server's language and not the reader's. The card
 * warns in development when that happens.
 */
function writtenDate(dueBy: string, locale: string | undefined): string | null {
  const match = CALENDAR_DATE.exec(dueBy)
  if (match === null) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const midnight = new Date(Date.UTC(year, month - 1, day))
  if (
    midnight.getUTCFullYear() !== year ||
    midnight.getUTCMonth() !== month - 1 ||
    midnight.getUTCDate() !== day
  ) {
    return null
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(midnight)
}

/** One thing the card asks the reader to do. */
export interface CareAction {
  /**
   * Imperative, specific, and honest about what activating it does. "Book a
   * repeat test" is an action; "learn more" is a link pretending to be one. The
   * visible label is the accessible name, so a telephone action carries the
   * number in it rather than behind it.
   */
  label: string
  /**
   * Where the action goes. Rendered as a real link, including `tel:` and
   * `mailto:`, which is why it is preferred over `onSelect` wherever the action
   * has a destination at all: a link survives a new tab, a long press, a copied
   * address and a screen reader's list of links.
   */
  href?: string
  /** What the action does, when it has no destination. Renders a button. */
  onSelect?: () => void
  /**
   * Which of the two the card leads with. At most one per card. When no action
   * carries it the first one is treated as recommended, because the anatomy
   * says the first is the recommended one; the flag is how a caller says
   * otherwise without reordering controls the reader may already have learnt.
   */
  recommended?: boolean
}

export interface CareCardProps {
  /**
   * The instruction. Starts with a verb, and says what rather than why: "Book a
   * repeat blood test", not "About your recent result". It is the card's
   * accessible name, so it is also what a reader hears when they list the
   * regions on a screen.
   */
  heading: string
  /**
   * When the reader should do it, rendered as one of three fixed phrases inside
   * the heading. Never derived from `status`: a card with no timing is a demand
   * with no deadline, and the reader supplies the missing urgency themselves. It
   * is usually the wrong one. The one exception to needing it is a readable
   * `dueBy`: a written date is itself a timing, so a card may omit the phrase
   * when it supplies a date. A card that carries both is carrying two timings
   * that this file never compares, and where both are supplied the product owns
   * keeping them coherent.
   */
  urgency?: CareUrgency
  /**
   * Who is asking. Required, and free text rather than an enum, because "your
   * GP surgery" and "an automatic reminder from this app" are both true answers
   * and the difference matters more than any category we could invent. Left
   * empty, the card says in words that it does not know, and warns in
   * development. It never quietly drops the line.
   */
  attribution: string
  /** One sentence: what prompted this instruction. */
  reason?: string
  /**
   * The deadline, as a calendar date in the form `2026-10-12`. The card writes
   * it out in full rather than as a relative phrase, because a date does not
   * change meaning while the card sits on a screen. Anything that is not a
   * calendar date is refused rather than guessed at, and no deadline line is
   * rendered for it.
   */
  dueBy?: string
  /**
   * Whether that date is behind the reader now. An input, like everything else
   * with a time in it here: the card reads no clock, and comparing a calendar
   * date to "now" needs the reader's own time zone, which a component rendered
   * on a server does not have. When it is true the card says so in words, and
   * the product owns saying what to do about it. Usually that means changing
   * `heading`.
   */
  overdue?: boolean
  /**
   * BCP 47 language tag for the deadline date. It does not translate the three
   * timing phrases or the two admissions: those are English, and the gap is
   * recorded on the page rather than hidden behind a prop that would also let a
   * caller relabel "Do this today" as something more insistent. When it is
   * omitted the date is written with the runtime's default, which on a card
   * rendered on a server is the server's language and not the reader's, and
   * development says so.
   */
  locale?: string
  /**
   * At most two. More than two is a screen rather than a card; the extras are
   * dropped, and development says which ones so nothing goes missing quietly.
   */
  actions?: CareAction[]
  /**
   * The clinical status of the thing that prompted this instruction, rendered
   * as a StatusPill and nowhere else. Optional and independent of `urgency`:
   * plenty of instructions have no reading behind them at all, and the two
   * never derive from one another in either direction.
   */
  status?: ClinicalStatus
  /**
   * What that status is about, for the pill's accessible name: "your last blood
   * test". Without it a screen-reader user hears a level with no subject inside
   * a card full of other nouns, and the likeliest thing they attach it to is the
   * instruction. That is not what it describes.
   */
  statusOf?: string
  /**
   * Which heading element the card renders. The level belongs to the page and
   * the appearance belongs to the card: a component that hard-codes its level
   * produces an outline that jumps from h1 to h3 on one screen and a wall of
   * h2s on another.
   *
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * Merged onto the root. Layout belongs here. The card sets no width and no
   * place in a grid, because both are decisions of the screen it is on. It is
   * also the one hole in this component's refusal to take a status colour: a
   * colour utility passed through here reaches the root, and a card tinted from
   * the status axis is the thing the pill exists to make unnecessary.
   */
  className?: string
}

/**
 * Turn one action into a control, or into nothing.
 *
 * Returning `null` rather than rendering something is the point. A control with
 * no name is unreachable by voice and announced as "button"; a control with
 * neither a destination nor a handler is a promise the card cannot keep, and a
 * care instruction whose one next step does nothing is worse than an
 * instruction with no step at all.
 */
function hasLabel(action: CareAction): boolean {
  return typeof action.label === "string" && action.label.trim() !== ""
}

/* A type predicate, not a plain `boolean`, so that `const destination =
   navigates(action)` narrows `action.href` from `string | undefined` to
   `string` in the branch that renders the Link. `LinkProps.href` is required
   because a link with no destination is a button, so an optional href flowing
   into it would not compile; the guard that already rejects an empty or
   missing href is the right place to carry that fact into the type. An empty
   href is a link to the current page, which is the failure the trim guards
   against, so `?? ""` would defeat the check rather than satisfy it. */
function navigates(
  action: CareAction
): action is CareAction & { href: string } {
  return typeof action.href === "string" && action.href.trim() !== ""
}

function acts(action: CareAction): boolean {
  return typeof action.onSelect === "function"
}

/**
 * Whether an action will become a control at all.
 *
 * Declared once and used twice: `actionControl` decides what to render, and the
 * card counts the survivors. It counts them to work out whether anything is
 * left to press, and whether there are two controls to tell apart. Two copies
 * of this condition would eventually disagree, and the disagreement would be a
 * card that says a next step is missing while the next step is on screen.
 */
function actionRenders(action: CareAction): boolean {
  return hasLabel(action) && (navigates(action) || acts(action))
}

function actionControl(
  action: CareAction,
  emphasis: "recommended" | "alternative",
  owner: string,
  key: string,
  qualify: boolean
): ReactNode {
  const label = hasLabel(action) ? action.label : ""
  const destination = navigates(action)
  const handler = acts(action)

  if (label === "") {
    warnDev(
      `action-no-label:${emphasis}:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" was given an action with no label. ` +
        "The visible label is the accessible name, and the next step is the " +
        "reason a card that asks for something is worth showing at all. Nothing " +
        "was rendered for it."
    )
    return null
  }

  if (destination && handler) {
    warnDev(
      `action-both:${label}`,
      `[opsinjs] <CareCard> was given the action "${label}" with both \`href\` ` +
        "and `onSelect`. It renders as a link, because a destination survives a " +
        "new tab, a copied address and a screen reader's list of links and a " +
        "handler does not. Move the work to the page the link goes to, or drop " +
        "the `href`."
    )
  }

  /* The spoken half of the emphasis, on the control the card is leading with.
     A sighted reader gets the larger bordered box; this is what a listener gets,
     and without it the two controls announce identically and the flag reaches
     nobody. */
  const qualifier =
    qualify && emphasis === "recommended" ? (
      <span className="sr-only">, {RECOMMENDED_QUALIFIER}</span>
    ) : null

  if (destination) {
    return (
      /* The navigating transport is the shared Link. Its `action` and
         `secondary` emphasis draw from `cardActionClassName` in button.tsx, the
         same recipe the acting Button's variants draw from, so the two controls
         cannot drift: a change to how a card action looks reaches the anchor and
         the button in one place. `action` is the recommended weight, a neutral
         bordered control at the headline step; `secondary` is the quiet weight
         beside it. No brand fill, on either transport.

         Two classes ride beside the recipe because they are about this card
         rather than about the shared look. `text-wrap` sets the wrapping
         property back where a consumer reset may have cleared it, so a label
         that has to wrap at 200% text still can. `active:translate-y-px` is the
         one-pixel press cue: instantaneous rather than animated, which is what
         `prefers-reduced-motion` asks a press feedback to be, so it needs no
         branch. The acting Button carries the same cue, so the two transports
         acknowledge a press alike.

         THESE CLASSES RIDE THROUGH LINK'S `cn()`, SO THEY MAY SET ONLY WHAT THE
         RECIPE DOES NOT. `cn` is `twMerge(clsx(...))` with `tailwind-merge`
         left unconfigured, so a colour or a type step added here lands in the
         same `text-*` conflict group as the recipe's own `text-opsin-headline`
         and one of the two is silently dropped with no error. The two classes
         above are safe because neither touches that group. Anything that needs
         to change the shared ink or type step belongs in `cardActionClassName`
         in button.tsx, where the whole class list is built by concatenation for
         exactly this reason, not beside the recipe here.

         No `data-slot` is passed here. Link emits `data-slot="link"` and the
         acting Button emits `data-slot="button"`; the anatomy addresses the pair
         through `[data-slot="care-card-actions"]` on the group rather than
         either control, so a selector written against the group reaches both. */
      <Link
        key={key}
        href={action.href}
        emphasis={emphasis === "recommended" ? "action" : "secondary"}
        className="text-wrap active:translate-y-px"
      >
        {label}
        {qualifier}
      </Link>
    )
  }

  if (!handler) {
    warnDev(
      `action-inert:${label}`,
      `[opsinjs] <CareCard> was given the action "${label}" with neither \`href\` ` +
        "nor `onSelect`, so there is nothing for it to do. Give it a destination " +
        "or a handler; a control that acknowledges a press and then does nothing " +
        "reads as a broken screen. Nothing was rendered for it."
    )
    return null
  }

  /* The acting transport, on D3's neutral ladder, which is the one ResultCard
     renders. The recommended action is `secondary`, a bordered neutral control
     at the md size; the alternative is `quiet` at sm, taking the underline a
     Button with neither fill nor boundary needs so it cannot read as a
     paragraph. Neither is `primary`: a card action is never brand-filled, and
     the recommended anchor above is the same neutral bordered control.

     THE CLASS DELTA COMES FROM THE SHARED RECIPE, NOT A LOCAL STRING. Button
     already brings the box, the fill and the type step through its own TONE and
     SIZE, so `cardActionClassName({ as: "button" })` returns only what is left:
     the empty string for the recommended weight, and `underline
     underline-offset-4` for the quiet one. Routing it through the recipe is what
     keeps this handler form and the Link form above from drifting, and it is
     why this file now holds no private action class string of its own. Button
     carries the `active:translate-y-px` press cue in its own base class, so the
     two transports still acknowledge a press alike without this file adding it
     here. */
  return (
    <Button
      key={key}
      variant={emphasis === "recommended" ? "secondary" : "quiet"}
      size={emphasis === "recommended" ? "md" : "sm"}
      className={cardActionClassName({
        weight: emphasis === "recommended" ? "recommended" : "quiet",
        ground: "neutral",
        as: "button",
      })}
      onClick={action.onSelect}
    >
      {label}
      {qualifier}
    </Button>
  )
}

export function CareCard({
  heading,
  urgency,
  attribution,
  reason,
  dueBy,
  overdue,
  locale,
  actions,
  status,
  statusOf,
  headingLevel = 3,
  className,
}: CareCardProps) {
  const named = typeof attribution === "string" && attribution.trim() !== ""
  const title = typeof heading === "string" ? heading.trim() : ""
  const owner = title || attribution || "an unnamed instruction"

  /* THE AUTHOR IS THE SPECIFICATION, so this is the loudest complaint in the
     file. Everything else on a CareCard is optional; the person asking is not,
     and a card without one is read as advice from a clinician who has assessed
     this reader. That is a claim the product then has no way to withdraw,
     because it never explicitly made it. */
  if (!named) {
    warnDev(
      `no-attribution:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" has no \`attribution\`. Every ` +
        "instruction has an author, and a card that does not name one is read as " +
        "advice from a clinician who has assessed this reader. The card rendered " +
        `and says so in words: "${MISSING_AUTHOR}" Name the author instead. ` +
        'Concrete answers are "your GP surgery asks", "your clinic\'s automatic ' +
        'reminder", and "this app, based on the range you set".'
    )
  }

  if (title === "") {
    warnDev(
      `no-heading:${owner}`,
      "[opsinjs] <CareCard> was rendered with no `heading`. The heading is the " +
        "instruction and it is the card's accessible name, so without it the card " +
        "is a region nobody can find and a demand nobody can read. A card with no " +
        "verb in it is not a CareCard."
    )
  }

  /* THE TIMING IS NEVER SUBSTITUTED. `urgency` is typed to the three, and this
     file ships as source into JavaScript projects where a type is advice. A
     value outside the vocabulary has no phrase, and picking one would be
     opsinjs deciding when somebody should act on their own health. So the card
     renders without a timing line and says so, which is visible on the screen
     rather than only in a console. */
  const timing = isCareUrgency(urgency) ? TIMING_PHRASE[urgency] : null

  if (
    status !== undefined &&
    (statusOf === undefined || statusOf.trim() === "")
  ) {
    warnDev(
      `status-no-subject:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" has a \`status\` and no \`statusOf\`. ` +
        "The pill then announces a level with no subject, inside a card full of " +
        "other nouns, and the likeliest thing a listener attaches it to is the " +
        "instruction. That is not what it describes. Say what the status is " +
        'about: statusOf="your last blood test".'
    )
  }

  const language = usableLocale(locale)
  const written = dueBy === undefined ? null : writtenDate(dueBy, language)

  /* A CARD HAS A TIMING, AND A WRITTEN DATE IS ONE. `urgency` is now optional,
     because a readable `dueBy` is itself a timing and a card carrying both is
     carrying two timings this file never compares. So the complaint splits by
     cause. An out-of-vocabulary `urgency` still warns exactly as before, because
     substituting a phrase for it would be opsinjs deciding when somebody should
     act. A card with neither a phrase nor a readable date is a demand with no
     timing at all, and it warns and names both remedies. A card with a date and
     no phrase is complete, so it says nothing. */
  if (urgency !== undefined && timing === null) {
    warnDev(
      `urgency:${String(urgency)}:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" was given urgency="${String(urgency)}", ` +
        'which is not one of "when-convenient", "this-week" or "today". No timing ' +
        "phrase was rendered, because substituting one would be this component " +
        "deciding when somebody should act. Put the timing back, or write it into " +
        "the heading yourself."
    )
  } else if (urgency === undefined && written === null) {
    warnDev(
      `no-timing:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" has neither an \`urgency\` phrase ` +
        "nor a readable `dueBy`, so it is a demand with no timing at all and the " +
        "reader is left to supply the missing urgency themselves. Give it a " +
        'timing: set `urgency` to "when-convenient", "this-week" or "today", or ' +
        'set `dueBy` to a calendar date in the form "2026-10-12".'
    )
  }

  if (dueBy !== undefined && written === null) {
    warnDev(
      `due-by:${dueBy}`,
      `[opsinjs] <CareCard> was given dueBy="${dueBy}", which is not a calendar ` +
        'date. The form is "2026-10-12": four digits, then two, then two. That ' +
        "is because a deadline is a day in the reader's own calendar rather than " +
        "an instant in somebody's time zone. No deadline was rendered."
    )
  }

  /* A READABLE DATE STILL NEEDS A LANGUAGE. The order matters: this sits after
     `written` is computed so an unreadable date does not also draw a locale
     complaint. When a date renders and no `locale` was given, `writtenDate`
     formats it with the runtime's own default, which on a server-rendered card
     is the server's rather than the reader's and is typically en-US. So a
     British or European reader sees a month-first date on the very line that
     decides when they act. This is a warning rather than a refusal because a
     card rendered entirely in the reader's own browser may legitimately want
     that default. */
  if (written !== null && locale === undefined) {
    warnDev(
      `due-by-no-locale:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" wrote its \`dueBy\` with no ` +
        "`locale`, so the date was formatted with the runtime's own default " +
        "rather than the reader's language. On a card rendered on a server that " +
        "default is the server's locale and is typically en-US, so a British or " +
        "European reader sees a month-first date on the line that decides when " +
        'they act. Pass the reader\'s own BCP 47 tag, for example locale="en-GB".'
    )
  }

  if (overdue === true && written === null) {
    warnDev(
      `overdue-no-date:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" is marked \`overdue\` with no ` +
        "readable `dueBy`, so there is no date for the card to say has passed and " +
        "nothing was rendered about it. A card that says a deadline has gone by " +
        "without saying which deadline leaves the reader worse off than silence."
    )
  }

  /* At most two, and the ones beyond it are named rather than dropped in
     silence. Two controls is the point at which a card stops being a card: a
     third asks the reader to choose between next steps, and choosing between
     next steps is a screen. */
  const supplied = Array.isArray(actions) ? actions : []
  const shown = supplied.slice(0, 2)
  if (supplied.length > 2) {
    warnDev(
      `too-many-actions:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" was given ${supplied.length} actions. ` +
        "At most two are rendered; a third asks the reader to choose between next " +
        "steps, and that is a screen rather than a card. Dropped: " +
        supplied
          .slice(2)
          .map((action) => `"${action.label}"`)
          .join(", ") +
        "."
    )
  }

  const flagged = shown.filter((action) => action.recommended === true)
  if (flagged.length > 1) {
    warnDev(
      `two-recommended:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" flags ${flagged.length} actions as ` +
        "`recommended`. One card leads with one action; the first flagged one is " +
        "rendered as the recommended step and the other as the alternative. Two " +
        "equally weighted next steps is the reader choosing on their own."
    )
  }

  /* The flag decides the emphasis; the array decides the order. The anatomy
     says the first action is the recommended one, so with nothing flagged the
     first is treated as recommended. But a flag on the second is honoured
     where it sits rather than reordering the card, because a reader who has
     learnt where a control is should not find it moved by a prop they cannot
     see. */
  const leadIndex = shown.findIndex((action) => action.recommended === true)
  const recommendedIndex = leadIndex === -1 ? 0 : leadIndex
  if (leadIndex > 0) {
    warnDev(
      `recommended-not-first:${owner}`,
      `[opsinjs] <CareCard> headed "${owner}" flags its second action as ` +
        "`recommended`. The card renders actions in the order given and does not " +
        "reorder them, so the recommended one is the second control on the row. " +
        "Put it first if it is the step the card is asking for."
    )
  }

  /* Counted before anything is rendered, because the qualifier below is only
     worth saying when there are two controls to tell apart, and because a card
     that was given actions and can render none of them has to say so. */
  const usable = shown.filter(actionRenders).length

  /* The key is the index and the label together. The index alone would move a
     control's identity when the first action is dropped for having no label,
     and the label alone would collide on a card that repeats one. */
  const controls = shown
    .map((action, index) =>
      actionControl(
        action,
        index === recommendedIndex ? "recommended" : "alternative",
        owner,
        `${index}:${action.label}`,
        usable > 1
      )
    )
    .filter((control) => control !== null)

  /* AN INSTRUCTION WITH NOTHING TO PRESS IS THE ONE FAILURE THIS CARD CANNOT
     LEAVE SILENT. Everything above warns in development and development only, so
     a product that ships an action with an empty `href` gets a card that reads
     "Ring your care team / Do this today" with no control under it and no
     indication that there was ever meant to be one. The rule this file states
     for the missing author applies here unchanged: an omitted input renders an
     explicit "we do not have this", never a substituted default and never
     silence. */
  const askedForAction = supplied.length > 0 && controls.length === 0

  /* THE LEVEL IS CHECKED, FOR THE REASON EVERY OTHER PROP HERE IS CHECKED. A
     type is advice in the JavaScript project this file ships into, and a level
     is exactly the prop a caller computes rather than types. It might be
     `headingLevel={section.depth + 1}`, or a number off a CMS row.
     `headingLevel={7}` builds `<h7>`, an unknown element with no heading role
     at all. This card's instruction is the whole component, so it drops out of
     the document outline and out of a screen reader's heading list while the
     `aria-label` on the section below still advertises a named region with
     nothing navigable in it. `headingLevel={1}` puts a second `h1` on the page.
     Both fall back to the documented default rather than being rendered. */
  const LEVELS = [2, 3, 4, 5, 6]
  let level = headingLevel
  if (!LEVELS.includes(level)) {
    warnDev(
      `heading-level:${String(headingLevel)}`,
      `[opsinjs] <CareCard> was given headingLevel ${String(headingLevel)}. The ` +
        "instruction is a real heading and the level has to be one a document " +
        "outline has: 2 to 6. An h1 makes a card compete with the page's own " +
        "name and anything outside the range is not a heading element at all. " +
        "It was rendered at the default, 3.",
    )
    level = 3
  }
  const Heading = `h${String(level)}` as "h2" | "h3" | "h4" | "h5" | "h6"

  return (
    /* A `section` with a name is a region, which is what makes the card
       reachable by region navigation without reading the page around it.

       The name is `aria-label` rather than `aria-labelledby` because pointing at
       the heading needs an id, generating one needs `useId`, and `useId` is a
       hook. That would make this a client component for the sake of an
       attribute. The cost is real and is not hidden: a screen reader announces
       the region's name and then the heading, so the instruction is heard twice
       on entry. That is the trade recorded on the page. */
    <section
      data-slot="care-card"
      aria-label={title === "" ? undefined : title}
      className={className}
    >
      <Card>
        {/* NO INSTRUCTION, NO HEADING ELEMENT. A card whose `heading` is empty
            used to render the timing phrase on its own. "Do this today" was a
            level-3 heading, a demand with no verb. With the urgency out of
            vocabulary as well it rendered an empty heading, which fails on its
            own. Neither is a CareCard. The heading and the timing go together,
            so with nothing to time the card falls back to the parts that are
            still true: the status, the reason, the author and the deadline. The
            development warning above is what tells the author; suppressing the
            demand is what protects the reader in production. */}
        {title === "" ? null : (
          <Heading
            data-slot="care-card-heading"
            className="text-opsin-headline m-0"
          >
            {title}
            {/* A SENTENCE BOUNDARY, THEN AN EXPLICIT SPACE. The instruction and
              the timing are two whole sentences, so a full stop terminates the
              first. The timing span is `block`, so a browser breaks the line for
              both the reading order and the accessible-name computation, but a
              screen reader that does not pause at a block boundary would
              otherwise hear "…asked for Do this today" as one clause. The stop
              is `sr-only`, so nothing is visible. It is skipped when the trimmed
              instruction already ends in a full stop, an exclamation mark or a
              question mark, because two terminators in a row are read aloud by
              some synthesisers, and skipped when there is no timing to separate
              from. The explicit space stays either way: name computation joins
              text nodes with no separator of its own, so without it the name
              becomes "…asked forDo this today" the moment the block class
              changes. One accepted oddity comes with that join: it also puts a
              space before the stop, so the name reads "…measurement . Do this
              today". A full stop is a pause rather than a word, so it is heard
              correctly even though it looks slightly odd written out. */}
            {timing === null || /[.!?]$/.test(title) ? (
              " "
            ) : (
              <>
                <span className="sr-only">.</span>{" "}
              </>
            )}
            {/* THE TIMING LIVES INSIDE THE HEADING, which is what the anatomy asks
              for and what makes the claim survive a text-only rendering: a
              reader who scans only the headings comes away with the right
              timing, and a reader with no colour perception loses nothing
              because there was never any colour to lose. It sits after the
              instruction rather than before it so that the reading order is
              still heading first and so that the region's name, which is the
              instruction, is the first thing said rather than the second. */}
            {timing === null ? null : (
              <span
                data-slot="care-card-timing"
                className="mt-opsin-1 text-opsin-body block"
              >
                {timing}
              </span>
            )}
          </Heading>
        )}

        {/* NOT A FOOTNOTE, AND DIRECTLY UNDER THE INSTRUCTION. The
            specification says attribution is a required part rather than a
            footnote, and a line set in caption type under a headline is a
            footnote whatever the documentation calls it. So it takes the same
            step as the deadline and sits in the same ink as the rest of the
            card. It sits here, right beneath the instruction and its timing and
            above everything else, because who is asking is the claim a reader
            has to be able to make at a glance. It is told apart from the timing
            above it and the deadline below it by its position alone, never by a
            smaller size, a lighter weight or a colour. */}
        <p
          data-slot="care-card-attribution"
          className={cn("text-opsin-subheadline m-0", PART_RHYTHM)}
        >
          {named ? attribution : MISSING_AUTHOR}
        </p>

        {/* The only status-coloured element on the card, and the only element
            here carrying `data-status`, is the pill. It carries that
            attribute, the word and the glyph together, because the pill owns
            all four carriers and this file owns none of them. */}
        {status === undefined ? null : (
          <StatusPill
            status={status}
            describes={statusOf}
            className={PART_RHYTHM}
          />
        )}

        {reason === undefined || reason.trim() === "" ? null : (
          <p
            data-slot="care-card-reason"
            className={cn("text-opsin-body m-0", PART_RHYTHM)}
          >
            {reason}
          </p>
        )}

        {/* THE DEADLINE LINE NEVER CHANGES ITS TREATMENT. Same step, same ink,
            same position whether the date is ahead of the reader or behind
            them; the only thing that changes is the sentence. De-emphasising a
            date that has not arrived yet, or colouring one that has, would put
            the fact back on the axis the words are here to take it off. */}
        {written === null ? null : (
          <p
            data-slot="care-card-deadline"
            className={cn("text-opsin-subheadline m-0", PART_RHYTHM)}
          >
            {/* `dateTime` carries the machine-readable date whatever the written
                form turns out to be in the reader's language, which is what lets
                a calendar, an export or a test read it without parsing prose. */}
            {/* `lang` is stamped whenever a locale was supplied, because this is
                the one part of the card that changes language: the timing
                phrases, "Due by" and the admissions are English whatever
                `locale` says, so a localised card is a mixed-language sentence
                and only the date can declare which language it is in (SC 3.1.2).
                Omitted rather than guessed when no locale was given. The
                document's own language is the right answer then, and asserting
                the runtime's default over it would be worse than saying
                nothing. */}
            Due by{" "}
            <time dateTime={dueBy} lang={language}>
              {written}
            </time>
            {/* Terminated, and the two sentences kept apart. Concatenated, the
                paragraph read "Due by 5 January 2026 This date has passed."
                That was one string with no boundary for a screen reader to
                pause on, on the sentence the whole overdue design turns on. */}
            .{overdue === true ? ` ${DEADLINE_PASSED}` : null}
          </p>
        )}

        {/* A next step was supplied and none could render. The sentence sits in
            the place the controls would have taken, so the reader finds it where
            the thing to press should have been. It is set as prose at the
            supporting step, not at the control's, because a sentence set at
            control weight reads as something to press. */}
        {controls.length === 0 && askedForAction ? (
          <p
            data-slot="care-card-actions"
            className={cn("text-opsin-subheadline m-0", PART_RHYTHM)}
          >
            {ACTION_UNAVAILABLE}
          </p>
        ) : null}

        {controls.length === 0 ? null : (
          /* `--opsin-target-separation` read directly rather than a spacing step
             that happens to equal it today. It is the published minimum gap
             between two adjacent controls, and two next steps a thumb has to
             hit apart is exactly the case it was published for. It is also why
             the row wraps rather than shrinking: at 200% text two controls stack
             and keep their floor, where a shrinking row would keep the layout
             and lose the target.

             THE FALLBACK IS THERE FOR THE SAME REASON THE FLOOR'S IS. Without a
             second argument the declaration is invalid at computed-value time in
             any project that installed this file and not the token sheet, and
             `gap` falls back to zero. That is two 44pt hit areas touching,
             which is the adjacent-target case the separation exists to
             prevent, and worse here because Button's hit area is deliberately
             unclamped and can overhang its own border box. */
          <div
            data-slot="care-card-actions"
            className={cn(
              "flex flex-wrap items-center gap-(--opsin-target-separation,0.5rem)",
              PART_RHYTHM
            )}
          >
            {controls}
          </div>
        )}
      </Card>
    </section>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It is a controlled comparison and
 * not a feature tour: the three cards are stacked one under the other and are
 * identical in every part except for `urgency`, so the only thing that differs
 * on screen is one sentence. The parts are the heading, the author, the reason
 * and the action. That is the one claim on this component worth checking
 * rather than believing, and it is checkable here because nothing else is
 * allowed to vary. Open it in greyscale and nothing is lost.
 *
 * NO DEADLINE HERE, DELIBERATELY. `dueBy` and `urgency` are independent inputs
 * and this file derives neither from the other, so a fixed calendar date beside
 * a relative phrase will disagree with it as soon as the date is far enough
 * away. A demo that ships into other repositories is the worst place to
 * teach that pairing. The deadline has its own example, where it is the
 * subject and the disagreement cannot arise.
 *
 * No status pill and no urgent anything. The escalation budget is one urgent
 * surface per screen, and a demo that spent it would be teaching the wrong
 * lesson in the first thing anybody sees. The instructions and the authors are
 * deliberately fictional (ADR 0012): no real measurement, no real clinic, no
 * number anybody could mistake for their own, and no sentence that compares a
 * reading to a range this card cannot show.
 */
export default function CareCardDemo() {
  const timings: CareUrgency[] = ["when-convenient", "this-week", "today"]

  return (
    <div className="gap-opsin-4 flex w-full max-w-md flex-col">
      {timings.map((urgency) => (
        <CareCard
          key={urgency}
          heading="Book a repeat of the example measurement"
          urgency={urgency}
          attribution="Your example clinic asks"
          reason="The clinic asked for a repeat when it last looked at this example measurement."
          actions={[{ label: "Book a repeat", href: "#example" }]}
        />
      ))}
    </div>
  )
}
