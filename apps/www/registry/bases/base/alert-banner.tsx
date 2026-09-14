/**
 * AlertBanner puts a message at the top of a surface, at one of the four
 * levels, because something has changed that the reader needs to know about
 * before they carry on with what they came to do.
 *
 * THIS IS THE ONE COMPONENT IN OPSINJS ENTITLED TO `role="alert"`, AND ONLY AT
 * `urgent`. Every other surface in the system announces politely or not at all,
 * and none of them may mount a live region on a caller's behalf. The whole of
 * the announcement contract is these four rows, and it is the reason the
 * component exists as a governed surface rather than as a div with a red
 * border:
 *
 *   steady    no role, no live region. Ordinary content in the reading order.
 *   watch     the same.
 *   attention `aria-live="polite"` and `aria-atomic="true"` on an inner
 *             wrapper. It waits for a gap in whatever the reader is listening
 *             to.
 *   urgent    `role="alert"` on that same wrapper, which implies assertive and
 *             atomic, with `aria-atomic="true"` written out anyway. It
 *             interrupts.
 *
 * THE LIVE REGION IS AN INNER WRAPPER, NOT THE ROOT. It holds only the heading
 * and the body, so an announcement carries the level and the sentence and
 * nothing else. The actions, the dismiss control and any timestamp are direct
 * children of the section after it and sit outside the region, so a reader
 * reaches them as controls rather than hearing them read out inside an atomic
 * string, and a control or a timestamp that changes re-announces nothing.
 *
 * A BANNER PRESENT WHEN THE PAGE LOADS SHOULD NOT BE ANNOUNCED AS A CHANGE, and
 * this file implements exactly none of that. Screen readers do not announce
 * live regions that were in the document at load; they announce what arrives
 * afterwards. So the behaviour the specification asks for is a behaviour we
 * inherit rather than one we wrote, and the honest way to record that is to say
 * so here and on the page rather than to claim it. The alternative is to mount
 * the role after a frame, so the component can be sure. That moves an
 * announcement decision into a timer, and a timer is the thing that fires while
 * somebody is mid-sentence.
 *
 * THE WORD AND THE GLYPH ARE DELEGATED TO StatusPill, WHICH IS WHY THIS FILE
 * DRAWS NO STATUS OF ITS OWN. It paints the fill, the ink and the boundary of a
 * status surface, and then renders a pill inside the heading for the level's
 * word and its distinct silhouette. `scripts/check-a11y.mts` reports one
 * A11Y001 WARNING for this file for that reason: it reads one file at a time,
 * it can see `data-status` and a status fill here and no `CLINICAL_STATUS_META`
 * and no lucide import, and it cannot follow the import to find where the word
 * went. Its own comment names this component as the shape the escape hatch
 * exists for. The check is right to say it cannot tell; the repair is a check
 * that can follow an import, not a second copy of the four words in this file.
 *
 * WHY THE PILL SITS INSIDE THE HEADING. The specification requires the level's
 * word to be in the heading so that grayscale, colour-vision deficiency and
 * text-only rendering all keep the meaning. It also asks the CALLER to put it
 * there, in a `heading` string that "must contain the level's word". A rule a
 * caller can break silently is not a rule: a heading reading *Urgent* over
 * `status="watch"` is two different verdicts on one surface, and nothing catches
 * it. Rendering the pill as the heading's first child makes the word structural.
 * Heading navigation lands on "Needs attention, your example measurement is
 * outside the range your clinic set", the word cannot disagree with the level,
 * and the caller's sentence is free to name the subject, which is the half only
 * they know.
 *
 * IT DERIVES NOTHING. `status` is assigned by the consuming product from a
 * reference range or a clinically reviewed threshold that the product owns.
 * There is no comparison in this file, no threshold, no default staleness and
 * no rule that raises or lowers a level.
 *
 * IT IS A SERVER COMPONENT. No state, no hook, no timer, no Base UI primitive,
 * and no entrance animation to schedule. `onSelect` and `onAcknowledge` do not
 * change that: a function cannot cross the server/client boundary, so a banner
 * given one is already being rendered by a client component and this file joins
 * that graph without a directive of its own. The `href` form of an action stays
 * server-rendered, and it is the form to prefer.
 */

import type { ReactNode } from "react"

import {
  isClinicalStatus,
  isDevelopment,
  warnOnce,
  type ClinicalStatus,
} from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button, cardActionClassName } from "@/registry/base-lyra/ui/button"
import { Link } from "@/registry/base-lyra/ui/link"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"

/**
 * Development warnings, said once per distinct offender.
 *
 * `warnOnce` in the substrate is keyed to an `OpsinErrorCode`, and the codes in
 * `tokens/errors.json` describe mistakes a consumer makes with the clinical
 * API. Two of the complaints below have one. A status outside the four levels
 * and `unknown` used as a fifth both go through `warnOnce`. The rest are
 * mistakes with THIS component's own API, no code exists for them, and a
 * component may not mint one: the codes are a versioned contract and the table
 * on the errors page is generated from that file. So this file keeps a small
 * set of its own, keyed the way `warnOnce` keys its own, because a warning
 * printed on every render degrades into noise, and it prints twice per render
 * under Strict Mode. A noisy channel is one somebody switches off.
 *
 * The key is coarser than "once per call site", because a call site is not
 * observable from inside a function. Two banners with the same heading and the
 * same mistake share one warning. That is the most this can honestly promise.
 */
const MAX_WARNED_KEYS = 500

/** Not a real key. It only records that the cap notice has been printed. */
const CAP_KEY = "\u0000cap"

/* Allocated on first use rather than at module scope, so a production bundle,
   where `warnDev` returns before it reads anything, carries no set at all. */
let warned: Set<string> | undefined

