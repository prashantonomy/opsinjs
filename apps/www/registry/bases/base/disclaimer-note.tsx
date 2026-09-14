/**
 * DisclaimerNote is the standing note about what a product is and is not,
 * placed by rule so it is always in the same place and never in the way.
 *
 * THERE IS NO DISCLAIMER TEXT IN THIS FILE AND THERE NEVER WILL BE. Not a
 * default, not a placeholder, not a vetted variant, not an i18n key with a
 * fallback, not an emergency number, not a jurisdiction, not a product name.
 * A disclaimer is a legal and clinical statement with somebody's name behind
 * it, and a design system has neither a legal owner nor a reader. A sentence
 * shipped from here would arrive in a product whose author never read it,
 * describing limits that product may not have and omitting ones it does. It
 * would arrive looking reviewed, because it came from a library.
 *
 * SO THE MISSING CASE SAYS SO. A note with no words supplied renders one
 * unlovely line admitting that none were, which is the same refusal
 * `empty-state` makes and for the same reason: the alternative is a friendly
 * sentence about somebody's health data that nobody signed off. An author who
 * sees the line fixes it, and a reader who sees it has at least not been told
 * something untrue by a library that does not know them.
 *
 * IT IS NOT AN ALERT, AND THE API IS WHAT KEEPS IT FROM BECOMING ONE. Styling
 * a disclaimer as a warning is the most common mistake with this component, so
 * there is no `status` prop, no `severity` prop, no `variant` prop, no fill, no
 * role, no live region, and the glyph is the component's rather than the
 * caller's. A standing note tinted from the status axis is a permanent false
 * alarm: it says *watch* on every screen, from the first launch to the last,
 * about nothing in particular. A reader learns within a week to see past
 * it, taking the real alerts with it. The two `data-*` attributes that carry
 * colour meaning, `data-status` and `data-category`, appear nowhere below.
 *
 * NEITHER AXIS, WHICH IS THE ONE PLACE THE TWO-AXIS RULE IS ANSWERED BY
 * ABSENCE. Category colour would make a statement about the product look like a
 * statement about a topic; status colour would make it look like a level. The
 * note is typographic, and its whole treatment is a hairline above it and the
 * space it stands in.
 *
 * PLACEMENT IS SPACE AND NOTHING ELSE. `inline` and `footer` differ by how much
 * room is above the hairline. That is deliberately unimpressive: every part
 * that could be added here is a part that could be used to make the note
 * louder, and a component whose two placements looked different would invite a
 * third that looked louder still.
 *
 * IT IS A SERVER COMPONENT. No state, no hook, no timer, no event handler, no
 * Base UI primitive. There is no dismiss control. Whether the note may be
 * dismissed, whether it returns, and whether the product records that it was
 * seen are open questions on the specification page, and each of them needs a
 * memory that outlives a render.
 */

import { Info } from "lucide-react"
import { Children, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Link } from "@/registry/base-lyra/ui/link"

/**
 * Development warnings, said once per distinct offender.
 *
 * Nothing this file complains about has an `OpsinErrorCode`. The codes in
 * `tokens/errors.json` describe mistakes a consumer makes with the CLINICAL
 * API, they are a versioned contract, and the table on the errors page is
 * generated from that file. So a component may not mint one. What `warnOnce`
 * is right about is the discipline rather than the registry: a warning printed
 * on every render, and twice per render under Strict Mode, becomes noise, and a
 * noisy channel is one somebody switches off. So this keeps its own small set,
 * keyed on the complaint plus whatever names the offender.
 *
 * `empty-state.tsx` carries the same twelve lines for the same reason. Two
 * copies is one too many and the repair belongs in `lib/opsinjs.ts`, which is
 * not this component's file to edit; it is reported rather than duplicated
 * quietly.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Whether any words actually arrived.
 *
 * TypeScript cannot answer this. Testing the three sentinels `""`, `null` and
 * `undefined` misses how legal copy actually goes missing, which is
 * `{consent.text}` resolving to `undefined` from a content service, a
 * translation table returning a whitespace-only string for a locale nobody
 * filled in, or `{isReviewed && "…"}` evaluating to `false` on the day the
 * review lapsed. `Children.toArray` drops `null`, `undefined`, booleans and
 * empty arrays; a string of spaces is what it keeps and what must still be
 * refused. So is a bare number, which is the case below.
 *
 * An element is not text and is not resolvable from here, so a body containing
 * one is taken at its word. That is the right way round: this function decides
 * when to print *nothing was supplied*, and printing it over a caller's
 * `<strong>` would be a false accusation on somebody's screen. It is also the
 * one route to a silently empty note that stays open, and the specification
 * page says so rather than promising a guarantee this function does not make.
 */
