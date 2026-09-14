/**
 * EmptyState is what a surface says when there is nothing on it, and what
 * to do about that.
 *
 * THIS COMPONENT WRITES NO SENTENCE ABOUT THE READER. No default body, no
 * default disclaimer, no emergency number, no threshold, and above all no
 * reassuring line about an absence. It is the whole design, and it is why `reason` is required
 * while nothing about `reason` is visible for the four empties: they need four
 * different sentences, and a component that picked one would be writing a
 * sentence about somebody's own health data on the product's behalf. opsinjs
 * does not know the reader, so it does not get to say what an absence means to
 * them.
 *
 * THE FIFTH REASON IS THE EXCEPTION, AND IT HAS TO BE. `could-not-load` is not
 * an empty at all. The system tried to fetch and failed, so the space holds an
 * error rather than an absence, and the two must never look alike. A reader who
 * takes a failed load for an empty list is told their readings are gone when
 * they are only unreachable, which is a falsehood about their own record. So
 * this one reason does render something of its own: a neutral word and an icon
 * that say the system failed, carried by no status colour and no category
 * colour, because a failed fetch is neither a clinical level nor a kind of
 * measurement. It is also the one reason whose action is mandatory, since an
 * error that offers no way back is the failure the state exists to prevent, and
 * the one state that renders no digit of any kind.
 *
 * THE REFUSAL THAT MATTERS MOST. An empty health surface is the easiest place
 * in a product to be accidentally cheerful. "Nothing to see here!", "All
 * clear" and "You're all caught up" are each a clinical claim the product
 * cannot make. A reader with no results has an empty list, not a verdict. So
 * when no body copy arrives, this component says in words that no explanation
 * was supplied rather than inventing a friendly one. There are four
 * reader-facing strings in this file. Two are the missing-body and
 * missing-title admissions; two belong to the error state, the "Could not
 * load" marker and the line shown when an error carries no way back. Every one
 * of them is an admission or a statement about the system, never a sentence
 * about the reader. All of them are written for the reader rather than the
 * developer: an author who sees one on a screen fixes it, and a reader who
 * sees one has at least not been told something untrue.
 *
 * `not-enough` IS THE SAFETY CASE and the reason `reason` exists at all. "There
 * is data, but not enough for this view to be honest" is the empty state a
 * TrendSparkline falls back to rather than drawing a line two readings do not
 * support. Its body is not decoration; it is the statement of the rule and the
 * gap, and it is missing more often than any of the other three.
 *
 * IT MOUNTS NO LIVE REGION. A view that becomes empty after a filter change
 * should be announced once, politely. That announcement belongs to the region
 * that changed, not to the component that happens to be inside it. A component
 * that mounted its own `role="status"` would speak on every keystroke of a
 * search field and would speak twice wherever the caller had already done the
 * right thing.
 *
 * IT IS A SERVER COMPONENT. It holds no state and calls no hook. `onSelect`
 * does not change that: a function cannot cross the server/client boundary, so
 * an EmptyState given one is being rendered by a client component already, and
 * this file joins that graph without a directive of its own. The `href` form
 * stays server-rendered, which is the form to prefer.
 */

import { Children, type ReactNode } from "react"
import { TriangleAlert } from "lucide-react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Button, cardActionClassName } from "@/registry/base-lyra/ui/button"
import { Link } from "@/registry/base-lyra/ui/link"