function warnDev(key: string, message: string): void {
  if (!isDevelopment()) return
  if (warned === undefined) warned = new Set<string>()
  if (warned.has(key)) return

  /* BOUNDED, BECAUSE EVERY KEY HERE CONTAINS CALLER-SUPPLIED HEADING TEXT. The
     set is never cleared and a development session runs for days, so a screen
     rendering a banner per subject grows it without a ceiling. At the cap the
     channel says so once and then goes quiet, rather than either leaking or
     reverting to warning on every render. `warnOnce` in the substrate caps its
     own shared channel at the same number for the same reason: a warning
     channel that degrades into noise is one somebody switches off. */
  if (warned.size >= MAX_WARNED_KEYS) {
    if (!warned.has(CAP_KEY)) {
      warned.add(CAP_KEY)
      console.warn(
        `[opsinjs] <AlertBanner> has reported ${MAX_WARNED_KEYS} distinct ` +
          "development warnings and will not report new ones for the rest of " +
          "this session. Fix the ones already printed and reload.",
      )
    }
    return
  }

  warned.add(key)
  console.warn(message)
}

/**
 * Tailwind reads class names out of source as literal strings, so these cannot
 * be assembled from the level at runtime. `bg-status-${status}-surface`
 * generates no CSS at all and the banner renders unstyled on a white page with
 * no boundary. Written out, once, exactly as StatusPill writes its own.
 *
 * Which role does which job matters more here than anywhere else in the system,
 * because this is the only surface in opsinjs that takes a status fill. `-ink`
 * is the text guaranteed legible on `-surface`, and the bare `-<level>` name is
 * the LINE role, which is the boundary. `-accent` is absent on purpose: it is
 * the identity fill, chosen for recognition rather than contrast, and it is
 * never text and never a sole boundary.
 *
 * ONE TREATMENT AND FOUR TINTS, with no extra weight at the top of the ladder.
 * A thicker edge or a heavier fill for `urgent` is the obvious next idea and it
 * is the wrong one: the measured CVD audit in `tokens/color.json` finds
 * `steady` and `attention` identical under deuteranopia and in greyscale, so a
 * second visual axis would have to carry the level on its own for those
 * readers. A border width cannot say which of four levels this is. The word
 * does that, in the heading, where it cannot be lost. Colour is the scanning
 * aid for the readers who have it.
 */
const TONE: Record<ClinicalStatus, string> = {
  steady: "border-status-steady bg-status-steady-surface text-status-steady-ink",
  watch: "border-status-watch bg-status-watch-surface text-status-watch-ink",
  attention:
    "border-status-attention bg-status-attention-surface text-status-attention-ink",
  urgent: "border-status-urgent bg-status-urgent-surface text-status-urgent-ink",
}

/**
 * The boundary role per level, for a control that draws its own edge on the
 * banner. It is the bare `-<level>` LINE role, written out as literals because
 * Tailwind reads class names as literal strings and `border-status-${status}`
 * generates no CSS at all.
 *
 * `lib/generated/contrast.json` records line-on-surface at WCAG 4.45 to 5.09 in
 * light and 7.99 to 8.17 in dark for the four levels, all above the 3:1
 * non-text floor, so a control drawn with it needs no new measurement. It is
 * the same role `TONE` already uses for the banner's own edge; here it is
 * handed to a control that is not the banner.
 */
const LINE_EDGE: Record<ClinicalStatus, string> = {
  steady: "border-status-steady",
  watch: "border-status-watch",
  attention: "border-status-attention",
  urgent: "border-status-urgent",
}

/**
 * The ink for a composed Button, addressed at the wrapper as a `[&_button]`
 * selector so it reaches every Button the banner draws: the `onSelect` form of
 * an action and the dismiss control. The `href` form is an anchor rather than a
 * Button, so the selector leaves it alone and it takes the same level ink
 * straight from the surface's inherited TONE. No control on this surface brings
 * an opaque fill of its own any more, so each one inherits whatever colour
 * cascades in, and on a status tint that has to be the level's own `-ink`.
 *
 * The override is load-bearing because `Button variant="quiet"` now asserts
 * `[color:var(--primary)]` rather than inheriting. Left alone a quiet Button
 * would paint the brand action colour on a clinical tint, a cross-axis pair
 * nothing has measured. `-ink` on `-surface` is the pair the ramps are built to
 * guarantee, recorded at WCAG 9.62 to 12.74 in `lib/generated/contrast.json`,
 * so the wrapper hands the level's ink down and the quiet default never shows.
 *
 * IT IS ADDRESSED AT THE WRAPPER AS A DESCENDANT SELECTOR, AND THAT IS A
 * REPAIR RATHER THAN A PREFERENCE. Passed through Button's own `className`,
 * which is what this file did first, `cn()` files `text-status-<level>-ink` in
 * the same tailwind-merge conflict group as the `text-opsin-subheadline` that
 * `size="sm"` contributes, and keeps only the later of the two: the colour
 * arrived and the type step silently vanished, so the dismiss control did not
 * render at the size Button documents. Reproduced against tailwind-merge 3.6.0,
 * which is what this repository pins. A descendant selector belongs to no
 * conflict group, so both survive, and `relative-time` made the identical
 * repair for the identical reason.
 */
const ON_SURFACE_INK: Record<ClinicalStatus, string> = {
  steady: "[&_button]:text-status-steady-ink",
  watch: "[&_button]:text-status-watch-ink",
  attention: "[&_button]:text-status-attention-ink",
  urgent: "[&_button]:text-status-urgent-ink",
}

/**
 * The heading tag per level.
 *
 * A `Record` rather than a template string, so a level with no tag is a compile
 * error rather than a `<h7>` the browser renders as an unstyled inline element
 * with no place in the outline.
 *
 * THE TYPE IS NOT THE GUARD, AND THAT DISTINCTION COST A WHOLE SCREEN. A
 * `Record` lookup that misses returns `undefined`, and `undefined` in element
 * position is React's "Element type is invalid". That is a throw rather than a
 * heading at the wrong depth, which takes the banner, the clinical message and
 * whatever else shared the subtree down with it. `null` is the shape a JSON-
 * or CMS-driven caller passes to mean "no override"; `1` is what a caller
 * reaches for after reading that there is no `h1`; and this file ships as
 * source into JavaScript projects where a type is advice. So the level is
 * checked at runtime the way `status` is, with one difference: the fallback is
 * `h2` rather than a refusal. A banner at the wrong outline depth is
 * recoverable and a banner that throws is not, and unlike an unrecognised
 * `status` an unrecognised heading level invents no verdict about anybody.
 */