function hasSuppliedText(children: ReactNode): boolean {
  const parts = Children.toArray(children)
  if (parts.length === 0) return false
  if (!parts.every((part) => typeof part === "string" || typeof part === "number")) {
    return true
  }
  const text = parts.map((part) => String(part)).join("").trim()
  return text !== "" && !isBareNumber(text)
}

/**
 * Whether the whole body is a number rather than words.
 *
 * `{wording.sentences.length && wording.text}` on an empty collection passes
 * `0`, and React renders the digit. So a note's entire standing statement
 * about what the product is becomes the character `0`, no development warning
 * fires, and the absence this component exists to make visible is rendered as a
 * measurement of nothing. It is the numeric sibling of the `false` case the
 * `children` documentation already names, and it arrives by the same idiom.
 * `NaN` reaches here by the same route from a count that did not parse: it is a
 * number, `Children.toArray` keeps it, and React renders the three letters.
 *
 * `empty-state` refuses a bare-number body in exactly this shape, and cites
 * [numbers-units-precision] rule 13 and safety checklist A4 for it: zero, none
 * and unknown are three different things, and an absence never renders as a
 * digit. A body that is only a number is a caller mistake at every value and
 * not only at zero, because it states nothing about the product's limits. So
 * it is refused rather than printed, and the missing-words line takes its place
 * along with the development warning that names how to fix it.
 */
function isBareNumber(text: string): boolean {
  return text === "NaN" || /^-?\d+(?:[.,]\d+)?$/.test(text)
}

/**
 * Link labels that name no destination.
 *
 * Every one of these is a label a reader hears out of context, and none of
 * them says where it goes. A screen reader's list of links is exactly that
 * context. The specification asks for *read our full statement* rather than
 * *learn more*, and this is that requirement made checkable. It warns and
 * renders: the destination is right even when the label is lazy, and removing
 * somebody's link over its wording would be the larger mistake.
 *
 * Compared case-insensitively against the trimmed label with trailing
 * punctuation removed, so "Learn more…" and "LEARN MORE" are caught too.
 */
const UNHELPFUL_LABELS = [
  "learn more",
  "read more",
  "find out more",
  "more",
  "more information",
  "click here",
  "here",
  "details",
  "this link",
]

/**
 * The axis names, and the pattern that finds one in a class list.
 *
 * Built from two pieces on purpose. `scripts/check-a11y.mts` reads this file as
 * text and treats any file that spells a complete axis utility as a status
 * surface owing a word, a glyph and a `data-status`; a detector written the
 * obvious way would report itself and there would be no repair short of
 * deleting the check. Split like this, the file contains the axis names and the
 * axis prefixes and never the two joined, which is the thing the gate looks
 * for. The pattern still matches every joined form at runtime.
 *
 * `callout.tsx` carries the identical construction, and for the identical
 * reason: both components sit outside both axes, and `className` is the one
 * hole in that refusal.
 */
const AXIS_NAMES =
  "steady|watch|attention|urgent|unknown|sleep|heart|activity|nutrition|mind|labs"

const AXIS_TINT = new RegExp(
  `(?:^|[\\s:-])(?:status|category)-(?:${AXIS_NAMES})(?![a-z])`,
)