/**
 * Development warnings, said once per distinct offender.
 *
 * `warnOnce` in the substrate is keyed to an `OpsinErrorCode`, and the codes in
 * tokens/errors.json describe mistakes a consumer makes with the CLINICAL API.
 * Nothing this file complains about has a code, and a component may not mint
 * one. The codes are a versioned contract and the table on the errors page is
 * generated from that file. What the substrate is right about is the discipline
 * rather than the registry: a warning printed on every render, and twice per
 * render under Strict Mode, degrades into noise, and a noisy channel is one
 * somebody switches off. So this file keeps its own small set, keyed the way
 * `warnOnce` keys its own. The key combines the complaint with whatever names
 * the offender.
 *
 * The key is coarser than "once per call site", because a call site is not
 * observable from inside a function. Two empty states with the same title and
 * the same mistake share one warning. That is the most this can honestly
 * promise, and it is still better than the same sentence on every keystroke.
 * Allocating real codes and deleting this belongs in lib/opsinjs.ts.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The rendered text of `children`, or `null` when there will not be any.
 *
 * TypeScript cannot see this. Testing the three sentinels `""`, `null` and
 * `undefined` misses the way a body actually goes missing. It goes missing as
 * `{rows.length > 0 && "…"}` evaluating to `false`, a whitespace-only string
 * arriving from a translation table, or an empty array from a `.map()` that
 * matched nothing. `Children.toArray` drops `null`, `undefined`, booleans and
 * empty arrays for us; a string that is all whitespace is what it keeps and we
 * must still reject.
 *
 * Elements are not text and are not resolvable here, so a body containing one
 * is taken at its word and returned as `""`. It is present but unreadable
 * from here. That is the right way round: this function decides when to say
 * *nothing was supplied*, and saying it over somebody's `<strong>` would be a
 * false accusation printed on their screen.
 */
function bodyText(children: ReactNode): string | null {
  const parts = Children.toArray(children)
  if (parts.length === 0) return null
  if (!parts.every((part) => typeof part === "string" || typeof part === "number")) {
    return ""
  }
  const text = parts.map((part) => String(part)).join("").trim()
  return text === "" ? null : text
}

/**
 * Whether the whole body is a bare number.
 *
 * `{items.length && "…"}` with a length of zero passes `0`, and React renders
 * the digit. On an empty health surface that is the failure
 * [numbers-units-precision] rule 13 names outright. Zero, none and unknown are
 * three different things, and an absence is never rendered as `0`. It is also
 * checklist A4: the states have to stay distinguishable, and a `0` where a
 * sentence belongs makes an absence look like a measurement of nothing.
 *
 * A body that is only a number is a caller bug at every value and not only at
 * zero: it explains nothing about why the surface is empty. So it is refused
 * rather than printed, and the same missing-body line takes its place.
 */
function bodyIsBareNumber(text: string | null): boolean {
  return text !== null && /^-?\d+(?:[.,]\d+)?$/.test(text)
}