const HEADING_TAGS: Record<AlertHeadingLevel, "h2" | "h3" | "h4" | "h5" | "h6"> =
  {
    2: "h2",
    3: "h3",
    4: "h4",
    5: "h5",
    6: "h6",
  }

function isAlertHeadingLevel(value: unknown): value is AlertHeadingLevel {
  return value === 2 || value === 3 || value === 4 || value === 5 || value === 6
}

/**
 * The heading levels a banner may take. There is no `h1`: a banner is never a
 * page.
 *
 * DECLARED, NOT EXPORTED. A registry file's public surface is the props
 * interface, the component and its zero-prop demo, and every symbol beyond
 * those is one more thing a consumer's project acquires and this system has to
 * keep stable. A caller who needs to name the union writes
 * `AlertBannerProps["headingLevel"]`, which is the same union and cannot drift
 * from it. Callout declares its variant union the same way for the same reason.
 */
type AlertHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * One thing the reader can do about the message.
 *
 * EXPORTED, unlike the union above, because a caller assembling actions
 * somewhere other than the JSX needs to name the element type, and
 * `AlertBannerProps["actions"]` is `AlertAction[] | undefined`, which is the
 * wrong shape for that. The declaration itself reads
 * `const actions: AlertAction[] = …`. ScoreDial exports `ScoreBand` for the
 * same reason. The generated props table only covers interfaces named
 * `<Pascal>Props`, so this one is documented by hand on the specification page.
 */
export interface AlertAction {
  /**
   * Imperative and concrete, naming what happens: *Contact your clinic*, not
   * *Learn more*. It is the accessible name of the control and the thing a
   * voice-control user has to say out loud.
   */
  label: string
  /**
   * Where it goes. Renders an anchor, which survives a new tab, a copied
   * address and a screen reader's list of links.
   */
  href?: string
  /**
   * What it does. Renders a Button. Supply one of `href` and `onSelect`: an
   * action with neither is a control that acknowledges a press and then does
   * nothing, which reads as a broken screen.
   */
  onSelect?: () => void
  /**
   * Marks the action the product recommends. Emphasis follows POSITION rather
   * than this flag. The first action is the recommended one, because a
   * screen-reader user meets the actions in DOM order and the recommended one
   * has to be the one they meet first. Set on any action but the first, it is
   * refused and reported: reading order and visual emphasis disagreeing is the
   * defect, not the flag.
   */
  recommended?: boolean
}