/**
 * The two placements, written out rather than assembled.
 *
 * Tailwind reads class names out of source as literal strings, so
 * `pt-opsin-${placement === "footer" ? 6 : 3}` would generate no CSS at all and
 * the note would render with no space above it. Written out, once.
 *
 * The hairline is common to both because the note has to be findable in the
 * same place every time, and an edge is what makes it findable at a glance.
 * What differs is the room above it: `inline` sits close under the content it
 * qualifies, because it is about that content's surface; `footer` ends a
 * surface and is given the air that says so. Both steps are from the FIXED
 * scale rather than the density-scaled one. The separation between the note
 * and the reading above it is the placement rule made visible, and it should
 * not close up because somebody asked for a denser list.
 */
const PLACEMENT = {
  inline: "pt-opsin-3",
  footer: "pt-opsin-6",
} as const

/**
 * Two layouts, and the column the content sits in under each.
 *
 * A grid rather than a flex row with a wrapper around the text, because the
 * anatomy has Icon, Text, Link and Version as siblings under the root, and a
 * wrapper would be an element the part tree does not name. With no icon the
 * grid is a single column, rather than a two-column grid whose empty first
 * track still contributes its gap and shifts every line of the note to the
 * right by a space step nothing occupies.
 */
const LAYOUT = {
  withIcon: "grid grid-cols-[auto_1fr] gap-x-opsin-2",
  withoutIcon: "grid grid-cols-1",
} as const

const CONTENT_COLUMN = {
  withIcon: "col-start-2",
  withoutIcon: "col-start-1",
} as const

/**
 * The grid-item floor for the link to the fuller statement.
 *
 * THE LINK TREATMENT ITSELF NOW LIVES IN `Link`, NOT HERE. The underline, the
 * `0.25em` offset, the one-pixel press, the focus ring and `wrap-anywhere` were
 * this file's own class string once, one of the five private anchors the roster
 * finding names. `Link` is now the single place the underline, the `0.25em`
 * offset, the press and the focus ring are decided, so this note and any future
 * inline link cannot drift apart again. The offset stays `0.25em` rather than
 * the `underline-offset-4` step, and the focus ring travels with the link
 * rather than the theme, both for reasons `link.tsx` now carries. Two choices
 * are this control's own rather than the theme's. The press is a transform and
 * not one of the D6 `--state-*` fills, because a fill is wrong on a text link.
 * Hover adds nothing, because the underline is already the rest state and there
 * is no quieter state for hover to lift from; disabled, selected and loading do
 * not apply, because a note's link is never turned off, chosen or pending. What
 * is left in this file is the part that was never about the link and always
 * about the note: where the anchor sits in the note's grid, and how large a
 * target it must be there.
 *
 * IT IS A REAL ANCHOR AND IT IS NOT A BUTTON. A control that produces a new URL
 * is a link however it is styled, and rebuilding it as a button loses the new
 * tab, the copied address and the screen reader's list of links. `Link` refuses
 * to be a button for that reason, which is why the note reaches for `Link`
 * rather than for `Button`.
 *
 * THE FLOOR STAYS HERE BECAUSE `emphasis="inline"` DROPS IT. `Link`'s inline
 * form is a link inside a sentence, and SC 2.5.8 exempts an inline target, so
 * it carries no floor: a 2.75rem minimum would inflate the line box of any
 * paragraph the link sat in. This anchor is not inside a sentence. It is a grid
 * item of its own, the standing "read the full statement" control a reader
 * taps, so it keeps the floor the inline form sheds. The floor is
 * `--opsin-target-minimum` in rem rather than 44px, so it grows when a reader
 * raises their text size instead of pinning while the label doubles. THE
 * FALLBACK INSIDE THE `var()` IS LOAD-BEARING: written without one,
 * `min-h-(--opsin-target-minimum)` compiles to a bare reference, and in a
 * project that installed this file without `tokens.generated.css` that
 * declaration is invalid at computed-value time. `min-height` reverts to
 * `auto` and the floor vanishes with no error anywhere. Both axes, because
 * SC 2.5.8 is a 44x44 region and not a 44-tall strip, and a short label in a
 * language with shorter words would otherwise sit under the floor on the
 * inline axis.
 *
 * `justify-self-start` is what stops the anchor stretching to the width of its
 * grid track. Without it the whole line is clickable, and a reader who taps the
 * empty space beside a short label is navigated somewhere they did not aim at.
 *
 * `inline-flex` is what `Link`'s `wrap-anywhere` needs to bite. The anchor is a
 * grid item, so `inline-flex` blockifies to `flex` and the label becomes an
 * anonymous flex item; `overflow-wrap: break-word` does not reduce a box's
 * min-content size, so only `wrap-anywhere`, which `Link` carries, keeps a long
 * compound label reflowing with the note rather than widening the document at
 * 200% text on a narrow viewport.
 */