export interface EmptyStateProps {
  /**
   * Why the surface is empty. Required, and it deliberately changes nothing you
   * can see.
   *
   * `nothing-yet` means the reader has not added anything yet.
   * `no-matches` means a filter or a search matched nothing. The data exists.
   * `nothing-left` means there was content and there is none now; everything
   * was completed or removed.
   * `not-enough` means there is data, but not enough for this view to be
   * honest.
   * `could-not-load` means the system tried to fetch and failed. This is a
   * state about the system and not about the person: the reading is not
   * missing, the request failed. It is the one reason that renders a visible
   * marker of its own and the one reason whose `action` is mandatory, because
   * an error must always offer a retry or a route onwards.
   *
   * It is required because each one needs different words, and because two of
   * them carry more than an inconvenience: `not-enough` is a safety statement,
   * and `could-not-load` is an error that must not be mistaken for an absence.
   * The four empties render nothing of their own, because a component that
   * turned an empty into a sentence would be writing a sentence about the
   * reader's data, which is the one thing this system will not do.
   * `could-not-load` is the deliberate exception: it renders a neutral word and
   * an icon so a failed load never reads as an empty list, and it takes neither
   * axis of colour.
   */
  reason:
    | "nothing-yet"
    | "no-matches"
    | "nothing-left"
    | "not-enough"
    | "could-not-load"
  /**
   * What is not here, in one short line. Rendered as a real heading so the
   * empty state can be navigated to rather than stumbled into.
   *
   * Required, and checked as well as typed. A blank or whitespace-only string
   * renders a visible line saying the screen has no heading, and warns. It warns
   * because the alternative is a heading with no name, which is silent to
   * everything except a screen reader and an audit.
   */
  title: string
  /**
   * The heading level the surrounding page needs. There is no way for this
   * component to know it, because an empty state replacing a page's main
   * content wants a different level from one inside a card. So `2` is a
   * starting point and not an answer. Check it against the outline of the
   * screen it lands on.
   *
   * @default 2
   */
  titleLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * Why it is empty, in one or two sentences. Say what is not here, then why,
   * then what to do; for `not-enough`, state the rule and the gap. It renders a
   * paragraph, so it takes text or inline content rather than a block element.
   *
   * Omitting it does not produce a tidier empty state. It produces a visible
   * line saying there is nothing here and the app does not say why, because the
   * alternative is a default sentence about an absence of health data, which is
   * a sentence nobody reviewed. `false` from a `&&` branch, an empty array and a
   * whitespace-only string all count as omitting it.
   *
   * A body that is only a number is refused outright and replaced with the
   * same line, because `{items.length && "…"}` at a length of zero renders the
   * digit `0`. An absence rendered as a number reads as a measurement of
   * nothing.
   */
  children?: ReactNode
  /**
   * Exactly one primary action, or none. Never a row of three.
   *
   * `href` navigates and renders an anchor; `onSelect` acts and renders a
   * Button. Supply one of the two. A control that produces a new URL is a link
   * however it is styled, and rebuilding it as a button loses the new tab, the
   * copied address and the screen reader's list of links.
   *
   * Optional for the four empties, mandatory for `could-not-load`. An error
   * that offers no way back is the one thing this state exists to prevent, so
   * when the reason is `could-not-load` and no usable control renders, the
   * surface shows a visible refusal in its place and warns in development.
   */
  action?: { label: string; href?: string; onSelect?: () => void }
  /**
   * A quieter alternative, for the reader who cannot take the primary one. Same
   * shape and same rule; it is not a second primary action, and it does not
   * belong here on its own.
   */
  secondary?: { label: string; href?: string; onSelect?: () => void }
  /**
   * Decorative only, and never the carrier of the message. It is hidden from
   * assistive technology and made `inert`, dropped in print, and dropped again
   * when the surface is narrow. If a picture is carrying meaning, the meaning
   * is missing from the words.
   *
   * `inert` is why nothing focusable belongs here: a control inside a decorative
   * wrapper would be hidden from the accessibility tree and unreachable by
   * keyboard, which is a worse outcome than not passing it.
   */
  illustration?: ReactNode
  /**
   * Merged onto the root. Width, position and place in a grid belong here: they
   * are decisions of the screen this is standing in for, not of this component.
   */
  className?: string
}

/**
 * One action, as this file passes it around internally.
 *
 * Derived from the props interface rather than declared beside it, so the shape
 * cannot drift from the one a caller reads in the table. The interface also
 * keeps the inline object type the specification writes, which is what makes
 * `<PropsTable>` print the three fields instead of an opaque type name.
 */
type EmptyStateAction = NonNullable<EmptyStateProps["action"]>

/* THE NAVIGATING ACTION NOW RENDERS THROUGH THE SHARED Link. Before Link was a
   built component, this file spelled its own anchor here: a TARGET_FLOOR, an
   ACTION_LINK and a SECONDARY_LINK class string. ACTION_LINK was the byte-
   identical copy shared across alert-banner.tsx, result-card.tsx and this file,
   which is the duplication the roster finding named. The quiet constant was a
   different story: it shared only its name with AlertBanner's SECONDARY_LINK and
   differed from it by a boundary and its padding, AlertBanner's carrying border
   border-border and px-opsin-4 against this file's borderless px-opsin-2. That
   divergence under one name was finding cross-component-consistency-14, and
   result-card.tsx never had a SECONDARY_LINK at all. Link closes both, because
   it is the one place those treatments are decided, so a banner's action and an
   empty state's action are the same control on the same screen. The target
   floor, the boundary, the type step and the focus ring that used to live in
   these constants are the card action recipe's now, carried by Link's `action`
   and `secondary` emphases on a neutral ground.

   The floor is a minimum on both axes, not height alone. SC 2.5.8 is a 44 by 44
   region rather than a 44-tall strip, and the product stylesheet floors only
   `button`, `[role=button]` and `a[data-opsin-target]`, so a quiet action whose
   padding is a third of the recommended one's can fall under the floor on the
   inline axis without the min-width. That reason should live beside the shared
   CARD_ACTION_FLOOR fragment in button.tsx, where every adopter draws from it;
   the crossUnitNotes on 14.b ask comp:button to carry it there. */