export interface AlertBannerProps {
  /**
   * The level, assigned by the product. Required, and it drives the role, the
   * announcement and the affordances rather than only the colour.
   *
   * `steady` is legal, and it is the level worth being careful with. Its one
   * honest use is de-escalation. That means saying that a condition the
   * product raised earlier has resolved, which is news the reader is owed and
   * which no other component in the system delivers. It is not a place to put a
   * message that needs nothing: a banner that can say "nothing needs
   * attention" is a banner a product will reach for whenever it wants to be
   * noticed, and it still spends one of the two the screen is allowed. If
   * nothing has changed, the component is a Callout.
   *
   * There is no `unknown`. It is the absence of an assertion rather than a fifth
   * level, and an interruption with no level is an interruption with no meaning.
   *
   * ESCALATE BY REMOUNTING, NOT BY RE-RENDERING. Raising the level on a banner
   * that is already on the screen patches `role` and `aria-live` onto a DOM
   * node assistive technology has already registered, and a live region is
   * registered when its node is inserted: adding the role afterwards commonly
   * announces nothing at all, which on the way up to `urgent` is the one
   * failure this component exists to prevent. Give the element a key that
   * contains the level, so React replaces the node instead of patching it. That
   * key is `key={status}`. Nobody has confirmed this with a screen reader; it
   * is the conservative reading of the live-region model and it is written
   * here rather than left implicit, because the recipe this component appears
   * in escalates exactly this way.
   */
  status: ClinicalStatus
  /**
   * What happened, in the reader's words, naming the subject in under eight
   * words. Sentence case, and no exclamation marks.
   *
   * It does NOT need to contain the level's word, and should not repeat it: the
   * component renders the level as a StatusPill inside this heading, so the word
   * is there whatever the caller writes and cannot disagree with `status`. The
   * specification asked the caller to write it in; making it structural is the
   * one change this implementation makes to that contract.
   */
  heading: string
  /**
   * One or two sentences: what happened, then what it means for this reader, in
   * that order and in the second person. Longer than that and the message is an
   * instruction with steps, which is a CareCard.
   */
  children: ReactNode
  /**
   * Which heading element the banner's heading renders as. Defaults to `h2`.
   *
   * The component cannot know where it sits, and a heading at the wrong level
   * makes an outline that skips a level on one screen and repeats one on the
   * next. Pass the level below the heading of the surface the banner is on.
   * Inside a section that already has an `h2`, pass `h3`.
   */
  headingLevel?: AlertHeadingLevel
  /**
   * When the condition was detected, ISO 8601 with an offset. The instant the
   * product's rules found the condition, not the instant this rendered. A
   * banner stamped with its own render time tells the reader something that is
   * true of the page and false of their data.
   *
   * IT IS CARRIED AS `data-detected-at` ON THE ROOT AND IS NOT RENDERED AS A
   * PHRASE. RelativeTime has no word for an instant a product's rules produced,
   * and the three obvious candidates, 'detected', 'flagged' and 'triggered',
   * are banned as machine register by the content doctrine. Built from one of
   * RelativeTime's five near words, "Recorded 1 hour ago" over a sentence about
   * a reading would be taken for the age of the reading, which it is not: a rule
   * that ran an hour ago may have found a reading taken days before it, and that
   * pair of separately-true statements is what RelativeTime's own file calls
   * the most consequential error in health dashboards. So the instant stays in
   * the DOM for a stylesheet, a test and an export, and the banner asserts
   * nothing about it in words. If the reader needs to know how old the reading
   * is, show that where the reading is.
   */
  detectedAt?: string
  /**
   * The instant `detectedAt` would be measured against, in the same form. It
   * renders no phrase today, because RelativeTime has no word for an instant a
   * product's rules produced and the obvious candidates are banned as machine
   * register. The one thing it drives is a development warning: passing it says
   * you expected a rendered relative phrase, so the component tells you none is
   * rendered rather than swallowing the prop in silence. The prop is retained
   * for the day that grammar gains such a word, so a caller already passing the
   * pair does not have to change when the phrase returns. A component that read the
   * clock itself would be impure and would make two timestamps on one screen
   * disagree across a minute boundary, so where it is passed, read it once where
   * the screen is rendered as `new Date().toISOString()` and pass the same value
   * to every timestamp on it.
   */
  now?: string
  /**
   * At most two. Required at `attention` and `urgent`. At those two levels a
   * banner with nothing to do about it is the most common way a health product
   * creates anxiety it cannot resolve, and this component reports the omission
   * rather than quietly rendering it.
   */
  actions?: AlertAction[]
  /**
   * Whether the reader may take the banner away. It needs `onAcknowledge` to do
   * anything at any level: this component never removes itself, so the product
   * is what stops rendering it, and a dismiss control with nowhere to report to
   * is a control that does nothing.
   */
  dismissible?: boolean
  /**
   * Called when the reader dismisses the banner. At `urgent` it is the whole of
   * the affordance: an urgent banner may only be taken away by an
   * acknowledgement the product records, because a reader who swipes a banner
   * away on a bus has not been informed and nothing downstream can tell
   * dismissal apart from understanding.
   */
  onAcknowledge?: () => void
  /**
   * The dismiss control's visible word. Defaults to *Dismiss*, and the heading
   * is appended to the accessible name so it says what it dismisses rather than
   * standing alone. Override it to translate, or to say what acknowledgement
   * means in this product. One product might say *I have read this*.
   */
  dismissLabel?: string
  /**
   * BCP 47 language tag for a formatted value. The banner has none to format
   * today: the timestamp was the one formatted thing on the surface and it is
   * withdrawn, because RelativeTime has no word for an instant a product's rules
   * produced. Like `now`, passing it beside `detectedAt` raises the development
   * warning that no phrase is rendered. The prop is retained for the day a
   * formatted value returns, and when one does, omitted, the reader's own
   * environment decides. It does not translate the dismiss control;
   * `dismissLabel` is the override for that word.
   */
  locale?: string
  /**
   * IANA time zone name (for example `Europe/London`) for a formatted absolute
   * time. The banner has none to format today, for the reason `locale` gives:
   * the timestamp was the one formatted thing on the surface and it is
   * withdrawn. It is retained beside `now` and `locale` so a caller who is
   * already forwarding the reading's zone does not have to change on the day a
   * formatted value returns, and when one does return this is the prop that
   * decides the reader's wall clock rather than the instant's stored offset.
   * Like `now` and `locale`, passing it beside `detectedAt` raises the
   * development warning that no phrase is rendered. Pass an IANA name rather
   * than an offset such as `+01:00`: an offset cannot name a place and does not
   * survive a daylight-saving boundary, which is the trap RelativeTime's own
   * `timeZone` guard rejects.
   */
  timeZone?: string
  /**
   * Merged onto the root, and a class passed here WINS over the component's own
   * where the two conflict. A banner sets no width and no margin, because both
   * belong to the surface it sits at the top of.
   *
   * It is also the one way left to hide what this component insists on: a
   * `sr-only`, a zeroed type size or a `truncate` passed here reaches the root
   * and takes the heading, the body or the actions off the screen while leaving
   * them in the tree. The component says so rather than pretending the hole is
   * not there.
   */
  className?: string
}

/**
 * Turn one action into a control, or into nothing.
 *
 * Returning `null` rather than rendering something is the point. A control with
 * no name is unreachable by voice and announced as "button"; a control with
 * neither a destination nor a handler is a promise the banner cannot keep, and
 * at `attention` or `urgent` a broken action is worse than a missing one,
 * because the reader has been told there is something to do.
 */