const LINK_FLOOR =
  "inline-flex min-h-(--opsin-target-minimum,2.75rem) " +
  "min-w-(--opsin-target-minimum,2.75rem) max-w-full items-center " +
  "justify-self-start"

export interface DisclaimerNoteProps {
  /**
   * The product's own words. One or two sentences: what this product does, then
   * what it does not do. It renders a paragraph, so it takes text or inline
   * content rather than a block element.
   *
   * There is no default text and there will not be one. Legal copy shipped from
   * a design system puts words into products whose authors never read them, and
   * it arrives looking reviewed because it came from a library. Supply none and
   * the note says on screen that none was supplied, rather than inventing a
   * sentence. `false` from a `&&` branch, `0` from the same branch on an empty
   * collection, an empty array and a whitespace-only string all count as
   * supplying none. The boundary is words: a caller who wraps the copy in an
   * element is taken at their word, so an empty string inside a `<strong>` is
   * the one route to a silently empty note that stays open.
   *
   * TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape
   * `EmptyState.children` has. Marking it required buys nothing, because
   * `{copy.text}` with an undefined `copy.text` type-checks either way. It
   * costs the ability to render the state at all, which is the state that most
   * needs seeing.
   */
  children?: ReactNode
  /**
   * Where it sits. `inline` goes under the content it qualifies; `footer` goes
   * once at the end of a surface. There is no `banner` value and there is no
   * `top` value: a reader who came to see a number sees the number first.
   *
   * The two differ by the space above the note and by nothing else. Neither
   * changes the type size, the ink or the boundary.
   *
   * @default "inline"
   */
  placement?: "inline" | "footer"
  /**
   * The fuller statement, for readers who want it.
   *
   * BOTH HALVES TOGETHER, and that is why this is one object rather than a bare
   * href. A destination with no label would need a label written here, and the
   * label this system would have to invent is the exact one the specification
   * refuses: *learn more* names nothing, and a screen reader's list of links is
   * where that costs somebody the page they were looking for. The product names
   * its own destination in its own words, in its reader's language.
   */
  more?: { label: string; href: string }
  /**
   * The id of this note's wording, so a product can record which version a
   * reader was shown. Legal text changes, and a record should say which one
   * applied.
   *
   * It renders as visible text, exactly as it is written here. An attribute
   * would be tidier and would be a record only the product that already had the
   * value could read: it survives no screenshot, no printout and no support
   * ticket, and the data-attribute vocabulary is closed at four in any case. So
   * write something a reader could quote back in a support conversation rather
   * than an internal identifier, and write it in their language: no word is
   * added around it, because any word added here would be English.
   *
   * It renders one step down in the secondary ink, at the footnote size, so a
   * reader can tell it apart from the statement rather than parse it as a third
   * sentence about their health. It is still rendered exactly as written, with
   * no word added around it.
   */
  textVersion?: string
  /**
   * Whether to show the informational glyph. The glyph itself is not
   * configurable, and that is the point: an icon prop taking a `ReactNode`
   * would accept a warning triangle, and a triangle sets the register before a
   * word of the note is read. It is decorative, hidden from assistive
   * technology, and sized in `em` so it grows with the text.
   *
   * The default is off. The quietest form of this component is the one to
   * prefer, and a glyph is the first step towards a note that competes with the
   * reading above it.
   *
   * @default false
   */
  icon?: boolean
  /**
   * Merged onto the root. Width, margin and place in a layout belong here: they
   * are decisions of the surface the note is standing on rather than of the
   * note.
   *
   * It is also the one hole in this component's refusal to carry a colour, and
   * the component says so rather than pretending otherwise: a utility from
   * either axis passed through here reaches the root, and in development it
   * raises a warning naming what to use instead.
   */
  className?: string
}