/**
 * Turn one action into a control, or into nothing.
 *
 * Returning `null` rather than rendering something is the point. A control with
 * no name is unreachable by voice and announced as "button"; a control with
 * neither a destination nor a handler is a promise the surface cannot keep, and
 * an empty state whose one next step does nothing is worse than an empty state
 * with no step at all.
 *
 * None of these is an OPSIN code. `tokens/errors.json` allocates codes for
 * mistakes a consumer makes with the clinical API, and a component may not mint
 * one. The codes are a versioned contract and the table on the errors page is
 * generated from that file. A development warning through `warnDev` is the
 * honest channel, and `owner` is what gives it per-empty-state granularity.
 */
function actionControl(
  action: EmptyStateAction,
  emphasis: "primary" | "quiet",
  owner: string,
): ReactNode {
  const label = action.label?.trim() ? action.label : ""
  const navigates = typeof action.href === "string" && action.href.trim() !== ""
  const acts = typeof action.onSelect === "function"

  if (label === "") {
    warnDev(
      `action-no-label:${emphasis}:${owner}`,
      `[opsinjs] <EmptyState> titled "${owner}" was given an action with no ` +
        "label. The visible label is the accessible name, and an empty " +
        "state's one next step is the whole reason the surface is worth " +
        "showing. Nothing was rendered for it.",
    )
  }
  if (label !== "" && !navigates && !acts) {
    warnDev(
      `action-inert:${label}`,
      `[opsinjs] <EmptyState> was given the action "${label}" with neither ` +
        "`href` nor `onSelect`, so there is nothing for it to do. Give it a " +
        "destination or a handler; a control that acknowledges a press and " +
        "then does nothing reads as a broken screen. Nothing was rendered for " +
        "it.",
    )
  }
  if (navigates && acts) {
    warnDev(
      `action-both:${label}`,
      `[opsinjs] <EmptyState> was given the action "${label}" with both ` +
        "`href` and `onSelect`. It renders as a link, because a destination " +
        "survives a new tab, a copied address and a screen reader's list of " +
        "links and a handler does not. Move the work to the page the link " +
        "goes to, or drop the `href`.",
    )
  }

  if (label === "") return null

  if (navigates && action.href) {
    return (
      <Link
        href={action.href}
        emphasis={emphasis === "primary" ? "action" : "secondary"}
      >
        {label}
      </Link>
    )
  }

  if (!acts) return null

  /* NO BRAND FILL ON THE ACTING FORM. `Button variant="primary"` is `bg-primary`
     on `text-primary-foreground`, and the navigating form above is `<Link
     emphasis="action">`, a neutral outlined underlined link on `bg-card`.
     Reaching for the brand fill here made the same recommended action carry a
     solid blue button on `onSelect` and a quiet link on `href`, so the reader met
     two different amounts of emphasis for one step depending on a prop they cannot
     see. `secondary` is `bg-card` with `text-foreground`, which is the pair the
     card action recipe behind `emphasis="action"` spells, so the two transports of
     `action` read alike. The size follows for the same motive: the recipe's quiet
     arm takes the smaller subheadline step, so the quiet form rendered as a Button
     takes `sm` and its two transports stop reading as different weights too.
     AlertBanner makes the identical mapping. */
  return (
    <Button
      variant={emphasis === "primary" ? "secondary" : "quiet"}
      size={emphasis === "primary" ? "md" : "sm"}
      className={cn(
        cardActionClassName({
          weight: emphasis === "primary" ? "recommended" : "quiet",
          ground: "neutral",
          as: "button",
        }),
        /* STOPGAP for a recipe/TONE disagreement, not the real fix. The quiet
           neutral link arm asserts [color:var(--foreground)] (button.tsx:808),
           but Button's quiet TONE asserts [color:var(--primary)]
           (button.tsx:256) and the quiet button delta ("underline
           underline-offset-4") names no ink, so without this the onSelect
           transport of a quiet action renders brand ink while the href
           transport renders foreground ink. That is the transport-dependent
           appearance D3 forbids. Re-asserting the foreground ink here restores
           transport-invariance because cn() puts the caller's classes last, so
           it wins the color conflict group over TONE. The recommended branch
           needs nothing: Button variant="secondary" already carries
           [color:var(--foreground)] in its TONE. The durable fix reconciles
           cardActionClassName's quiet neutral arm and Button's quiet TONE on
           one ink inside button.tsx, so all four action-bearing cards get it at
           once; see the crossUnitNotes for comp:button on 09.e. */
        emphasis === "primary" ? null : "[color:var(--foreground)]",
      )}
      onClick={action.onSelect}
    >
      {label}
    </Button>
  )
}