function actionControl(
  action: AlertAction,
  emphasis: "primary" | "secondary",
  status: ClinicalStatus,
  owner: string,
  id: string,
): ReactNode {
  const label = action.label?.trim() ? action.label.trim() : ""
  const navigates = typeof action.href === "string" && action.href.trim() !== ""
  const acts = typeof action.onSelect === "function"

  if (label === "") {
    warnDev(
      `action-no-label:${owner}:${emphasis}`,
      "[opsinjs] <AlertBanner> was given an action with no label. The visible " +
        "label is the accessible name, and without it the control is announced " +
        'as "button" and nothing else. Nothing was rendered for it.',
    )
    return null
  }

  if (!navigates && !acts) {
    warnDev(
      `action-inert:${owner}:${label}`,
      `[opsinjs] <AlertBanner> action "${label}" has neither \`href\` nor ` +
        "`onSelect`, so there is nothing for it to do. Give it a destination or " +
        "a handler. Nothing was rendered for it.",
    )
    return null
  }

  if (navigates && acts) {
    warnDev(
      `action-both:${owner}:${label}`,
      `[opsinjs] <AlertBanner> action "${label}" has both \`href\` and ` +
        "`onSelect`. It renders as a link, because a destination survives a new " +
        "tab, a copied address and a screen reader's list of links and a handler " +
        "does not. Move the work to the page the link goes to, or drop the " +
        "`href`.",
    )
  }

  /* THE WRAPPER IS WHERE THE PART'S SLOT LIVES, AND IT IS NOT TIDINESS.
     `Button` writes `data-slot="button"` AFTER spreading the caller's props
     (button.tsx:378-381), so a `data-slot` passed to it is silently replaced.
     That was found by rendering this component to markup, which is the only way
     to find it. A composed component owning its own slot is correct; what it
     means here is that the part's slot has to go on the element around it.
     EmptyState solves the identical problem the identical way. The alternative
     is one slot name on the link branch and another on the button branch, which
     is a DOM contract that describes two different components depending on
     which prop the caller passed. */
  /* ONE LADDER FOR BOTH TRANSPORTS, AND NO NEUTRAL ROLE ON A STATUS SURFACE.
     `Button variant="primary"` is a brand fill and `variant="secondary"` is a
     neutral `bg-card` island; both would sit on the four tints unmeasured, and
     the neutral island in particular is no boundary against them, measuring 1.07
     to 1.22 in both themes. Using secondary would also make the way out read as
     the same weight as the action. So a handler-form action is `variant="quiet"`,
     which brings no fill of its own and takes the level's ink from
     ON_SURFACE_INK on the wrapper, for the same reason the dismiss control does.
     The recommended arm adds the tinted recommended delta, which is a radius, a
     2px boundary and the underline, plus the level's line colour, so the href
     and onSelect forms of one action look alike; the quiet arm adds the
     underline alone. Both arms carry the underline, because D2's button table
     keeps it on every card action so that neither transport of an action reads
     as a paragraph. Both deltas come from
     `cardActionClassName({..., ground: "tinted", as: "button"})` in `button.tsx`,
     the same recipe the `href` form takes through `Link`, so the two transports
     of one action are drawn from one source and cannot drift. The size follows
     the weight: recommended takes `md` at the headline step and the second takes
     `sm`, so the two forms of one action stop
     reading as different amounts of emphasis. Button renders its own boundary
     width as an inline style, so the recommended button's edge lands at the
     hairline rather than the anchor's 2px, and the boundary is present and
     level-coloured on both. */
  const size = emphasis === "primary" ? "md" : "sm"
  const buttonDelta =
    emphasis === "primary"
      ? cn(
          cardActionClassName({ weight: "recommended", ground: "tinted", as: "button" }),
          LINE_EDGE[status],
        )
      : cardActionClassName({ weight: "quiet", ground: "tinted", as: "button" })

  return (
    <div
      key={id}
      data-slot="alert-banner-action"
      className={cn("min-w-0", !navigates && ON_SURFACE_INK[status])}
    >
      {navigates ? (
        /* The `href` form is the shared `Link`, so the anchor and the
           handler-form Button above are the same control drawn from one recipe.
           `ground="tinted"` selects the arm that brings no neutral fill: on the
           banner's status tint the label inherits the level's own `-ink` from
           TONE, and the recommended arm's 2px boundary takes the level's line
           colour, passed here as `LINE_EDGE[status]` beside the recipe. The
           quiet arm keeps `hover:bg-muted`, which puts a neutral fill under
           status ink for the duration of a hover; that is a cross-scope pair
           nothing has measured, and it is disclosed on the page beside the focus
           ring rather than left to be found. */
        <Link
          href={action.href!}
          emphasis={emphasis === "primary" ? "action" : "secondary"}
          ground="tinted"
          className={emphasis === "primary" ? LINE_EDGE[status] : undefined}
        >
          {label}
        </Link>
      ) : (
        <Button
          variant="quiet"
          size={size}
          className={buttonDelta}
          onClick={action.onSelect}
        >
          {label}
        </Button>
      )}
    </div>
  )
}