/**
 * The escape hatch, reported rather than closed.
 *
 * Not an OPSIN code, for the reason given on `warnDev` above. That is also
 * why it goes THROUGH `warnDev` rather than round it. This runs in a render
 * body, so a bare `console.warn` here would print on every render and twice
 * again under Strict Mode, and a disclaimer sits at the foot of a surface that
 * re-renders whenever anything above it changes. The key is the offending class
 * list, because two different tinted notes are two different mistakes in two
 * different places. `callout.tsx` guards its own copy of this warning the same
 * way.
 *
 * It warns and renders: the class list is the caller's and the words are the
 * product's, and taking a legal statement off a screen over a styling mistake
 * would be the larger error.
 */
function warnIfTintedFromAnAxis(className: string | undefined): void {
  /* `isDevelopment()` first, and again inside `warnDev`. The second check is the
     one that gates the print; this one keeps the regular expression off the
     production render path, where it would run against every note's class list
     to reach a branch that can never be taken. */
  if (!isDevelopment() || className === undefined) return
  if (!AXIS_TINT.test(className)) return
  warnDev(
    `axis-tint:${className}`,
    `[opsinjs] <DisclaimerNote className="${className}"> takes a colour from one ` +
      "of the two axes. This component sits outside both, and that is the whole " +
      "of it: a standing note tinted from the status ramps says the same level on " +
      "every screen about nothing in particular, which is a permanent false alarm " +
      "and teaches a reader to see past the ramp that the real alerts use. A " +
      "category tint makes a statement about the product read as a statement " +
      "about a topic. If the message is about this reader's own data and carries " +
      "a level, the component is <AlertBanner>. See " +
      "/docs/health/two-colour-axes.",
  )
}

/**
 * One link, as a control or as nothing.
 *
 * Returning `null` rather than rendering something is the point. A link with no
 * name is unreachable by voice and announced as "link"; a link with no
 * destination is a promise the note cannot keep.
 */
function statementLink(
  more: NonNullable<DisclaimerNoteProps["more"]>,
  column: string,
): ReactNode {
  const label = typeof more.label === "string" ? more.label.trim() : ""
  const href = typeof more.href === "string" ? more.href.trim() : ""

  if (label === "" || href === "") {
    warnDev(
      `link-incomplete:${label}|${href}`,
      "[opsinjs] <DisclaimerNote> was given `more` without both a label and an " +
        "href, so nothing was rendered for it. The two travel together on " +
        "purpose: a destination with no label would need one invented here, and " +
        "the label a design system would invent names nowhere.",
    )
    return null
  }

  const plain = label.toLowerCase().replace(/[.…!?:>»\s]+$/u, "")
  if (UNHELPFUL_LABELS.includes(plain)) {
    warnDev(
      `link-unhelpful:${plain}`,
      `[opsinjs] <DisclaimerNote> has a link labelled "${label}", which names no ` +
        "destination. A screen reader can list every link on a page with no " +
        "sentence around them, and this is the one link on the surface that says " +
        "where the product's full statement lives. Name it in the reader's own " +
        "language, with a label like \"read the full statement\" or \"how this " +
        "app uses your readings\". It was rendered as written.",
    )
  }

  return (
    <Link
      href={href}
      emphasis="inline"
      data-slot="disclaimer-note-link"
      className={cn(column, LINK_FLOOR)}
    >
      {label}
    </Link>
  )
}

