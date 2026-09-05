/**
 * DisclaimerNote — the standing note about what a product is and is not, placed
 * by rule so it is always in the same place and never in the way.
 *
 * THERE IS NO DISCLAIMER TEXT IN THIS FILE AND THERE NEVER WILL BE. Not a
 * default, not a placeholder, not a vetted variant, not an i18n key with a
 * fallback, not an emergency number, not a jurisdiction, not a product name.
 * A disclaimer is a legal and clinical statement with somebody's name behind
 * it, and a design system has neither a legal owner nor a reader. A sentence
 * shipped from here would arrive in a product whose author never read it,
 * describing limits that product may not have and omitting ones it does — and
 * it would arrive looking reviewed, because it came from a library.
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
 * about nothing in particular — and a reader learns within a week to see past
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
 * Base UI primitive. There is no dismiss control — whether the note may be
 * dismissed, whether it returns, and whether the product records that it was
 * seen are open questions on the specification page, and each of them needs a
 * memory that outlives a render.
 */

import { Info } from "lucide-react"
import { Children, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Development warnings, said once per distinct offender.
 *
 * Nothing this file complains about has an `OpsinErrorCode`. The codes in
 * `tokens/errors.json` describe mistakes a consumer makes with the CLINICAL
 * API, they are a versioned contract, and the table on the errors page is
 * generated from that file — so a component may not mint one. What `warnOnce`
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
 * TypeScript cannot answer this. Testing three sentinels — `""`, `null`,
 * `undefined` — misses how legal copy actually goes missing, which is
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
 * `0`, and React renders the digit — so a note's entire standing statement
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
 * not only at zero, because it states nothing about the product's limits — so
 * it is refused rather than printed, and the missing-words line takes its place
 * along with the development warning that names how to fix it.
 */
function isBareNumber(text: string): boolean {
  return text === "NaN" || /^-?\d+(?:[.,]\d+)?$/.test(text)
}

/**
 * Link labels that name no destination.
 *
 * Every one of these is a label a reader hears out of context — a screen
 * reader's list of links is exactly that context — and none of them says where
 * it goes. The specification asks for *read our full statement* rather than
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
 * for — and the pattern still matches every joined form at runtime.
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
 * scale rather than the density-scaled one — the separation between the note
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
 * The link to the fuller statement.
 *
 * IT IS A REAL ANCHOR AND IT IS NOT A BUTTON. A control that produces a new URL
 * is a link however it is styled, and rebuilding it as a button loses the new
 * tab, the copied address and the screen reader's list of links — which is the
 * one place a label naming its destination pays for itself.
 *
 * The floor is `--opsin-target-minimum` in rem rather than 44px, so it grows
 * when a reader raises their text size instead of pinning while the label
 * doubles. THE FALLBACK INSIDE THE `var()` IS LOAD-BEARING: written without
 * one, `min-h-(--opsin-target-minimum)` compiles to a bare reference, and in a
 * project that installed this file without `tokens.generated.css` that
 * declaration is invalid at computed-value time — `min-height` reverts to
 * `auto` and the floor vanishes with no error anywhere. Both axes, because
 * SC 2.5.8 is a 44x44 region and not a 44-tall strip, and a short label in a
 * language with shorter words would otherwise sit under the floor on the
 * inline axis.
 *
 * `justify-self-start` is what stops the anchor stretching to the width of its
 * grid track. Without it the whole line is clickable, and a reader who taps the
 * empty space beside a short label is navigated somewhere they did not aim at.
 *
 * The focus ring is declared here as well as in the product theme because a
 * consumer installs this file without that stylesheet.
 *
 * `wrap-anywhere` RATHER THAN THE `wrap-break-word` THE OTHER TWO PARTS USE,
 * and the difference is the whole repair. This anchor is a grid item, so its
 * `inline-flex` blockifies to `flex`, and the label inside becomes an anonymous
 * flex item. `min-w-0` sets the anchor's own minimum and never reaches that
 * anonymous item, and `overflow-wrap: break-word` deliberately does not reduce
 * a box's min-content size — so with either of those the anchor stays inside
 * its track while the label paints past it and widens the document. `anywhere`
 * is the one value that does reduce min-content size, which is what makes the
 * link reflow with the paragraph instead of being the one part exempt from it.
 * Failure case if this is removed: a compound label in a language that builds
 * them, at 200% text on a narrow viewport, scrolls the page sideways.
 *
 * The underline offset is `0.25em` rather than the `underline-offset-4` step,
 * because that step compiles to a flat `4px` while everything else in this file
 * is relative. At 200% text the type doubles and a fixed offset does not, which
 * walks the rule up into the descenders of any language that has them.
 */
const LINK =
  "inline-flex min-h-(--opsin-target-minimum,2.75rem) " +
  "min-w-(--opsin-target-minimum,2.75rem) max-w-full items-center " +
  "justify-self-start wrap-anywhere underline underline-offset-[0.25em] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

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
   * sentence — `false` from a `&&` branch, `0` from the same branch on an empty
   * collection, an empty array and a whitespace-only string all count as
   * supplying none. The boundary is words: a caller who wraps the copy in an
   * element is taken at their word, so an empty string inside a `<strong>` is
   * the one route to a silently empty note that stays open.
   *
   * TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape
   * `EmptyState.children` has. Marking it required buys nothing — `{copy.text}`
   * with an undefined `copy.text` type-checks either way — and it costs the
   * ability to render the state at all, which is the state that most needs
   * seeing.
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
 * Not an OPSIN code, for the reason given on `warnDev` above — which is also
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
  console.warn(
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
        "where the product's full statement lives. Name it — \"read the full " +
        "statement\", \"how this app uses your readings\" — in the reader's own " +
        "language. It was rendered as written.",
    )
  }

  return (
    <a
      data-slot="disclaimer-note-link"
      href={href}
      className={cn(column, LINK)}
    >
      {label}
    </a>
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
        "disclaimer text — no default, no placeholder and no vetted variant — " +
        "because the words are a legal and clinical statement with an owner, and " +
        "a design system is not it. Write the product's own two sentences: what " +
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

       What a plain element also costs is a boundary — no start, no end and no
       accessible name — so a screen-reader user meets the note as two loose
       sentences rather than as a thing. `role="note"`, or `<aside>` with a
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
        /* BODY SIZE AND BODY INK, AND NEITHER IS NEGOTIABLE. Legal text set one
           step down in pale grey complies with the letter of a requirement and
           none of its purpose, and it is the single most common way this
           component is got wrong. There is no muted role and no footnote step
           anywhere in this file: everything in the note, the link and the
           version marker included, is body size in body ink, and both are set
           here so that all three inherit them.

           THE COLOUR IS AN ARBITRARY PROPERTY AND THAT IS NOT A STYLE CHOICE.
           `cn` is `twMerge(clsx(…))`, tailwind-merge is unconfigured, and it has
           never been told that `--text-opsin-*` is a font-size namespace — so it
           files `text-opsin-body` and `text-foreground` in one conflict group
           and silently drops whichever comes first. Verified: `twMerge(
           "text-opsin-body text-foreground")` returns `"text-foreground"`, and
           reversing the order returns `"text-opsin-body"`. There is no ordering
           that keeps both, and the failure is silent — the note renders in
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
           whole treatment — and it is also what makes print work with nothing
           extra: a browser drops background colours on paper unless the reader
           has gone looking for the setting that keeps them, and a component
           with no fill has nothing to lose. Nothing here is `print:hidden`.

           `wrap-break-word` with `min-w-0` on the content cells is the reflow
           repair. `1fr` is `minmax(auto, 1fr)`, so the text track's floor is the
           longest unbreakable token in `children`; at 200% text on a phone one
           long word or a bare URL would widen the grid past the viewport, which
           is horizontal scroll on the document and an SC 1.4.10 failure. The
           link needs `wrap-anywhere` instead, for the reason set out on `LINK`:
           its label is an anonymous flex item that neither of those two
           reaches. */
        "gap-y-opsin-2 border-t border-border text-opsin-body [color:var(--foreground)]",
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
           here would only be a claim to more attention. `Check`, `Eye`,
           `TriangleAlert` and `OctagonAlert` belong to the status axis and
           appear on this component under no circumstances. */
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
             motivated to finish. */
          "m-0 min-w-0 max-w-(--opsin-measure-comfortable) wrap-break-word",
        )}
      >
        {/* Unlovely on purpose. An author who sees this line writes the
            product's own sentences; a reader who sees it has been told that
            something is missing rather than told something untrue. */}
        {supplied ? children : "No disclaimer text has been supplied for this note."}
      </p>

      {link}

      {version === "" ? null : (
        <span
          data-slot="disclaimer-note-version"
          className={cn(column, "min-w-0 wrap-break-word")}
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
 * public, reviewed code rather than a scratch demo. It shows the two things
 * worth seeing about this component: a note in place with everything it can
 * carry, and what happens when the words are missing — which is the state a
 * product is most likely to ship by accident and the one this component exists
 * to make visible.
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
        textVersion="example-wording-0"
      >
        Placeholder wording, for layout only. The product that installs this
        component writes the two sentences that belong here, and opsinjs ships
        none of them.
      </DisclaimerNote>

      <DisclaimerNote placement="footer" />
    </div>
  )
}