export function AlertBanner({
  status,
  heading,
  children,
  headingLevel = 2,
  detectedAt,
  now,
  locale,
  timeZone,
  actions,
  dismissible = false,
  onAcknowledge,
  dismissLabel,
  className,
}: AlertBannerProps) {
  /* THE FIFTH LEVEL IS REFUSED, NOT APPROXIMATED, and here the refusal costs
     more than it does on a pill: nothing is rendered, so the product's message
     does not reach the reader at all. That is the right way round. This file
     ships as source into JavaScript projects where a type is advice, and a
     value outside the vocabulary has no fill, no word and no announcement
     contract. Those three things are what make this component different from a
     paragraph. Rendering it as a neutral notice would silently move a clinical
     message onto a surface with no level, no budget and no reviewer, which is
     the leak the two-axis rule exists to stop; rendering it as a plausible
     level would be this component inventing a verdict about somebody's health.
     `unknown` gets its own code because it is the likeliest wrong answer and the
     most dangerous: it is the absence of an assertion, and a reader who meets it
     rendered as a level reads it as "probably fine". */
  if (!isClinicalStatus(status)) {
    warnOnce(status === "unknown" ? "OPSIN-0011" : "OPSIN-0021", {
      component: "AlertBanner",
      status: String(status),
    })
    return null
  }

  const headingText = heading?.trim() ? heading.trim() : ""
  /* The key for this banner's own warnings. The heading is the only thing that
     distinguishes one banner from another from inside this function, so it is
     what makes two mistakes on two banners two warnings instead of one. */
  const owner = headingText === "" ? `<${status}>` : headingText

  if (headingText === "") {
    warnDev(
      `no-heading:${status}`,
      "[opsinjs] <AlertBanner> was given an empty `heading`. The heading is what " +
        "a screen-reader user finds by heading navigation and what names the " +
        "subject the level applies to; without it the banner announces a level " +
        "floating free. The level's own word is still rendered, and nothing else " +
        "is.",
    )
  }

  /* THE SAME THREAT MODEL AS `status` AND `headingLevel`. A non-array here
     reaches `.map` and throws "supplied.map is not a function", and a throw is
     the one failure in this file that is not scoped to the banner: it takes the
     screen the message was on. Treated as no actions, which at `attention` and
     `urgent` is then reported by the check below as the composition error it
     is. */
  const supplied = Array.isArray(actions) ? actions : []
  if (actions !== undefined && !Array.isArray(actions)) {
    warnDev(
      `actions-not-an-array:${owner}`,
      "[opsinjs] <AlertBanner> was given an `actions` value that is not an " +
        "array. It expects `AlertAction[]`; a single object is the usual " +
        "mistake, and wrapping it in an array is the fix. Nothing was rendered " +
        "for it.",
    )
  }
  const needsAction = status === "attention" || status === "urgent"

  /* Built before the warnings below rather than in the JSX, so that "this
     banner has no action" means what a reader would mean by it. An action with
     no label, or with neither a destination nor a handler, is refused by
     `actionControl` and renders nothing. A banner whose only action was
     refused is a banner with no action, which at `attention` and `urgent` is
     the composition error worth reporting. Counting the array instead would
     report the shape of the props and not the shape of the screen. */
  const controls = supplied
    .map((action, index) =>
      actionControl(
        action,
        index === 0 ? "primary" : "secondary",
        status,
        owner,
        `${index}-${action.label}`,
      ),
    )
    .filter((control) => control !== null)

  /* A COMPOSITION ERROR, REPORTED AND THEN RENDERED. Telling somebody that
     something needs action without offering one is the most common way a health
     product creates anxiety it cannot resolve. The sentence is nevertheless
     still the most useful thing on the screen, and taking it away over a
     missing button would be the larger mistake. */
  if (needsAction && controls.length === 0) {
    warnDev(
      `no-actions:${owner}`,
      `[opsinjs] <AlertBanner status="${status}"> has no actions. At this level ` +
        "the banner asserts there is something specific to do, and a banner that " +
        "says so with nothing attached leaves the reader with the alarm and no " +
        "route out of it. Give it one action, or lower the level.",
    )
  }

  if (supplied.length > 2) {
    warnDev(
      `too-many-actions:${owner}`,
      `[opsinjs] <AlertBanner> was given ${supplied.length} actions. The ceiling ` +
        "is two: a banner with a menu on it is a screen, and a reader scanning " +
        "an interruption reads the first control and rarely the third. All of " +
        "them were rendered. The choice of which to drop is the product's.",
    )
  }

  if (supplied.some((action, index) => action.recommended === true && index > 0)) {
    warnDev(
      `recommended-not-first:${owner}`,
      "[opsinjs] <AlertBanner> marks an action `recommended` that is not the " +
        "first one. Emphasis follows position here, because a screen-reader user " +
        "meets the actions in DOM order and the recommended one has to be the " +
        "one they meet first. Reorder the array; the flag on a later action was " +
        "ignored.",
    )
  }

  const acknowledges = typeof onAcknowledge === "function"

  /* DISMISSAL NEEDS SOMEWHERE TO REPORT TO, AT EVERY LEVEL. The specification
     makes acknowledgement a condition at `urgent` only, and the reason it gives
     is that the product cannot tell dismissal apart from understanding, which
     is not a property of urgency. It is a property of this component never
     removing itself: the caller decides what is on screen, so a dismiss control
     with no callback is a control that acknowledges a press and changes
     nothing. The condition is therefore the same at all four levels, and the
     difference at `urgent` is what the callback is FOR: recording, rather than
     remembering a preference. */
  const dismisses = dismissible && acknowledges
  if (dismissible && !acknowledges) {
    warnDev(
      `dismiss-without-callback:${owner}`,
      "[opsinjs] <AlertBanner> has `dismissible` and no `onAcknowledge`. This " +
        "component never takes itself off the screen, so the control would have " +
        "nowhere to report to and nothing would happen when it was pressed. No " +
        "dismiss control was rendered. At `urgent` the callback is also the " +
        "record: an urgent banner may only be removed by an acknowledgement the " +
        "product keeps.",
    )
  }

  const hasDetected =
    typeof detectedAt === "string" && detectedAt.trim() !== ""

  /* The warning fires on the intent, not on `detectedAt` alone. Carrying the
     instant as `data-detected-at` for a stylesheet, a test or an export is the
     endorsed use and never warns. Passing `now`, `locale` or `timeZone` is the
     signal that a caller expected a rendered relative phrase, because those
     three props do nothing else on this surface, so that is the only case worth
     a word. */
  if (
    hasDetected &&
    (now !== undefined || locale !== undefined || timeZone !== undefined)
  ) {
    warnDev(
      `time-props-not-rendered:${owner}`,
      "[opsinjs] <AlertBanner> was given `now`, `locale` or `timeZone` beside " +
        "`detectedAt`, which reads as expecting a rendered relative phrase. " +
        "None is rendered, because RelativeTime has no word for an instant a " +
        "product's rules produced and the three obvious candidates, " +
        "'detected', 'flagged' and 'triggered', are banned as machine " +
        "register. The instant is still carried on the root as " +
        "`data-detected-at` for a stylesheet, a test or an export, so drop " +
        "`now`, `locale` and `timeZone` until the phrase returns. The age of " +
        "the READING belongs where the reading is, not on the banner.",
    )
  }

  /* See HEADING_TAGS. Outside 2-6 this lookup returns `undefined`, which in
     element position is a render error rather than a wrong heading. */
  const level = isAlertHeadingLevel(headingLevel) ? headingLevel : 2
  if (!isAlertHeadingLevel(headingLevel)) {
    warnDev(
      `heading-level:${owner}`,
      `[opsinjs] <AlertBanner> was given headingLevel={${String(headingLevel)}}. ` +
        "The levels are 2 to 6. There is no `h1`, because a banner is never a " +
        "page. It was rendered as `h2`, which may be the wrong depth for where " +
        "this banner sits: pass the level below the heading of the surface it " +
        "is on.",
    )
  }
  const Heading = HEADING_TAGS[level]

  return (
    /* THE ROLE FOLLOWS THE LEVEL, AND NOTHING ELSE. Not the styling, not the
       position on the screen, and not a prop. A caller who could ask for
       `role="alert"` at `watch` would have the whole of the escalation ladder
       available as an attribute.

       `role="alert"` carries assertive and atomic with it, so `aria-live` is
       not written out at `urgent`. `aria-atomic` IS written out at both levels
       that have a region, and the redundancy is deliberate: `aria-live` alone
       announces only the part that changed and a banner means nothing in
       fragments, and the implicit value is the one with the weaker record
       across assistive-technology and browser pairs. Nobody has listened to
       this component, so the level that can least afford a partial announcement
       is the level that should carry the fewest untested assumptions.

       THE REGION IS AN INNER WRAPPER, AND THE CONTROLS AND THE TIMESTAMP SIT
       OUTSIDE IT. An atomic region announces its whole subtree as one string,
       so a link inside one is read as prose rather than offered as a link, and
       any part of it that re-renders, a ticking timestamp most of all, re-runs
       the whole announcement, assertively at `urgent`. The wrapper holds only
       the heading and the body. The actions row, the dismiss control and any
       timestamp are direct children of the section after it, so they stay
       navigable controls and their changes announce nothing.

       AT `steady` AND `watch` THE ELEMENT HAS NO ROLE AT ALL, and that is a
       departure from doctrine rather than an implementation of it.
       `clinical-status-semantics` rule 6 asks for a polite announcement at
       those two levels. What it is describing is a status CHANGING on a
       surface; a banner is a surface that arrives, and a `steady` banner that
       announced itself would be an interruption whose whole content is that
       nothing needs attention. That is the shape `alarm-fatigue` spends its
       length arguing against. The cost is real and is named on the page
       rather than left here: a reader already on the screen when a
       de-escalation banner appears is not told, and the sentence that
       withdraws an earlier alert is the one a listening reader most needs.

       ESCALATING IN PLACE IS THE CASE THIS ELEMENT CANNOT COVER FROM INSIDE
       ITSELF. A caller who re-renders the same `<AlertBanner>` with a higher
       `status` gets these attributes patched onto the DOM node that is already
       there, and assistive technology registers a live region when the node is
       inserted. Adding `aria-live` to, or swapping `role="alert"` onto, a node
       already in the document commonly announces nothing. A component cannot
       key itself, so the remedy belongs to the caller and is written down in
       the `status` prop below: escalate by remounting.

       WHAT IS NOT HERE IS AS DELIBERATE AS WHAT IS. No `aria-label` and no
       `aria-labelledby`, so the root is not a named landmark. Naming it would
       need a generated id, which needs `useId`, which would make every banner
       in every product a client component for the sake of a name that duplicates
       the heading directly beneath it. On a live region an accessible name
       can displace the content in the announcement, which is the one thing this
       element exists to deliver. The cost is real and is listed on the page
       rather than left for somebody to discover: a screen-reader user gets no
       landmark boundary, only a heading.

       No focus management either, at any level. A banner never moves focus on
       appearance: focus belongs to whatever the reader was doing, and if the
       product needs a response before anything else can happen, that is a
       Dialog and it should say so.

       No entrance animation, and therefore nothing to remove under
       `prefers-reduced-motion`. Urgency is never carried by motion, at any
       level and under any circumstances. There is no pulse, no flash, no shake
       and no colour cycle, and the honest way to hold that line is to ship no
       transition at all rather than one that has to be switched off. */
    <section
      data-slot="alert-banner"
      data-status={status}
      data-detected-at={hasDetected ? detectedAt : undefined}
      className={cn(
        /* A stacked column at every width. There is no side-by-side arrangement
           to reflow away from, so 200% text grows the banner rather than
           truncating anything in it, and the actions wrap onto their own lines
           instead of shrinking below the target floor.

           `p-4` is the density-scaled step rather than `p-opsin-4`: padding
           inside a box is the canonical use of the scaled scale, so a reader who
           has asked for a denser interface gets one. The gaps between the parts
           are fixed steps, because their job is to keep the heading off the body
           and the actions apart, and neither should close up because somebody
           asked for a denser list. */
        "flex flex-col gap-opsin-3 p-4",
        "rounded-opsin-md border [corner-shape:var(--opsin-corner-shape)]",
        /* Print drops background colours by default and keeps border and text
           colours, so on paper the banner is a box defined by its status-coloured
           edge with the level's word inside it. The fill is dropped explicitly
           rather than left to the reader's print settings, so the page looks the
           same whichever way that setting is left. */
        "print:bg-transparent",
        TONE[status],
        className,
      )}
    >
      <div
        data-slot="alert-banner-announcement"
        role={status === "urgent" ? "alert" : undefined}
        aria-live={status === "attention" ? "polite" : undefined}
        aria-atomic={
          status === "attention" || status === "urgent" ? true : undefined
        }
        className="flex flex-col gap-opsin-3 min-w-0"
      >
        <Heading
          data-slot="alert-banner-heading"
          className="m-0 flex flex-col items-start gap-opsin-2 text-opsin-headline"
        >
          {/* The level, delegated. StatusPill renders the word from
            CLINICAL_STATUS_META, one of four distinct glyph silhouettes, the
            level's own colours and `data-status`. Those are the four carriers,
            none of them restated here. No `describes`: the subject is the rest
            of this heading, immediately after it, so passing it would make a
            screen reader say the subject twice.

            THE PILL TAKES `size="lg"`, THE HEADING'S OWN `headline` STEP. The
            specification's whole argument for putting the level inside the
            heading is that the word must survive greyscale and colour-vision
            deficiency, where it cannot be lost. A word set a step below the
            sentence it qualifies loses that argument on screen: it becomes the
            smallest, lightest thing on the banner and is read last, so `lg`
            makes the level read at least as loudly as the subject. */}
          <StatusPill status={status} size="lg" />
          {headingText === "" ? null : (
            <>
              {/* THE SEPARATOR IS A CHARACTER, NOT A GAP, AND THE DIFFERENCE IS
                ONLY VISIBLE IN RENDERED MARKUP. The pill and the heading text
                are two flex items with `gap-opsin-2` between them, which is a
                visual space and nothing at all in the accessibility tree: the
                announcement without this runs "Needs attention Your example
                measurement is outside the range your clinic set", one
                unpunctuated phrase with a capital in the middle of it. This
                file quoted the comma-ed version in three comments before
                anybody rendered the component and looked. StatusPill emits
                exactly this span where `describes` is passed; here the subject
                is the next element rather than a string, so the separator is
                all that is borrowed. It is absolutely positioned by `sr-only`,
                so it is not a flex item and adds no second gap.

                THE HEADING IS A COLUMN, `flex-col items-start`, so the pill is
                always its own line above the subject at every width and every
                heading length. A row would put the pill inline beside a short
                subject and above a long one, so two banners on one screen would
                present the level in two different places. `basis-full` is
                refused because it leaves `flex-wrap` in place and makes the
                arrangement depend on a rule set from outside StatusPill. The
                separator stays correct because it is not a flex item and so adds
                no third row. */}
              <span className="sr-only">, </span>
              <span data-slot="alert-banner-heading-text" className="min-w-0">
                {headingText}
              </span>
            </>
          )}
        </Heading>

        {/* `min-w-0 wrap-break-word` is the reflow repair. A flex item's floor is
          its own min-content width. That width is the longest unbreakable token
          in the body. At 200% text on a phone one long word or a bare URL would
          push the banner past the viewport, which is horizontal scroll on the
          document. The two child rules trim the outer margins off a caller's
          paragraph, so the padding above stays the padding whether the body
          arrives as a string or as a <p>. */}
        <div
          data-slot="alert-banner-body"
          className="min-w-0 wrap-break-word text-opsin-body *:first:mt-0 *:last:mb-0"
        >
          {children}
        </div>
      </div>

      {controls.length > 0 ? (
        /* The separation between two targets is the token that names the rule
           rather than the space step that happens to equal it today. `flex-wrap`
           is what keeps the floor honest at 200% text: two controls that cannot
           both fit stack, rather than one of them shrinking under 44×44. */
        <div
          data-slot="alert-banner-actions"
          className="flex flex-wrap items-center gap-(--opsin-target-separation,0.5rem)"
        >
          {controls}
        </div>
      ) : null}

      {dismisses ? (
        /* LAST IN THE DOM, AND LAST ON THE SCREEN. A dismiss control floated to
           the top corner is the usual arrangement and it puts the way out ahead
           of the message in the reading order, for the reader least able to
           skip back. Nothing here is re-arranged by CSS against the DOM, so the
           order announced is the order seen: heading, body, actions, then the
           way out.

           THE BOUNDARY IS THE LEVEL'S LINE ROLE, PASSED TO THE BUTTON AS
           `LINE_EDGE[status]`. Left as a bare quiet Button the control has no
           border, no fill and no underline, so beneath a boxed action it reads
           as a stray sentence rather than the one control whose press is the
           record. `Button variant="secondary"` was refused because it is a
           neutral `bg-card` island whose fill measures 1.07 to 1.22 against the
           four tints in both themes, which is no boundary in either direction,
           and it would make the way out look like the one action. The line role
           is a boundary `lib/generated/contrast.json` already records as
           passing, so it needs no new measurement, and the caller's className
           lands last in Button's `cn`, so it wins over the quiet variant's own
           `border-transparent` in the border-colour group while the width stays
           the inline `borderWidth` style Button always renders. */
        <div
          data-slot="alert-banner-dismiss"
          className={cn("self-start", ON_SURFACE_INK[status])}
        >
          <Button
            variant="quiet"
            size="sm"
            className={LINE_EDGE[status]}
            onClick={onAcknowledge}
          >
            {dismissLabel?.trim() ? dismissLabel.trim() : "Dismiss"}
            {/* What it dismisses, for the accessible name only. A control
                called "Close" in a list of controls is one a screen-reader user
                has to go and find the context for; "Dismiss, your example
                measurement is outside the range your clinic set" needs none.

                THE SUFFIX NO LONGER DOUBLES INSIDE AN ANNOUNCEMENT. The live
                region is an inner wrapper around the heading and the body, and
                this control is a direct child of the section after that
                wrapper, so it sits outside the region. Nothing reads the whole
                subtree as one atomic string any more, so naming what the
                control dismisses costs no repeated heading: a screen-reader
                user meets the control on its own and hears "Dismiss, your
                example measurement is outside the range your clinic set" once,
                where they meet it. */}
            {headingText === "" ? null : (
              <span className="sr-only">, {headingText}</span>
            )}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It is ONE banner rather than a row
 * of four, and that is the demo teaching the rule: the escalation budget is one
 * `urgent` per screen and two banners in total, and a specimen sheet of all four
 * levels would break it on the first surface a reader ever sees this component
 * on. The four levels are told apart on the StatusPill page, where the same four
 * words and glyphs are the whole component and nothing is interrupted to show
 * them.
 *
 * It is at `attention` because that is the level where the obligations start:
 * an action is required, the banner announces politely, and the message leads
 * with the instruction rather than with the finding. `steady` and `watch` are
 * the quiet half of the ladder and `urgent` is the half a demo should not
 * rehearse.
 *
 * THE BODY OPENS WITH THE ACTION, which is `clinical-status-semantics` on
 * `attention`: "direct and calm, action first". The DOM order on this surface
 * is fixed at heading, body, actions, so the only place an action can come
 * first is the first sentence of the body. At `steady` and `watch` the
 * order is the other way round, and the two-banner example shows that half.
 *
 * THE SECOND ACTION IS A RULE RATHER THAN A GARNISH. The body reports a
 * comparison against a range this surface has no room to show, and
 * `reference-ranges` is unambiguous that a value compared to a range is a value
 * whose range the reader can see. A banner that makes that comparison carries a
 * route to where the reading and the range are both visible.
 *
 * Both actions navigate rather than acting, which is the form to prefer and the
 * form that keeps this file server-rendered. BOTH HREFS ARE INERT, and that is
 * said here rather than left for the first keyboard user to discover: the demo
 * renders alone at `/view` with no document around it, so the fragments reach
 * nothing and pressing either changes the address and nothing else. A product
 * replaces them with two real destinations.
 *
 * The subject is fictional and carries no number, and the detection instant is
 * fixed (ADR 0012): a demo whose text depends on when the page was built cannot be
 * reviewed twice, and a screenshot of an opsinjs example must never be
 * mistakable for somebody's result.
 */
export default function AlertBannerDemo() {
  return (
    <AlertBanner
      status="attention"
      heading="Your example measurement is outside the range your clinic set"
      detectedAt="2026-03-14T09:40:00+00:00"
      actions={[
        { label: "Contact your clinic", href: "#example-clinic" },
        { label: "See the reading and the range", href: "#example-reading" },
      ]}
      className="w-full max-w-xl"
    >
      Contact your clinic before your next appointment. This reading is outside
      the range they asked us to tell you about.
    </AlertBanner>
  )
}