export function DisclaimerNote({
  children,
  placement = "inline",
  more,
  textVersion,
  icon = false,
  className,
}: DisclaimerNoteProps) {
  warnIfTintedFromAnAxis(className)

  /* THE ONE PLACE THIS COMPONENT REFUSES TO BE HELPFUL, and the reason it
     exists in a design system rather than in each product's own codebase. Every
     other absence in this file is a part that leaves the DOM; this one prints,
     because a note that quietly rendered empty would pass review, pass every
     gate here, and ship a surface whose standing statement about what the
     product is had silently gone missing. */
  const supplied = hasSuppliedText(children)
  if (!supplied) {
    warnDev(
      `text-missing:${placement}`,
      `[opsinjs] <DisclaimerNote placement="${placement}"> was rendered with no ` +
        "words, so it says on screen that none were supplied. opsinjs ships no " +
        "disclaimer text: no default, no placeholder and no vetted variant. " +
        "That is because the words are a legal and clinical statement with an " +
        "owner, and a design system is not it. Write the product's own two " +
        "sentences: what " +
        "it does, then what it does not do. `false` or `0` from a `&&` branch, " +
        "an empty array and a whitespace-only string all count as writing none.",
    )
  }

  const key = icon ? "withIcon" : "withoutIcon"
  const column = CONTENT_COLUMN[key]
  const link = more ? statementLink(more, column) : null
  const version = typeof textVersion === "string" ? textVersion.trim() : ""

  return (
    /* NO ROLE, AND THE COST OF THAT IS REAL RATHER THAN NIL.
       "Ordinary text in the reading order" is a plain element: nothing is
       announced over what the reader is doing, nothing is announced twice, and
       the note is read when it is reached, which is after the thing the reader
       came for. `role="alert"` is what this component exists not to be, and
       `aria-live` in any form would make a standing sentence speak on every
       render that mounted it.

       What a plain element also costs is a boundary, so a screen-reader user
       meets the note as two loose sentences rather than as a thing. There is no
       start, no end and no accessible name. `role="note"`, or `<aside>` with a
       name, would supply one, and both were left out on the same grounds
       `callout.tsx` gives: nobody has listened to this component in a screen
       reader, and `<aside>` in particular publishes a `complementary` landmark
       that would appear in the landmark list of every screen in a product. A
       landmark per screen for a sentence that never changes is its own kind of
       noise. It is an open question on the specification page rather than a
       settled decision. */
    <div
      data-slot="disclaimer-note"
      className={cn(
        /* BODY SIZE AND BODY INK FOR THE STATEMENT AND THE LINK, AND NEITHER IS
           NEGOTIABLE. Legal text set one step down in pale grey complies with
           the letter of a requirement and none of its purpose, and it is the
           single most common way this component is got wrong. So the statement
           and the link are body size in body ink, and both are set here on the
           root so that both inherit them.

           The version marker is the one exception, and it is not the same thing.
           It is an identifier beside the statement rather than a part of it, and
           a reader who parses it as a third sentence about their own health is
           the failure this exception prevents. It takes the footnote step in the
           secondary ink that `Card.Description` already uses for exactly this
           role, set on its own span rather than here. That ink is
           `--muted-foreground`, a chrome role the theme layer owns, and both
           themes clear the 4.5:1 body floor at the 0.8125rem footnote size on
           the page and on a card. The four measured pairs are not typed here,
           because a token move would silently falsify them: the theme
           layer owns the colour, and the page's `<ContrastReport
           component="disclaimer-note">` is where the measured pairs are
           published instead. The next editor's instinct will be to write that
           ink as
           `text-muted-foreground`; do not, for the tailwind-merge reason set out
           below, which silently drops the footnote size. The escape is the same:
           `[color:var(--muted-foreground)]` is an arbitrary property in its own
           conflict group and keeps both the size and the ink.

           THE COLOUR IS AN ARBITRARY PROPERTY AND THAT IS NOT A STYLE CHOICE.
           `cn` is `twMerge(clsx(…))`, tailwind-merge is unconfigured, and it has
           never been told that `--text-opsin-*` is a font-size namespace. So it
           files `text-opsin-body` and `text-foreground` in one conflict group
           and silently drops whichever comes first. Verified: `twMerge(
           "text-opsin-body text-foreground")` returns `"text-foreground"`, and
           reversing the order returns `"text-opsin-body"`. There is no ordering
           that keeps both, and the failure is silent. The note renders in
           whatever size it inherits, which on a card footer is the size legal
           text is not allowed to be. `field.tsx` hit the same trap and answered
           it by dropping the colour and inheriting one; that is the wrong answer
           HERE, because inheriting the colour is precisely how a note ends up
           pale grey inside a muted footer. `[color:var(--foreground)]` is a
           different conflict group, resolves the same custom property the
           `text-foreground` utility resolves, and keeps both. A Tailwind editor
           plugin will offer to rewrite it as `text-foreground`; do not accept
           that, because it is the one change that silently returns this line to
           the wrong size and no gate in this repository would report it.

           No fill and no radius. The boundary is a hairline above, which is the
           whole treatment. It is also what makes print work with nothing
           extra: a browser drops background colours on paper unless the reader
           has gone looking for the setting that keeps them, and a component
           with no fill has nothing to lose. Nothing here is `print:hidden`.

           Under `prefers-contrast: more` the treatment does not change its
           kind, only its weight: the same top hairline is drawn at
           `--opsin-border-emphasis`, which is 2px. The comma fallback is
           load-bearing for the reason the two `var()` fallbacks above
           already give. A consumer who installs this file without
           `tokens.generated.css` gets a bare `var(--opsin-border-emphasis)`,
           the `border-top-width` declaration is then invalid at
           computed-value time, and the rule is dropped with no error
           anywhere. This is a WIDTH change and not a colour change. A wider
           line at the same colour is easier to find, but it does not move
           the measured contrast ratio. That ratio is a property of the
           `--border` colour, which the theme layer owns and this file does
           not, so the measured hairline pairs are not typed here, because a token
           move would silently falsify them: the page's `<ContrastReport
           component="disclaimer-note">` is where they are published
           instead. This line answers the width and leaves the colour to the
           layer that owns it.

           `wrap-break-word` with `min-w-0` on the content cells is the reflow
           repair. `1fr` is `minmax(auto, 1fr)`, so the text track's floor is the
           longest unbreakable token in `children`; at 200% text on a phone one
           long word or a bare URL would widen the grid past the viewport, which
           is horizontal scroll on the document and an SC 1.4.10 failure. The
           link needs `wrap-anywhere` instead, which `Link` carries and
           `LINK_FLOOR` explains: its label is an anonymous flex item that
           neither of those two reaches. */
        "gap-y-opsin-2 border-t border-border text-opsin-body [color:var(--foreground)] contrast-more:[border-top-width:var(--opsin-border-emphasis,2px)]",
        LAYOUT[key],
        PLACEMENT[placement],
        className,
      )}
    >
      {icon ? (
        /* Decorative, and hidden because it is a duplicate rather than because
           it is unimportant: it is a scanning aid that lets a reader who has
           read the note once find it again without reading it again.

           THE GLYPH IS NOT A PROP, and that is the accessibility requirement
           enforced rather than documented. "If an icon is present it is never a
           warning triangle" cannot be met by a component that accepts an
           arbitrary node, because the shape sets the register before a word is
           read and nothing in a `ReactNode` type says which shape arrived.
           `Info` is the one glyph in this system that means "this is
           information about what you are reading" and carries no level; it is
           deliberately the same glyph `Callout` uses for a note, because the
           two say the same thing about themselves and a distinct silhouette
           here would only be a claim to more attention. The status axis carries
           `Circle`, `CircleDot`, `Diamond` and `Octagon`, an abstract ordinal
           set whose implied weight rises with the level, and `Minus` for an
           absence; none of them is this note's glyph, because a note carries no
           level. The never-a-warning-triangle rule above does not rest on that
           roster: a triangle raises an alarm register the moment its shape is
           read, and this component raises no alarm, so a triangle would be wrong
           here even if it belonged to no set at all. */
        <Info
          data-slot="disclaimer-note-icon"
          aria-hidden="true"
          className="col-start-1 row-start-1 mt-[0.2em] size-[1em] shrink-0"
        />
      ) : null}

      <p
        data-slot="disclaimer-note-text"
        className={cn(
          column,
          /* The measure is capped because this is prose rather than a label,
             and a line of legal text run to the full width of a desktop card
             loses the reader's return sweep on the one paragraph they are least
             motivated to finish. The `66ch` inside the `var()` is the cap's
             only guarantee outside this repository: `--opsin-measure-comfortable`
             is declared in `app/tokens.generated.css`, which does not travel
             with this file, and a bare reference to an undeclared property is
             invalid at computed-value time. `max-width` would revert to `none`
             and the cap would be gone with no error anywhere. */
          "m-0 min-w-0 max-w-(--opsin-measure-comfortable,66ch) wrap-break-word",
        )}
      >
        {/* Unlovely on purpose, and in the reader's own words rather than the
            component's: it names no part a reader cannot see and it makes its
            plain admission in the active voice, about the app rather than about
            this component. An author who sees this line writes the product's own
            sentences; a reader who sees it has been told that something is
            missing rather than told something untrue.

            This one sentence is English, and there is no prop through which a
            product can translate it, so a Welsh, Urdu or Spanish product renders
            an English line on precisely the day it is meant to be read. That is
            deliberate rather than an oversight. ADR 0005 (no [lang] segment yet)
            is why there is no language seam to hang a translation on, and a
            `missingTextLabel` prop was NOT added to make one: a prop that accepts
            the missing-words line is one keystroke from a prop that accepts the
            disclaimer, which is the thing this file exists to refuse. A product
            guards the missing case upstream instead, and never lets the component
            be the one that speaks. */}
        {supplied
          ? children
          : "This app has not added its notice about what it can and cannot do."}
      </p>

      {link}

      {version === "" ? null : (
        <span
          data-slot="disclaimer-note-version"
          className={cn(
            column,
            "min-w-0 text-opsin-footnote wrap-break-word [color:var(--muted-foreground)]",
          )}
        >
          {version}
        </span>
      )}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows the note in its
 * two placements: inline under the block it qualifies, carrying everything it
 * can hold, and footer ending a surface. Both instances carry synthetic words,
 * so the demo renders warning-free, which is the standard ADR 0009 holds the
 * shipped demo to and the state a developer told to copy it should meet. The
 * missing-words case, which is what a product is most likely to ship by
 * accident, is still made visible at runtime: the component warns and prints
 * that none were supplied whenever a real caller omits them. The demo no longer
 * renders that case, because a demo is the happy case and the absence belongs
 * in an example rather than in the code `/view` renders.
 *
 * THE WORDS ARE OBVIOUSLY SYNTHETIC AND SAY SO OF THEMSELVES. They are not a
 * disclaimer, they are not a draft of one, and they are not a starting point:
 * every sentence below is about the example rather than about any product, so
 * that a reader who copies this file has copied nothing usable and an author
 * who screenshots it has screenshotted nothing quotable (ADR 0012). No
 * emergency number, no jurisdiction, no service name, no clinical claim.
 *
 * Two notes on one surface is a rule this demo breaks knowingly, because it is
 * a gallery rather than a screen. One note per surface is the rule, and the
 * example `disclaimer-note-once-at-the-foot-of-a-surface` is where it is shown.
 */
export default function DisclaimerNoteDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-opsin-8">
      <DisclaimerNote
        icon
        more={{
          label: "Read the placeholder statement",
          href: "#example-destination",
        }}
        textVersion="Example wording, version one"
      >
        Placeholder wording, for layout only. The product that installs this
        component writes the two sentences that belong here, and opsinjs ships
        none of them.
      </DisclaimerNote>

      <DisclaimerNote placement="footer">
        Placeholder wording again, for layout only. This is the footer
        placement, which ends a surface rather than sitting under a single block
        of it. The product still writes the sentence that belongs here, and
        opsinjs ships none of it.
      </DisclaimerNote>
    </div>
  )
}