export function EmptyState({
  reason,
  title,
  titleLevel = 2,
  children,
  action,
  secondary,
  illustration,
  className,
}: EmptyStateProps) {
  /* THE ONE PLACE THIS COMPONENT REFUSES TO BE HELPFUL.
     A missing body is the common case and the dangerous one: the title alone
     says what is absent and never why, and the reader fills the gap with
     whichever assumption is nearest to hand. That assumption is usually that
     the absence is reassuring. `not-enough` is called out separately because
     its body is not an explanation, it is the statement of the rule and the
     gap, and a view that declined to draw something has to say what it is
     waiting for. */
  const body = bodyText(children)
  const numericBody = bodyIsBareNumber(body)
  const bodyMissing = body === null || numericBody

  /* The one reason that is not an absence. An error renders a visible marker
     and owes a retry, so the component branches on it in three places below:
     the flag above the heading, the mandatory-action warning, and the refusal
     that stands in when no retry was given. */
  const isError = reason === "could-not-load"

  const heading = typeof title === "string" ? title.trim() : ""
  const titleMissing = heading === ""

  /* The title is required and the type says so, and this file still ships as
     source into JavaScript projects where a type is advice. `title=""`
     type-checks even here. An empty heading is a heading with no name: axe
     reports it, a screen-reader user hears "heading level 3" and nothing, and
     the empty state loses the handle the whole page argues it can be navigated
     by. The action label two functions up is already checked this way; the
     heading has more riding on it and was not. */
  if (titleMissing) {
    warnDev(
      `title-missing:${reason}`,
      `[opsinjs] <EmptyState reason="${reason}"> was rendered with no title, ` +
        "so it says on screen that the screen has no heading. `title` is what is not " +
        "here, in one short line, and it is the heading the empty state is " +
        "navigated by. An empty one is announced as a heading with no name. " +
        "Write it.",
    )
  }

  if (numericBody) {
    warnDev(
      `body-number:${reason}`,
      `[opsinjs] <EmptyState reason="${reason}"> was given the number ` +
        `${String(body)} as its body, which is how \`{items.length && "…"}\` reads ` +
        "when the length is zero. It was refused rather than printed: zero, " +
        "none and unknown are three different things, and an absence rendered " +
        "as a digit reads as a measurement of nothing. Write the sentence the " +
        "conditional was guarding.",
    )
  } else if (bodyMissing) {
    warnDev(
      `body-missing:${reason}`,
      `[opsinjs] <EmptyState reason="${reason}"> was rendered with no body, so ` +
        "it says on screen that there is nothing here and the app does not say why. That string is " +
        "there because the alternative is a default sentence about missing " +
        "health data, and this system does not own one. Note that `false` " +
        "from a `&&` branch, an empty array and a whitespace-only string all " +
        "count as no body. Write one or two sentences: what is not here, why, " +
        "and what to do about it." +
        (reason === "not-enough"
          ? " For `not-enough` the body is the safety statement. State the " +
            "rule this view is waiting for and how far off it is."
          : ""),
    )
  }

  /* A quieter alternative with nothing to be an alternative to is a primary
     action wearing quiet clothes, and it is how a surface ends up with its one
     next step in the least prominent place on it. */
  if (secondary !== undefined && action === undefined) {
    warnDev(
      `secondary-alone:${heading || reason}`,
      "[opsinjs] <EmptyState> has a `secondary` action and no `action`. " +
        "`secondary` is the quieter route for a reader who cannot take the " +
        "primary one; on its own it renders the surface's only next step in " +
        "its least prominent treatment. Promote it to `action`.",
    )
  }

  const owner = heading || `reason="${reason}"`

  const primary = action ? actionControl(action, "primary", owner) : null
  const alternative = secondary ? actionControl(secondary, "quiet", owner) : null

  /* The retry or route is the whole obligation the error state exists to meet.
     This keys on whether a control actually rendered rather than on whether
     `action` was passed: a label-less action and one with neither `href` nor
     `onSelect` both come back from actionControl as null, and each leaves a
     silent error with no way back just as surely as a missing prop does. When
     no control rendered this warns and a visible refusal takes its place below,
     the same shape the missing-title and missing-body admissions use, because a
     silent error that offers no way back is exactly the failure the state is
     for. */
  if (isError && primary === null) {
    warnDev(
      `error-no-retry:${owner}`,
      `[opsinjs] <EmptyState reason="could-not-load"> was rendered with no ` +
        "usable `action`, so it tells the reader the load did not complete and " +
        "then offers no way back. An error state must carry a retry or a route " +
        "onwards; that is the whole obligation the state exists to meet. A " +
        "visible line saying no retry was offered took its place. Pass `action` " +
        "with a handler that loads it again or a destination that routes around it.",
    )
  }

  /* The level is the page's and the appearance is this component's. A heading
     that hard-coded its level produces an outline which jumps from h1 to h3 on
     one screen and a wall of h2s on another; `titleLevel` keeps the two
     separable. The explicit type step and the zeroed margin below are what
     stop the level carrying visual weight it is not entitled to. Left to the
     browser, the same title would be a different size in an h2 and an h4.

     AND THE LEVEL IS CHECKED, not merely typed, for the reason every other prop
     here is checked: a type is advice in the JavaScript project this file ships
     into, and a level is exactly the prop a caller computes rather than types.
     Examples are `titleLevel={section.depth + 1}` and a number off a CMS row.
     `titleLevel={7}` builds `<h7>`, an unknown element with no heading role at
     all, so the one line saying what is not here drops out of the document
     outline and out of a screen reader's heading list, which is the whole point
     of rendering it as a heading. `titleLevel={1}` puts a second `h1` on the
     page. Both fall back to the documented default rather than being rendered.
     `care-card.tsx` guards its own `headingLevel` the same way and falls back
     to its own default of 3; the shape travels, the number does not. */
  const LEVELS = [2, 3, 4, 5, 6]
  let level = titleLevel
  if (!LEVELS.includes(level)) {
    warnDev(
      `title-level:${String(titleLevel)}`,
      `[opsinjs] <EmptyState> was given titleLevel ${String(titleLevel)}. The ` +
        "title is a real heading and the level has to be one a document outline " +
        "has: 2 to 6. An h1 makes an empty state compete with the page's own " +
        "name and anything outside the range is not a heading element at all. " +
        "It was rendered at the default, 2.",
    )
    level = 2
  }
  const Heading = `h${String(level)}` as "h2" | "h3" | "h4" | "h5" | "h6"

  return (
    <div
      data-slot="empty-state"
      className={cn(
        /* `@container` is what makes the illustration rule below work, and it
           is worth the class on its own: the empty state is judged against the
           space it was given rather than against the viewport, so the same
           component drops its picture inside a narrow card and keeps it on a
           full page. */
        /* The outer inset is on Tailwind's density-scaled scale, `px-4 py-8`
           rather than the fixed `px-opsin-*` tokens, so this box tightens with
           the rest of the card family when a reader chooses compact. At the
           default density `--spacing` is 0.25rem, so these render 16px by 32px,
           the same values the fixed tokens gave; under compact they scale down
           with Card, ResultCard, Callout and AlertBanner. */
        "@container flex w-full flex-col items-center gap-opsin-4 px-4 py-8 text-center",
        className,
      )}
    >
      {illustration ? (
        <div
          data-slot="empty-state-illustration"
          /* Decorative, and kept out four ways. `aria-hidden` because a picture
             that carried meaning would mean the words were incomplete;
             `print:hidden` because a printed summary needs the title and the
             body and nothing else; and `@max-[17rem]:hidden` because when space
             runs short the picture goes before any word does.

             The last one is a CONTAINER query rather than a media query, and
             that is the whole reason it is worth the `@container` on the root:
             it measures the space this component was actually handed, so the
             picture leaves inside a narrow card on a wide screen, which is
             where it is most often in the way. A container of type
             `inline-size` reports its CONTENT box, so the width the query reads
             is this box after its own `px-4` has been taken off, not the surface
             the card handed it. That 32px is the whole reason a theme step
             failed here. At the `@max-sm` 24rem step the picture never reached a
             phone. At `@max-xs`, 20rem or 320px, it still did not: a 390px phone
             hands this padded box a 308px content width, which is already below
             320px, so the true crossover was a 402px viewport and the picture
             stayed hidden on every phone the system is built for.

             So the drop point is set against the content box the query actually
             reads. A 390px phone leaves 308px inside this box and a 360px phone
             278px, while a 300px embedded card leaves 266px. `@max-[17rem]`,
             272px at the default root size, sits between a narrow card and any
             phone, so the picture survives on a phone and still leaves once the
             surface is genuinely cramped, which is the behaviour it was written
             for. It is a bespoke value chosen to clear the 32px of padding
             rather than a theme step, because no theme step falls inside the
             narrow band between a phone and a narrow card. It is written in
             `rem` so that it can follow a reader who has raised their root font
             size; how far it follows in each engine has not been measured here,
             and the page lists that rather than claiming it.

             `inert` is the fourth, and it is the one the type system cannot
             ask for. `illustration` is a `ReactNode` documented as decorative,
             and documentation does not stop a caller passing a lottie player
             with controls or an `<a>` inside an SVG. Aria-hidden alone would
             then leave a control in the tab order and out of the accessibility
             tree, which is the classic SC 4.1.2 failure. On a genuinely
             decorative node `inert` costs nothing. */
          aria-hidden="true"
          inert
          className="@max-[17rem]:hidden print:hidden"
        >
          {illustration}
        </div>
      ) : null}

      {isError ? (
        <p
          data-slot="empty-state-error-flag"
          /* The non-colour cue. An error has to be told apart from an absence
             by a reader in greyscale and a reader with low vision, so the state
             is carried by a word and an icon rather than by a tint. The border
             is the neutral `--border` and the ink is `--foreground`; this takes
             no status colour and no category colour, because a failed fetch is
             neither a clinical level nor a kind of measurement. The glyph is
             `aria-hidden` because the word beside it already says the same
             thing, and it is sized in `em` so it follows the reader's text. */
          className="m-0 inline-flex items-center gap-opsin-2 rounded-opsin-md border border-border px-opsin-3 py-opsin-1 text-opsin-subheadline text-foreground"
        >
          <TriangleAlert aria-hidden="true" className="size-[1em]" />
          Could not load
        </p>
      ) : null}

      <Heading
        data-slot="empty-state-title"
        /* `text-balance` rather than a width: a two-line title that breaks
           after one word looks like a defect, and the alternative is guessing a
           character count that is wrong at every text size but one. */
        className="m-0 text-opsin-headline text-balance"
      >
        {/* The same refusal the body makes, for the same reason. A blank title
            is a caller bug, and the two ways out of it are an empty heading or
            a visible admission. The empty heading is silent. It passes review,
            it passes every gate here, and it reaches a screen-reader user as a
            heading with no name. This line is a plain admission the reader can
            read: an author who sees it fixes it, and it keeps the outline entry
            the empty state is navigated by. */}
        {titleMissing ? "This screen has no heading." : heading}
      </Heading>

      <p
        data-slot="empty-state-body"
        /* Full-strength foreground rather than a muted role. For `not-enough`
           this paragraph is the safety statement, and a safety statement set in
           the colour the system uses for supporting detail is a safety
           statement that reads as supporting detail.

           The measure is capped because the body is centred: centred text past
           about 45 characters loses the reader's return sweep, and an empty
           state is read once, quickly, by somebody who is already unsure what
           they are looking at. */
        className="m-0 max-w-(--opsin-measure-tight,45ch) text-opsin-body text-foreground"
      >
        {bodyMissing
          ? "There is nothing here yet, and this app does not say why."
          : children}
      </p>

      {primary ? <div data-slot="empty-state-action">{primary}</div> : null}
      {isError && primary === null ? (
        <p
          data-slot="empty-state-error-no-retry"
          /* The retry was mandatory and it was not supplied. Rather than fake a
             control with nothing behind it, the surface admits in words that no
             way back was offered, the same admission the missing title and the
             missing body make. It renders no digit, as nothing in this state
             ever does. An author who sees it wires up the retry. */
          className="m-0 max-w-(--opsin-measure-tight,45ch) text-opsin-body text-foreground"
        >
          This app has not offered a way to try again.
        </p>
      ) : null}
      {alternative ? (
        <div data-slot="empty-state-secondary">{alternative}</div>
      ) : null}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows three reasons. Two are the
 * hardest to keep apart: `nothing-yet`, where the reader can fix the emptiness,
 * and `not-enough`, where the product has declined to draw something and owes
 * an explanation of what it is waiting for. The third is `could-not-load`, the
 * error state, which must never be mistaken for either: the fetch failed, the
 * readings are not gone, and the surface says so and offers a way to try again.
 *
 * The measurement is fictional, and there is no count of days, no count of
 * readings and no number of any kind in the copy (ADR 0012). A minimum window
 * is a per-metric rule the consuming product declares and opsinjs ships none;
 * a threshold in a demo is a threshold somebody copies.
 *
 * The two columns are a CONTAINER query and not the `sm:` breakpoint. Everything
 * inside them is in rem or ch and follows the reader's text size, but rem inside
 * a media query resolves against the initial font size rather than the root's,
 * so a `sm:` split would stay pinned at one viewport width while every glyph in
 * it doubled. The shipped layout should respond the way the component does.
 *
 * A container query measures the nearest ancestor container and never the
 * element that declares one, so the `@container` and the grid it governs are
 * two elements here rather than one. Put both classes on a single element and
 * the split silently never fires, because `@2xl:grid-cols-2` then has no
 * ancestor container to measure and falls back to a single column at every
 * width.
 */
export default function EmptyStateDemo() {
  return (
    <div className="@container w-full">
      <div className="grid w-full max-w-3xl gap-opsin-6 @2xl:grid-cols-2">
        <EmptyState
          reason="nothing-yet"
          title="No readings yet"
          titleLevel={3}
          action={{ label: "Add a reading", href: "#example-destination" }}
        >
          Once you add your first example measurement it will be here, with
          whatever range this product compares it against.
        </EmptyState>

        <EmptyState
          reason="not-enough"
          title="Not enough readings for a trend yet"
          titleLevel={3}
        >
          A trend needs more readings than there are so far, and this product
          sets how many. Nothing is drawn until then, because a line through too
          few points suggests a direction the readings do not support.
        </EmptyState>

        <EmptyState
          reason="could-not-load"
          title="We could not load your readings"
          titleLevel={3}
          action={{ label: "Try again", href: "#example-destination" }}
        >
          We could not reach the place these readings are stored. Your readings
          are safe and nothing has been lost. Try again.
        </EmptyState>
      </div>
    </div>
  )
}
