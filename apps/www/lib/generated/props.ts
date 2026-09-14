/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    every `export interface <Pascal>Props` under registry/bases/
 * Generator: scripts/build-reference.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * <PropsTable name="StatusPillProps" /> in components/docs/tables.tsx reads this
 * map, and it is the only reader. No page writes a prop row by hand: a typed row
 * is correct on the day it is written and wrong from the next commit onwards,
 * with nothing anywhere to say so.
 *
 * The shape is fumadocs' TypeTable `type` prop - prop name to
 * { type, description, default, required } - so the entry is passed straight
 * through with no translation layer of its own to drift.
 *
 * Only the interface's OWN members are here. Props inherited through `extends`
 * are deliberately absent: opsinjs re-documents what it adds, and a table that
 * repeated forty upstream props would bury the four that are decisions.
 *
 * No timestamp. This file is behind a byte-for-byte drift gate, and a build time
 * would fail it on every run made on a different second from the commit.
 */

/** One row of a generated props table. Assignable to fumadocs' `TypeNode`. */
export interface GeneratedProp {
  /** The type exactly as the interface writes it. */
  type: string
  /** The prop's doc comment with its tags removed. Absent when it has none. */
  description?: string
  /** The value of an `@default` or `@defaultValue` tag, when there is one. */
  default?: string
  /** False when the prop is declared optional. */
  required: boolean
}

/** One interface's props, keyed by prop name, in declaration order. */
export type GeneratedPropsTable = Record<string, GeneratedProp>

/** Keyed by the exported interface name: `StatusPillProps`. */
export const PROPS_TABLES: Record<string, GeneratedPropsTable> = {
  "AlertBannerProps": {
    "status": {
      type: "ClinicalStatus",
      description: "The level, assigned by the product. Required, and it drives the role, the announcement and the affordances rather than only the colour. `steady` is legal, and it is the level worth being careful with. Its one honest use is de-escalation. That means saying that a condition the product raised earlier has resolved, which is news the reader is owed and which no other component in the system delivers. It is not a place to put a message that needs nothing: a banner that can say \"nothing needs attention\" is a banner a product will reach for whenever it wants to be noticed, and it still spends one of the two the screen is allowed. If nothing has changed, the component is a Callout. There is no `unknown`. It is the absence of an assertion rather than a fifth level, and an interruption with no level is an interruption with no meaning. ESCALATE BY REMOUNTING, NOT BY RE-RENDERING. Raising the level on a banner that is already on the screen patches `role` and `aria-live` onto a DOM node assistive technology has already registered, and a live region is registered when its node is inserted: adding the role afterwards commonly announces nothing at all, which on the way up to `urgent` is the one failure this component exists to prevent. Give the element a key that contains the level, so React replaces the node instead of patching it. That key is `key={status}`. Nobody has confirmed this with a screen reader; it is the conservative reading of the live-region model and it is written here rather than left implicit, because the recipe this component appears in escalates exactly this way.",
      required: true,
    },
    "heading": {
      type: "string",
      description: "What happened, in the reader's words, naming the subject in under eight words. Sentence case, and no exclamation marks. It does NOT need to contain the level's word, and should not repeat it: the component renders the level as a StatusPill inside this heading, so the word is there whatever the caller writes and cannot disagree with `status`. The specification asked the caller to write it in; making it structural is the one change this implementation makes to that contract.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "One or two sentences: what happened, then what it means for this reader, in that order and in the second person. Longer than that and the message is an instruction with steps, which is a CareCard.",
      required: true,
    },
    "headingLevel": {
      type: "AlertHeadingLevel",
      description: "Which heading element the banner's heading renders as. Defaults to `h2`. The component cannot know where it sits, and a heading at the wrong level makes an outline that skips a level on one screen and repeats one on the next. Pass the level below the heading of the surface the banner is on. Inside a section that already has an `h2`, pass `h3`.",
      required: false,
    },
    "detectedAt": {
      type: "string",
      description: "When the condition was detected, ISO 8601 with an offset. The instant the product's rules found the condition, not the instant this rendered. A banner stamped with its own render time tells the reader something that is true of the page and false of their data. IT IS CARRIED AS `data-detected-at` ON THE ROOT AND IS NOT RENDERED AS A PHRASE. RelativeTime has no word for an instant a product's rules produced, and the three obvious candidates, 'detected', 'flagged' and 'triggered', are banned as machine register by the content doctrine. Built from one of RelativeTime's five near words, \"Recorded 1 hour ago\" over a sentence about a reading would be taken for the age of the reading, which it is not: a rule that ran an hour ago may have found a reading taken days before it, and that pair of separately-true statements is what RelativeTime's own file calls the most consequential error in health dashboards. So the instant stays in the DOM for a stylesheet, a test and an export, and the banner asserts nothing about it in words. If the reader needs to know how old the reading is, show that where the reading is.",
      required: false,
    },
    "now": {
      type: "string",
      description: "The instant `detectedAt` would be measured against, in the same form. It renders no phrase today, because RelativeTime has no word for an instant a product's rules produced and the obvious candidates are banned as machine register. The one thing it drives is a development warning: passing it says you expected a rendered relative phrase, so the component tells you none is rendered rather than swallowing the prop in silence. The prop is retained for the day that grammar gains such a word, so a caller already passing the pair does not have to change when the phrase returns. A component that read the clock itself would be impure and would make two timestamps on one screen disagree across a minute boundary, so where it is passed, read it once where the screen is rendered as `new Date().toISOString()` and pass the same value to every timestamp on it.",
      required: false,
    },
    "actions": {
      type: "AlertAction[]",
      description: "At most two. Required at `attention` and `urgent`. At those two levels a banner with nothing to do about it is the most common way a health product creates anxiety it cannot resolve, and this component reports the omission rather than quietly rendering it.",
      required: false,
    },
    "dismissible": {
      type: "boolean",
      description: "Whether the reader may take the banner away. It needs `onAcknowledge` to do anything at any level: this component never removes itself, so the product is what stops rendering it, and a dismiss control with nowhere to report to is a control that does nothing.",
      required: false,
    },
    "onAcknowledge": {
      type: "() => void",
      description: "Called when the reader dismisses the banner. At `urgent` it is the whole of the affordance: an urgent banner may only be taken away by an acknowledgement the product records, because a reader who swipes a banner away on a bus has not been informed and nothing downstream can tell dismissal apart from understanding.",
      required: false,
    },
    "dismissLabel": {
      type: "string",
      description: "The dismiss control's visible word. Defaults to *Dismiss*, and the heading is appended to the accessible name so it says what it dismisses rather than standing alone. Override it to translate, or to say what acknowledgement means in this product. One product might say *I have read this*.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for a formatted value. The banner has none to format today: the timestamp was the one formatted thing on the surface and it is withdrawn, because RelativeTime has no word for an instant a product's rules produced. Like `now`, passing it beside `detectedAt` raises the development warning that no phrase is rendered. The prop is retained for the day a formatted value returns, and when one does, omitted, the reader's own environment decides. It does not translate the dismiss control; `dismissLabel` is the override for that word.",
      required: false,
    },
    "timeZone": {
      type: "string",
      description: "IANA time zone name (for example `Europe/London`) for a formatted absolute time. The banner has none to format today, for the reason `locale` gives: the timestamp was the one formatted thing on the surface and it is withdrawn. It is retained beside `now` and `locale` so a caller who is already forwarding the reading's zone does not have to change on the day a formatted value returns, and when one does return this is the prop that decides the reader's wall clock rather than the instant's stored offset. Like `now` and `locale`, passing it beside `detectedAt` raises the development warning that no phrase is rendered. Pass an IANA name rather than an offset such as `+01:00`: an offset cannot name a place and does not survive a daylight-saving boundary, which is the trap RelativeTime's own `timeZone` guard rejects.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root, and a class passed here WINS over the component's own where the two conflict. A banner sets no width and no margin, because both belong to the surface it sits at the top of. It is also the one way left to hide what this component insists on: a `sr-only`, a zeroed type size or a `truncate` passed here reaches the root and takes the heading, the body or the actions off the screen while leaving them in the tree. The component says so rather than pretending the hole is not there.",
      required: false,
    },
  },
  "AvatarProps": {
    "name": {
      type: "string",
      description: "Required. The person this avatar stands for. It is the picture's alt text and the source of the initials at once, so it can never say one thing to a screen reader and another on screen. An empty or whitespace only name is the mistake a data layer ships by accident: it warns in development and falls back to a neutral person glyph rather than an unlabelled circle.",
      required: true,
    },
    "src": {
      type: "string",
      description: "The picture, when the product has one. opsinjs ships none: no default image, no placeholder face. When it is absent, or when it does not load, the avatar falls back to the initials and then to the person glyph. The URL is used as given, so its trust and the content behind it are the product's to own and to moderate.",
      required: false,
    },
    "size": {
      type: "AvatarSize",
      description: "Diameter only. Three sizes, \"sm\", \"md\" and \"lg\", sized in rem so the circle grows with the reader's text size. Defaults to \"md\". A value outside the three is repaired to \"md\" and warned in development, because an avatar is decorative chrome and there is no honest smaller or larger reading to guess.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. For layout only, such as a margin in a stack. A category or status colour passed here is refused by the design rather than by code: the chrome is neutral, and tinting a person from either health axis is the bug the two-axes rule names.",
      required: false,
    },
  },
  "BodyMapProps": {
    "regions": {
      type: "{ key: string; label: string }[]",
      description: "The controlled vocabulary of regions, in the order they are considered. Each entry is a stable `key` and the visible words the product wants for it. Defaults to the nine generic regions the schematic ships with. Pass your own to subset the regions or to relabel them for your copy or language. A `key` with no built-in place on the figure cannot be drawn: it is warned once in development and skipped on the diagram, because a marker placed at a guessed position would be worse than no marker. The shipped keys are `head`, `chest`, `abdomen`, `left-arm`, `right-arm`, `left-leg`, `right-leg`, `upper-back` and `lower-back`.",
      required: false,
    },
    "value": {
      type: "string[]",
      description: "The keys currently marked. This is a controlled component with no selection state of its own, so a key here that matches no region simply shows nothing marked for it.",
      required: true,
    },
    "onValueChange": {
      type: "(value: string[]) => void",
      description: "Called with the next set of marked keys when the reader toggles a region. The caller stores it and passes it back as `value`.",
      required: true,
    },
    "label": {
      type: "string",
      description: "Required. The accessible name for the whole group, applied as `aria-label`. Name it as the question the reader is answering, for example \"Where are you noticing something?\", so a screen-reader user hears what the regions are for before the regions themselves. There is no default, because a guessed name would describe the wrong thing on most screens.",
      required: true,
    },
    "view": {
      type: "\"front\" | \"back\" | \"both\"",
      description: "Which figure or figures to show. `both` draws the front then the back side by side, `front` and `back` draw one. Defaults to `both`. A figure only ever shows the regions whose geometry belongs to that view.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root group. Layout, width and place in a form belong here. A class you pass wins over the root's own where the two conflict, because it is merged last.",
      required: false,
    },
  },
  "ButtonProps": {
    "variant": {
      type: "ButtonVariant",
      description: "Emphasis. Four values, in descending order: `primary`, `secondary`, `quiet`, `destructive`. One primary per surface. The hierarchy is the answer to \"what should I do here?\", and three primaries answer it with a shrug. Defaults to `secondary`, because the safe default is the one that does not claim to be the most important thing on the screen.",
      required: false,
    },
    "size": {
      type: "\"sm\" | \"md\"",
      description: "Visual weight only. Both sizes clear the 44pt target floor; `sm` is narrower and takes a smaller type step at the same weight, and is never shorter. Defaults to `md`.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Required. The label, and there is no way to remove it: no `iconOnly` prop and no size at which the icon stands alone. An icon-only control needs its accessible name supplied some other way and a different target treatment, which makes it a different component.",
      required: true,
    },
    "type": {
      type: "\"button\" | \"submit\" | \"reset\"",
      description: "Inherited from `button`, redeclared here because its default is the surprising one. **Defaults to `button`, not to `submit`.** Base UI's `useButton` merges `type: \"button\"` into every native button, so this component does not inherit the platform's implicit submit behaviour: a control at the foot of a form needs `type=\"submit\"` written on it. The value you pass wins, so submitting is one word away. It is a word you have to write, though.",
      required: false,
    },
    "icon": {
      type: "ReactNode",
      description: "An optional glyph beside the label. Always decorative and always hidden from assistive technology. The label carries the meaning, and an announced icon makes a screen reader say the action twice.",
      required: false,
    },
    "iconPosition": {
      type: "\"leading\" | \"trailing\"",
      description: "Which side the icon sits on. Defaults to `leading`. Use `trailing` for a control that moves the reader forward through a flow, so the glyph points the way the action goes.",
      required: false,
    },
    "busy": {
      type: "boolean",
      description: "In-place loading. The label stays visible and unchanged, and the button stays in the accessibility tree and in the tab order rather than disappearing. What a sighted reader sees is the press tone, the same fill a tap gives, held for the duration and paired with a busy glyph in the icon slot, so a busy control reads as working rather than as a live control that does nothing when pressed. What assistive technology is told is EXPOSED on the control as `aria-busy` plus `aria-disabled`; whether any screen reader says anything about it has not been tested here, and `aria-busy` on a control that is not a live region is a hint rather than a promise. The glyph replaces the icon slot, so a button that has no icon grows by one glyph when it becomes busy; give a button an icon if its width must not move. An icon settles the glyph alone: a `busyLabel` adds its word to the same slot beside the glyph, so a control that passes one widens on becoming busy whatever its icon, and only `fullWidth` or a container that fixes the width holds it steady then.",
      required: false,
    },
    "busyLabel": {
      type: "string",
      description: "The product's own word for what a busy control is doing, `Saving` or `Sending`, supplied by the product and never invented or translated by opsinjs. When `busy` is set and this is a non-empty string, it renders as a visible word beside the busy glyph and, unlike the glyph, reaches the accessibility tree. That word is the state's static carrier: a reader who turned motion off sees a still glyph and the word rather than a spin, and a reader who cannot see the glyph at all still has the word. Leave it unset and a busy control shows the glyph alone, which under reduced motion is a still glyph and the unchanged label with no word for what is happening. The word occupies the busy slot beside the glyph, so a control that passes it grows wider when it becomes busy, an icon notwithstanding; give the control `fullWidth`, or a container that fixes its width, if that width must not move under the reader's thumb.",
      required: false,
    },
    "fullWidth": {
      type: "boolean",
      description: "Fills its container. For the bottom of a sheet or a form, where the primary action should be as wide as the thumb's reach. Not for a row of buttons, because two full-width buttons stacked read as two primary actions.",
      required: false,
    },
  },
  "CalloutProps": {
    "variant": {
      type: "CalloutVariant",
      description: "Which of the three the callout is. Changes the glyph and nothing else: the fill, the ink and the boundary are identical for all three, so the variant survives greyscale by never having depended on colour.",
      default: "\"note\"",
      required: false,
    },
    "title": {
      type: "string",
      description: "An optional short heading. It renders as styled text and not as an `h1`-`h6` element, so it never appears in the page's outline: a component cannot know which level it is nested at, and one that guessed would produce an outline that skips a level on some screens and repeats one on others. If the callout is a section a reader needs to navigate to, it needs a real heading outside it. At that point it is probably a section rather than a callout. An empty or whitespace-only string is treated exactly like no title at all: the element leaves the DOM rather than rendering an empty line of heading-weight space.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "The body: one short paragraph. There is no actions slot and no `action` prop. A callout that needs a button is asking the reader to do something, and an instruction with somebody behind it is a CareCard.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here. A callout sets no width and no margin, because both are decisions of the content it sits in. A colour from either axis is the one thing it will not pass through. Such a utility is removed from the list before it reaches the root, in every environment, so a callout can never be drawn in a status fill; development additionally warns once per distinct offending class list, naming the component to use instead. Every other class the caller writes is passed through untouched.",
      required: false,
    },
  },
  "CardBodyProps": {
    "children": {
      type: "ReactNode",
      description: "The content.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the body.",
      required: false,
    },
  },
  "CardFooterProps": {
    "children": {
      type: "ReactNode",
      description: "Actions or metadata.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the footer.",
      required: false,
    },
  },
  "CardHeaderProps": {
    "title": {
      type: "ReactNode",
      description: "The card's title. Pass the heading element the page's outline needs, and the slot takes care of how it looks. `<h3>Recent readings</h3>` is the shape it takes. Pass a string instead and the title is styled text with no place in the outline, which is a legitimate choice for a card nobody needs to navigate to and a mistake for one they do.",
      required: true,
    },
    "description": {
      type: "ReactNode",
      description: "One supporting line under the title. It renders a paragraph, so it takes text or inline content rather than a block element.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Anything else the header holds, after the title and the description.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the header.",
      required: false,
    },
  },
  "CardProps": {
    "rung": {
      type: "MaterialRung",
      description: "Which rung of the material ladder. Defaults to `\"card\"`. That rung is named for this component, opaque and deliberately shadowless. Products may move a card down the ladder to `\"canvas\"`, or up to `\"raised\"` while it is being lifted, and never above that: a value a reader is trying to read must not sit over a moving backdrop.",
      default: "\"card\"",
      required: false,
    },
    "density": {
      type: "\"comfortable\" | \"compact\"",
      description: "Padding scale. Affects space only, never type size. `\"compact\"` drops the padding to 0.875 of the comfortable padding, the same fraction `tokens/space.json` publishes for the compact density, on the density-scaled spacing scale. It does not shrink the type, the separation between two controls in the footer, or the card's touch target.",
      default: "\"comfortable\"",
      required: false,
    },
    "href": {
      type: "string",
      description: "Makes the whole card a single link. A card that is a link may hold no other interactive element: a reader cannot tell what tapping the gap between two buttons will do, and a keyboard user reaches controls that are nested inside a control. TypeScript cannot express that exclusion, because `children` is a `ReactNode` and an element's interactivity is not in its type. So it is a rule this component states and does not enforce. A link card carries a resting cue the whole audience can read: a trailing chevron in the material's content row, visible with no pointer and no focus. It is `aria-hidden`, because the anchor's accessible name is already its whole text content. The hover, focus-visible and press title underline stays as well, now an addition rather than the only signal. `group-active` is what holds it through the press instead of dropping when an engine stops matching `:hover` on pointerdown.",
      required: false,
    },
    "render": {
      type: "ReactElement",
      description: "The product's own router link element, rendered in place of the plain anchor while the card keeps its `data-slot`, its shape, the target floor and the `group/card` hover relationship on it. Pass a Next or React Router link here so a linked card navigates client-side rather than reloading the whole page. It takes the element itself and not the function form Base UI parts accept, and it is only meaningful alongside `href`. In development a `render` passed without `href`, or one that is not a React element, warns once and the card falls back to the plain anchor. This is the escape hatch `Link` offers, and it is the only half of that component a card takes. Five components that shipped a private anchor moved to `Link` outright, because their anchor was a control inside the card: an action a reader chooses among others. A card's anchor is not that. The whole card is the target, so the element is the card rather than a control inside it, and it carries `data-slot=\"card\"`. Wrapping it in a `Link` would move `data-slot` onto a foreign root and put an action link's box and underline around a whole card, which is why this file keeps its own anchor and borrows only the `render` slot.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here: a card sets no width, no position and no place in a grid, because those are decisions of the screen it is on rather than of the card.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Everything the card holds. Usually that is `Card.Header`, `Card.Body` and `Card.Footer`, and equally correctly it is a single paragraph.",
      required: true,
    },
  },
  "CareCardProps": {
    "heading": {
      type: "string",
      description: "The instruction. Starts with a verb, and says what rather than why: \"Book a repeat blood test\", not \"About your recent result\". It is the card's accessible name, so it is also what a reader hears when they list the regions on a screen.",
      required: true,
    },
    "urgency": {
      type: "CareUrgency",
      description: "When the reader should do it, rendered as one of three fixed phrases inside the heading. Never derived from `status`: a card with no timing is a demand with no deadline, and the reader supplies the missing urgency themselves. It is usually the wrong one. The one exception to needing it is a readable `dueBy`: a written date is itself a timing, so a card may omit the phrase when it supplies a date. A card that carries both is carrying two timings that this file never compares, and where both are supplied the product owns keeping them coherent.",
      required: false,
    },
    "attribution": {
      type: "string",
      description: "Who is asking. Required, and free text rather than an enum, because \"your GP surgery\" and \"an automatic reminder from this app\" are both true answers and the difference matters more than any category we could invent. Left empty, the card says in words that it does not know, and warns in development. It never quietly drops the line.",
      required: true,
    },
    "reason": {
      type: "string",
      description: "One sentence: what prompted this instruction.",
      required: false,
    },
    "dueBy": {
      type: "string",
      description: "The deadline, as a calendar date in the form `2026-10-12`. The card writes it out in full rather than as a relative phrase, because a date does not change meaning while the card sits on a screen. Anything that is not a calendar date is refused rather than guessed at, and no deadline line is rendered for it.",
      required: false,
    },
    "overdue": {
      type: "boolean",
      description: "Whether that date is behind the reader now. An input, like everything else with a time in it here: the card reads no clock, and comparing a calendar date to \"now\" needs the reader's own time zone, which a component rendered on a server does not have. When it is true the card says so in words, and the product owns saying what to do about it. Usually that means changing `heading`.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the deadline date. It does not translate the three timing phrases or the two admissions: those are English, and the gap is recorded on the page rather than hidden behind a prop that would also let a caller relabel \"Do this today\" as something more insistent. When it is omitted the date is written with the runtime's default, which on a card rendered on a server is the server's language and not the reader's, and development says so.",
      required: false,
    },
    "actions": {
      type: "CareAction[]",
      description: "At most two. More than two is a screen rather than a card; the extras are dropped, and development says which ones so nothing goes missing quietly.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The clinical status of the thing that prompted this instruction, rendered as a StatusPill and nowhere else. Optional and independent of `urgency`: plenty of instructions have no reading behind them at all, and the two never derive from one another in either direction.",
      required: false,
    },
    "statusOf": {
      type: "string",
      description: "What that status is about, for the pill's accessible name: \"your last blood test\". Without it a screen-reader user hears a level with no subject inside a card full of other nouns, and the likeliest thing they attach it to is the instruction. That is not what it describes.",
      required: false,
    },
    "headingLevel": {
      type: "2 | 3 | 4 | 5 | 6",
      description: "Which heading element the card renders. The level belongs to the page and the appearance belongs to the card: a component that hard-codes its level produces an outline that jumps from h1 to h3 on one screen and a wall of h2s on another.",
      default: "3",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here. The card sets no width and no place in a grid, because both are decisions of the screen it is on. It is also the one hole in this component's refusal to take a status colour: a colour utility passed through here reaches the root, and a card tinted from the status axis is the thing the pill exists to make unnecessary.",
      required: false,
    },
  },
  "ConsentSheetProps": {
    "consentId": {
      type: "string",
      description: "Stable id of the consent being asked for. It is not shown to the reader; it is what a product's own record is keyed on, and it is required because a decision with nothing to attach it to is not a record.",
      required: true,
    },
    "textVersion": {
      type: "string",
      description: "The version of the wording on this sheet. Change it whenever any of the text changes, and never reuse one: a consent record with no version cannot answer the only question anybody will ever ask of it, which is what the person actually read.",
      required: true,
    },
    "heading": {
      type: "string",
      description: "What is being asked, phrased as a question the reader can answer yes or no to. It is the sheet's accessible name and its visible heading. The two are the same element, which is why there is no separate `title`.",
      required: true,
    },
    "purpose": {
      type: "string",
      description: "What the data is for, in one or two sentences, in terms of what the reader gets rather than what the product does internally. One decision per sheet: bundling is a design error rather than a prop, so there is no array here and no way to make this the introduction to a list of switches.",
      required: true,
    },
    "scope": {
      type: "ConsentScope",
      description: "What is collected, who can see it and how long it is kept. Rendered as a list.",
      required: true,
    },
    "withdrawalPath": {
      type: "string",
      description: "Where the reader can change this decision later, as a sentence in their own language. Required, and the sheet will not ask without it: a consent with no exit is not revocable whatever the copy says. It renders as text and is deliberately not turned into a link. A string is not a destination, and the doctrine's answer is that revocation lives where the data lives rather than inside the sheet that asked for it. So what belongs here is the sentence that tells the reader where to go, and the control belongs on the screen showing the data.",
      required: true,
    },
    "details": {
      type: "ConsentDetails",
      description: "The full wording, disclosed in place behind a named control, for the reader who wants all of it. Omitted, no control is drawn: an empty disclosure is a promise of more that there is no more of.",
      required: false,
    },
    "consequenceOfDeclining": {
      type: "string",
      description: "What the reader loses by declining, stated before they choose. Optional, because opsinjs cannot know whether a product still works after a refusal. It is required by the doctrine whenever it does not. If refusing breaks something the reader came for, this is where they are told, and they are told before the controls rather than in a confirmation afterwards.",
      required: false,
    },
    "notAskedMessage": {
      type: "string",
      description: "What stands where the two controls would have been when the sheet cannot ask. Optional, and the default is English, which is the one string in this file a reader can see that opsinjs wrote. It is interface copy rather than consent wording: it names the state of the interface, it agrees to nothing and it describes no purpose, no recipient and no retention period. The scenario that produces it is a translation row nobody filled in, which is exactly the reader who will not read the default, so a product that ships more than one language passes its own sentence here. It never becomes a question and it never draws a control.",
      required: false,
    },
    "acceptLabel": {
      type: "string",
      description: "The word on the accept control. Required, with no default anywhere in this file, and there is no fallback if it is blank. Name the outcome rather than the press: a label that begins with the reader's own word for yes and then says what will happen is an answer, and one that only describes pressing the button is not. A generic label raises a development warning and is rendered exactly as written. Only the product knows what it is agreeing to, and a component that rewrote the word would be writing consent copy.",
      required: true,
    },
    "declineLabel": {
      type: "string",
      description: "The word on the decline control. Required, and it carries the same weight as `acceptLabel` in every dimension this component controls: there is no `hideDecline`, no `declineVariant`, and no way to make this one quieter. Name the outcome it refuses, in the same shape and at about the same length as the accept label. A word that postpones rather than answers raises a development warning, because in a screen reader's list of controls a postponement and a refusal are not the same choice.",
      required: true,
    },
    "onDecision": {
      type: "(decision: ConsentDecision) => void",
      description: "Called when the reader presses one of the two controls, and at no other time. Closing the sheet without pressing either calls nothing: it is not a refusal, and it is certainly not consent. The component does not close itself afterwards. `open` is the caller's, as it is on every Sheet, so a product can show what happens next before the surface goes away.",
      required: true,
    },
  },
  "DialogProps": {
    "open": {
      type: "boolean",
      description: "Whether the dialog is on screen. Required and controlled: a surface that blocks everything else is not a thing a component should be able to open by itself, and the product that owns the decision owns the state.",
      required: true,
    },
    "onOpenChange": {
      type: "(open: boolean) => void",
      description: "Called with the state the dialog wants to be in. One argument, deliberately: every reason Base UI would report is either handled inside this component or means the same thing to a caller, and a second parameter that only sometimes matters is a second parameter people copy without reading. It is not called when Escape is pressed on an alert dialog, because that dialog does not close.",
      required: true,
    },
    "title": {
      type: "string",
      description: "The accessible name, and a question wherever the dialog is asking one. It is a heading, it is always visible, and there is no prop that hides it: an unnamed modal surface is announced as \"dialog\" and nothing else.",
      required: true,
    },
    "description": {
      type: "string",
      description: "What happens if the reader says yes, and what happens if they say no, in one or two sentences. Optional on an ordinary dialog and effectively required on an alert one. It is the only place the reader is told why Escape will not let them out, and its absence raises a development warning.",
      required: false,
    },
    "severity": {
      type: "\"default\" | \"alert\"",
      description: "`alert` renders `role=\"alertdialog\"`, removes the close control, stops the scrim dismissing and stops Escape closing. Use it only where going away without answering is not a valid outcome, which is rarer than it feels: almost every dialog a product reaches for has a safe answer, and that answer is a button rather than a missing exit.",
      default: "\"default\"",
      required: false,
    },
    "closeLabel": {
      type: "string",
      description: "The accessible name of the close control, which is the only reader-facing word this component owns. It exists so that the word can be translated: a component that ships an untranslatable English string into a product whose readers do not read English has removed their way out of the dialog as surely as deleting the control would. The default is English, and that is the residual gap. It is the same one `StatusPill.label` has, and it is listed on the page rather than described as solved. Ignored when `severity` is `alert`, which renders no close control at all.",
      default: "\"Close\"",
      required: false,
    },
    "initialFocus": {
      type: "\"safest\" | \"content\"",
      description: "Where focus lands when the dialog opens. `safest` puts it on the LAST control in `actions`, which is where the specification's own example puts the answer that changes nothing; `content` puts it on the first control inside `children`, for a dialog whose job is a short task rather than a question. Neither ever lands on the scrim or on the container while a control is available. `content` falls back to the safest action when `children` holds nothing focusable, and only then to the primitive's own behaviour. That order is the point rather than a tidy-up: the primitive's default is the first tabbable element in the popup, an alert dialog has no close control, and so the first tabbable element in an alert dialog is the FIRST action. The ordering rule reserves that for the answer that changes something. The cost of `safest` is that it is the LAST tab stop in the dialog, so the first Tab wraps round to the close control and the other answer is reached with Shift+Tab. That is the trade: a stray Return is harmless, and the other answer is one key further away than it looks.",
      default: "\"safest\"",
      required: false,
    },
    "actions": {
      type: "ReactNode",
      description: "The actions, in order, least destructive LAST. At most two. A dialog with three answers is a menu that has not admitted it, and that limit is a rule this component states rather than enforces, because `ReactNode` does not say how many controls are inside it and `React.Children.count` cannot see through a fragment. They are pinned to the foot of the dialog and never scroll away.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Anything the dialog holds beyond its title and its description: a short form, a list of what will be affected. Optional, and most confirmations need none of it. Nothing translucent goes in here. The dialog is itself a translucent rung and a translucent rung may never contain another one. A card inside a dialog is a `card`, which is opaque and is where a health value has to sit.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the container. Width belongs here: the dialog takes the full width of a phone and a readable measure above that, and a product with a genuinely wider dialog overrides it rather than asking for a prop.",
      required: false,
    },
  },
  "DisclaimerNoteProps": {
    "children": {
      type: "ReactNode",
      description: "The product's own words. One or two sentences: what this product does, then what it does not do. It renders a paragraph, so it takes text or inline content rather than a block element. There is no default text and there will not be one. Legal copy shipped from a design system puts words into products whose authors never read them, and it arrives looking reviewed because it came from a library. Supply none and the note says on screen that none was supplied, rather than inventing a sentence. `false` from a `&&` branch, `0` from the same branch on an empty collection, an empty array and a whitespace-only string all count as supplying none. The boundary is words: a caller who wraps the copy in an element is taken at their word, so an empty string inside a `<strong>` is the one route to a silently empty note that stays open. TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape `EmptyState.children` has. Marking it required buys nothing, because `{copy.text}` with an undefined `copy.text` type-checks either way. It costs the ability to render the state at all, which is the state that most needs seeing.",
      required: false,
    },
    "placement": {
      type: "\"inline\" | \"footer\"",
      description: "Where it sits. `inline` goes under the content it qualifies; `footer` goes once at the end of a surface. There is no `banner` value and there is no `top` value: a reader who came to see a number sees the number first. The two differ by the space above the note and by nothing else. Neither changes the type size, the ink or the boundary.",
      default: "\"inline\"",
      required: false,
    },
    "more": {
      type: "{ label: string; href: string }",
      description: "The fuller statement, for readers who want it. BOTH HALVES TOGETHER, and that is why this is one object rather than a bare href. A destination with no label would need a label written here, and the label this system would have to invent is the exact one the specification refuses: *learn more* names nothing, and a screen reader's list of links is where that costs somebody the page they were looking for. The product names its own destination in its own words, in its reader's language.",
      required: false,
    },
    "textVersion": {
      type: "string",
      description: "The id of this note's wording, so a product can record which version a reader was shown. Legal text changes, and a record should say which one applied. It renders as visible text, exactly as it is written here. An attribute would be tidier and would be a record only the product that already had the value could read: it survives no screenshot, no printout and no support ticket, and the data-attribute vocabulary is closed at four in any case. So write something a reader could quote back in a support conversation rather than an internal identifier, and write it in their language: no word is added around it, because any word added here would be English. It renders one step down in the secondary ink, at the footnote size, so a reader can tell it apart from the statement rather than parse it as a third sentence about their health. It is still rendered exactly as written, with no word added around it.",
      required: false,
    },
    "icon": {
      type: "boolean",
      description: "Whether to show the informational glyph. The glyph itself is not configurable, and that is the point: an icon prop taking a `ReactNode` would accept a warning triangle, and a triangle sets the register before a word of the note is read. It is decorative, hidden from assistive technology, and sized in `em` so it grows with the text. The default is off. The quietest form of this component is the one to prefer, and a glyph is the first step towards a note that competes with the reading above it.",
      default: "false",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Width, margin and place in a layout belong here: they are decisions of the surface the note is standing on rather than of the note. It is also the one hole in this component's refusal to carry a colour, and the component says so rather than pretending otherwise: a utility from either axis passed through here reaches the root, and in development it raises a warning naming what to use instead.",
      required: false,
    },
  },
  "DividerProps": {
    "orientation": {
      type: "\"horizontal\" | \"vertical\"",
      description: "Which way the line runs. `horizontal` is a full-width rule between stacked groups; `vertical` is a full-height rule between side-by-side groups. A value outside the two is drawn horizontal, which is the form that needs nothing from its container, and a development warning names the mistake. Defaults to `horizontal`.",
      required: false,
    },
    "label": {
      type: "string",
      description: "An optional short label centred on a horizontal rule, for a named boundary such as \"Earlier\" or \"Today\". A label changes the structure: the rule stops being a `role=\"separator\"` element, because a separator cannot carry an accessible name, and becomes two decorative hairlines with the label as plain text between them. A whitespace-only label is treated as no label. A label with `orientation=\"vertical\"` has no sound layout, so it is dropped with a development warning and the vertical rule is drawn plain. The label is the visible echo of a grouping that structure must also carry, never the only thing a screen reader has to tell the two groups apart.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. This is where a vertical rule is given its height when its container does not, and where the caller controls the spacing around a horizontal rule. It is unrestricted, so it is the one route by which colour can reach a divider, and the two-colour-axes rule applies to it in full: a divider takes neither a status nor a category tint. `cn` merges whatever it is handed and cannot detect a class from either axis.",
      required: false,
    },
  },
  "EmptyStateProps": {
    "reason": {
      type: "\"nothing-yet\" | \"no-matches\" | \"nothing-left\" | \"not-enough\" | \"could-not-load\"",
      description: "Why the surface is empty. Required, and it deliberately changes nothing you can see. `nothing-yet` means the reader has not added anything yet. `no-matches` means a filter or a search matched nothing. The data exists. `nothing-left` means there was content and there is none now; everything was completed or removed. `not-enough` means there is data, but not enough for this view to be honest. `could-not-load` means the system tried to fetch and failed. This is a state about the system and not about the person: the reading is not missing, the request failed. It is the one reason that renders a visible marker of its own and the one reason whose `action` is mandatory, because an error must always offer a retry or a route onwards. It is required because each one needs different words, and because two of them carry more than an inconvenience: `not-enough` is a safety statement, and `could-not-load` is an error that must not be mistaken for an absence. The four empties render nothing of their own, because a component that turned an empty into a sentence would be writing a sentence about the reader's data, which is the one thing this system will not do. `could-not-load` is the deliberate exception: it renders a neutral word and an icon so a failed load never reads as an empty list, and it takes neither axis of colour.",
      required: true,
    },
    "title": {
      type: "string",
      description: "What is not here, in one short line. Rendered as a real heading so the empty state can be navigated to rather than stumbled into. Required, and checked as well as typed. A blank or whitespace-only string renders a visible line saying the screen has no heading, and warns. It warns because the alternative is a heading with no name, which is silent to everything except a screen reader and an audit.",
      required: true,
    },
    "titleLevel": {
      type: "2 | 3 | 4 | 5 | 6",
      description: "The heading level the surrounding page needs. There is no way for this component to know it, because an empty state replacing a page's main content wants a different level from one inside a card. So `2` is a starting point and not an answer. Check it against the outline of the screen it lands on.",
      default: "2",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Why it is empty, in one or two sentences. Say what is not here, then why, then what to do; for `not-enough`, state the rule and the gap. It renders a paragraph, so it takes text or inline content rather than a block element. Omitting it does not produce a tidier empty state. It produces a visible line saying there is nothing here and the app does not say why, because the alternative is a default sentence about an absence of health data, which is a sentence nobody reviewed. `false` from a `&&` branch, an empty array and a whitespace-only string all count as omitting it. A body that is only a number is refused outright and replaced with the same line, because `{items.length && \"…\"}` at a length of zero renders the digit `0`. An absence rendered as a number reads as a measurement of nothing.",
      required: false,
    },
    "action": {
      type: "{ label: string; href?: string; onSelect?: () => void }",
      description: "Exactly one primary action, or none. Never a row of three. `href` navigates and renders an anchor; `onSelect` acts and renders a Button. Supply one of the two. A control that produces a new URL is a link however it is styled, and rebuilding it as a button loses the new tab, the copied address and the screen reader's list of links. Optional for the four empties, mandatory for `could-not-load`. An error that offers no way back is the one thing this state exists to prevent, so when the reason is `could-not-load` and no usable control renders, the surface shows a visible refusal in its place and warns in development.",
      required: false,
    },
    "secondary": {
      type: "{ label: string; href?: string; onSelect?: () => void }",
      description: "A quieter alternative, for the reader who cannot take the primary one. Same shape and same rule; it is not a second primary action, and it does not belong here on its own.",
      required: false,
    },
    "illustration": {
      type: "ReactNode",
      description: "Decorative only, and never the carrier of the message. It is hidden from assistive technology and made `inert`, dropped in print, and dropped again when the surface is narrow. If a picture is carrying meaning, the meaning is missing from the words. `inert` is why nothing focusable belongs here: a control inside a decorative wrapper would be hidden from the accessibility tree and unreachable by keyboard, which is a worse outcome than not passing it.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Width, position and place in a grid belong here: they are decisions of the screen this is standing in for, not of this component.",
      required: false,
    },
  },
  "FieldControlProps": {
    "render": {
      type: "ReactElement",
      description: "Renders a different element in place of the `<input>`, keeping every id and aria attribute Field generated: `render={<textarea rows={3} />}`. This is the escape hatch that makes the wiring guarantee survive a control opsinjs does not ship.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Only meaningful alongside `render`, for an element that has children of its own, such as the `<option>` list of a `<select>`. An `<input>` is void and takes none.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the control. The control's own classes win where they conflict.",
      required: false,
    },
    "defaultValue": {
      type: "string | number | readonly string[]",
      description: "The uncontrolled starting value. Use `value` and `onChange` for a controlled control.",
      required: false,
    },
    "style": {
      type: "CSSProperties",
      description: "Merged onto the control.",
      required: false,
    },
  },
  "FieldProps": {
    "label": {
      type: "string",
      description: "Required, visible, and never hidden. There is no `hideLabel` prop and no value of any other prop that removes it: a control whose name lives only in a placeholder loses it the moment somebody types.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "The control. Put a `Field.Control` here. Field supplies its id, its `aria-describedby` and its invalid state through context, so a product never wires them by hand. Anything else that participates in Base UI's field context works too; anything that does not gets a label pointing at nothing, which is the one failure this component cannot detect for you.",
      required: true,
    },
    "hint": {
      type: "string",
      description: "Guidance shown before a mistake rather than after it. Stays visible when an error appears, because a reader who has just made a mistake still needs the guidance that would have prevented it.",
      required: false,
    },
    "error": {
      type: "string",
      description: "The error message, in the product's own words. Its presence marks the control invalid and adds the message to the control's description; it never removes the hint. Omit it and the field falls back to whatever the browser says about the control's own constraints, which is words opsinjs has not written.",
      required: false,
    },
    "optionality": {
      type: "\"required\" | \"optional\" | \"none\"",
      description: "Which state is marked, in words, inside the label. Mark the exception: in a form where most fields are required, mark the optional ones, and the reverse. Defaults to `\"none\"`, because marking both is the same as marking neither.",
      required: false,
    },
    "validateOn": {
      type: "\"blur\" | \"submit-then-change\"",
      description: "When the control's own constraints are checked. Governs the invalid state, not the `error` prop. A message the product passed in is a message the product has already decided to show. Defaults to `\"submit-then-change\"`: never tell somebody their answer is wrong while they are still typing it. The `submit-then-change` default needs Base UI's `<Form>` around the fields, which `Field.Form` re-exports. Base UI gates it on a flag that only its own form primitive ever sets, so inside a plain `<form>` the constraints are checked on Enter in a text input and at no other moment. `\"blur\"` needs no `<Form>`. Field cannot warn you when the `<Form>` is missing, because it is a server component with no hook to read the form context from, so the mismatch is documented here rather than reported at runtime. Passing `error` is unaffected either way, and is the path to be on.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Field lays its own parts out in a column and leaves the space BETWEEN fields to the form, which is the only place that knows how many there are.",
      required: false,
    },
  },
  "IconButtonProps": {
    "icon": {
      type: "ReactNode",
      description: "Required. The glyph, and the only thing a sighted reader sees. Always decorative and always hidden from assistive technology, because the label carries the meaning and an announced icon makes a screen reader say the action as a picture. Size it in `em` upstream or leave it: the icon slot sizes any child `svg` at `1em`, so the glyph tracks the type step.",
      required: true,
    },
    "label": {
      type: "string",
      description: "Required. The accessible name, and there is no way to remove it: this is the whole reason IconButton is a separate control rather than a size of Button. It is set as `aria-label` on the button and, as a fallback, as a visually hidden text node inside it. Name the action and its object, such as \"Close the reading details\", so a voice-control user can say what they mean and a screen-reader user hears a verb rather than \"button\". A missing or whitespace-only value raises a development warning.",
      required: true,
    },
    "variant": {
      type: "ButtonProps[\"variant\"]",
      description: "Emphasis, mirrored from Button. Four values in descending order: `primary`, `secondary`, `quiet`, `destructive`. Defaults to `secondary`, which keeps a visible boundary, because an icon-only control with no border and no word is the hardest of all to recognise as a control. Reach for `quiet` only in a toolbar or a header where the surrounding context already says these are controls.",
      required: false,
    },
    "size": {
      type: "ButtonProps[\"size\"]",
      description: "Visual weight only, mirrored from Button. Both sizes clear the 44pt target floor; `sm` takes a smaller glyph at the same target, never a shorter one. Defaults to `md`.",
      required: false,
    },
    "onClick": {
      type: "ButtonProps[\"onClick\"]",
      description: "The action. Forwarded to the button unchanged. IconButton defines no handler of its own, so this is the caller's own click, run in the caller's own context.",
      required: false,
    },
    "disabled": {
      type: "boolean",
      description: "Makes the control genuinely unavailable through the native attribute, which takes it out of the tab order and the accessibility tree. There is no busy state here: IconButton does not expose Button's `busy`, because an icon-only control has no label to keep visible while it works, so a busy icon button is a control whose name and glyph both vanish. Use a labelled Button where a busy state matters. Defaults to `false`.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the composed Button last, so a class you pass wins over the square shape where the two conflict. Width, margin and place in a layout belong here. Do not resolve a category or a status colour through it: this control takes neither axis.",
      required: false,
    },
  },
  "LinkProps": {
    "href": {
      type: "string",
      description: "Required. Where the link goes. It is a string rather than optional, because a link with no destination is a button, and that is a different component.",
      required: true,
    },
    "emphasis": {
      type: "LinkEmphasis",
      description: "Required. The weight, and there is no default: `inline` for a link inside a sentence, `action` for a card's primary action, `secondary` for the quiet one beside it. There is no sensible default weight, and a guessed one is a decision nobody made.",
      required: true,
    },
    "ground": {
      type: "\"neutral\" | \"tinted\"",
      description: "Whether the link sits on a neutral surface or a status tint. Only meaningful for `action` and `secondary`. On `tinted` the recipe brings no neutral ink, so the surface's own level ink shows through, and an `action` link takes a boundary whose colour the caller supplies per level beside `className`. Defaults to `neutral`.",
      required: false,
    },
    "render": {
      type: "ReactElement",
      description: "The product's own router link element, rendered in place of the plain anchor while keeping Link's classes, `data-slot` and target floor on it. Pass a Next or React Router link here so navigation stays client-side rather than reloading the page. Without it Link renders a real `<a href>`.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Required. The link text, and the accessible name. Write it so it reads on its own out of a screen reader's list of links: name the destination, never \"click here\" or \"read more\".",
      required: true,
    },
  },
  "LogSheetProps": {
    "values": {
      type: "Record<string, number | string | null>",
      description: "What the product's own controls currently hold, keyed the way the product wants them back. Handed to `onSave` verbatim. This is the channel that makes `onSave` possible at all: `children` is an opaque element tree and no component can read structured data out of one. The product already holds this state to render its own controlled inputs, so nothing here is duplicated. The key is simply written down beside the control instead of being inferred from it. `{}` is legitimate, for an entry that is a note and a time and nothing else. It is also how the sheet knows there is unsaved input. What is here when the sheet opens is the baseline; what is here when the reader tries to leave is compared against it, and a save resets the baseline so that a sheet the product keeps open afterwards does not claim to hold input nobody has saved.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "The entry controls, rendered in order at the top of the sheet. They stay opaque. This component never walks them, never counts them and never reads a value out of them. `values` is the channel for that. There is no enforced ceiling, and the \"about five\" in the specification is deliberately not implemented as a check. `React.Children` sees only direct children, so a product that wraps its own two fields in one component of its own would be counted as having one, and a count that is wrong in the common case teaches the wrong lesson twice: it clears a sheet that is too long and complains about one that is not. The ceiling is a design rule, and this is the file saying so rather than pretending to enforce it.",
      required: true,
    },
    "category": {
      type: "HealthCategory",
      description: "What the entry is about, tinting one band and nothing else. Omit it and the band is not rendered. There is no default category, because a capture sheet with the wrong identity colour is worse than one with none. The status axis is not available here at any price. Colouring a field while somebody is typing their own measurement into it is a verdict delivered mid-keystroke, and it is the fastest way to teach a person to stop logging honestly.",
      required: false,
    },
    "saveLabel": {
      type: "string",
      description: "The primary action's label, and it is required because there is no honest default. The content rule is that the action says what it saves, as in *Save reading* or *Save this dose*. A component that shipped *Save* would let every product skip the rule without noticing it had one.",
      required: true,
    },
    "timeLabel": {
      type: "string",
      description: "Overrides the time control's label, for translation or for a product whose readers use different words. The time field is always present, so unlike the note this component has to ship a word for it.",
      required: false,
    },
    "noteLabel": {
      type: "string",
      description: "The note control's label. Supplying it is what adds the note field; omit it and there is no note. Opt-in rather than always-on, and the label carries the opting: a free-text line is a field like any other and counts against the sheet's budget, and this component has no wording of its own that would suit every product's note.",
      required: false,
    },
    "maxBackdateDays": {
      type: "number",
      description: "How far back an entry may be dated, in days. The product owns this number; omit it and no earliest date is offered or stated. What it does: it sets the time control's `min`, which is what the platform date picker reads, and it names the earliest date in the field's guidance. The window opens at the START of the day that many days before the sheet opened, so a seven-day window reaches the beginning of that seventh day rather than the clock time the sheet happened to open at, and the picker offers the whole of the earliest day the guidance names. What it does NOT do is refuse a save. This component never blocks a save for any reason, so a time the reader types outside the window still saves and `onSave` still fires. The platform's own picker is a separate matter: on a touch device the picker is the only way to change a datetime-local and it will not offer a time below `min`, so there the window is enforced by the platform even though the sheet enforces nothing. A product that must accept entries older than its window should not set `maxBackdateDays` at all.",
      required: false,
    },
    "onSave": {
      type: "(entry: LogEntry) => void",
      description: "Called on an explicit save and at no other moment. There is no autosave, no commit on close, and no debounce. It does not close the sheet. `open` belongs to the product, which is the only party that knows whether the save reached anywhere. A queued entry, a rejected one and a stored one all arrive here identically, and a sheet that closed itself would have decided the reader was finished on the strength of a function call returning.",
      required: true,
    },
    "onDiscard": {
      type: "(entry: LogEntry) => void",
      description: "Called when the reader answers the confirmation by discarding. IT TAKES THE ENTRY, which the specification's signature did not. The specification says \"the product decides whether to keep a draft\" and then hands the product nothing to keep; widening the parameter list is the smallest repair, and it is the same widening Sheet made to `onOpenChange` for the same reason. A zero-argument handler is still assignable, so `onDiscard={clearForm}` typechecks unchanged. The entry is the one that was about to be lost, built exactly as `onSave` would have built it. Keeping it is a draft; ignoring it is a discard.",
      required: false,
    },
  },
  "MetricTileProps": {
    "label": {
      type: "string",
      description: "What was measured, in the reader's words. Use two or three of them, not an acronym and not an internal code: a dashboard that has to be learnt before it can be read is a dashboard that is read wrong.",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The reading. `null` renders the no-reading state, which is not zero. Zero is a real measurement for several metrics and a missing one is not a measurement at all. A number and not a string. A pre-formatted reading has already been rounded by somebody, carries no spoken unit and leaves nothing machine-readable behind it; a compound reading such as a pair is two measurements and takes two tiles.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "Display symbol, exactly as `tokens/units.json` spells it, as in \"kg\", \"mmol/L\" or \"steps\". The spoken form is resolved from that table by Value, so this is the only place the unit is named. Optional by type and all but mandatory in practice: a bare number is ambiguous between unit systems, and Value raises OPSIN-0003 when one arrives without a unit rather than this file raising a second copy of the same complaint.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the measurement. That is the resolution of the device, or the number of places the laboratory reported. Required, so a TypeScript caller cannot omit it: a bare number that arrived from arithmetic can carry seventeen digits, which on a tile is also a layout problem. Forwarded to Value untouched. A JavaScript caller who omits it still gets the digits it was handed plus a development warning from Value.",
      required: true,
    },
    "measuredAt": {
      type: "string | null",
      description: "When the reading was taken, ISO 8601 with an offset. The time of MEASUREMENT, never of retrieval, sync or render. A tile that timestamps itself with the moment the screen was drawn tells every reader that every reading is current. The word this instant is announced with is `event`, which defaults to \"measured\". A reading must be dated. A value with no locatable time is undated, and for health data undated is the same as wrong, so a reading passed with a time this component cannot locate is refused and nothing is drawn. `null` is allowed, and it means one thing only: there is no measurement time because there was no measurement. It is legal solely beside an absent `value`, where the tile shows the absence and no time at all. A reading present beside `measuredAt={null}` is the undated reading above and is refused the same way. A tile that has a value it cannot date is not a tile.",
      required: true,
    },
    "event": {
      type: "TimeEvent",
      description: "The word the time line is announced with. It names the moment rather than the origin of the number. The five events RelativeTime publishes are \"measured\", \"recorded\", \"received\", \"synced\" and \"issued\"; this defaults to \"measured\" so an existing caller is unchanged, and a product measuring off a device or reading a laboratory value names the one that is true. It names the moment and not the provenance. This component cannot check that the word matches how the number was obtained, so a self-reported figure routed through here with `event=\"measured\"` is still announced as a measurement. The product owns that word. Data provenance and device accuracy asks for the provenance class to be shown in plain words, which this component still does not carry, and the page records that as an open gap.",
      required: false,
    },
    "now": {
      type: "string",
      description: "The instant the age is measured against, in the same form as `measuredAt`. Required for the same reason RelativeTime requires it: a component that read the clock itself would be impure, would read it once per tile rather than once per screen, and would let a grid of eight disagree with itself across a minute boundary. Read it once where the screen is rendered. Use `new Date().toISOString()` and pass the same value to every tile on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the tile shows its stale treatment. Supplied by the product, and by nobody else: what counts as an old reading is clinical, it differs completely from one measurement to the next, and opsinjs holds no such number for any measurement in any population. Writing one here would publish a boundary this system has no standing to publish. The same is true of writing one in an example, or in a comment as an illustration. There is no default and there will not be one. Omitted, there is no stale treatment at all. That is the honest output when nobody has said what stale means here, and never a substituted number.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The level the product assigned to this reading. Rendered as an embedded StatusPill and never as the tile's fill. Omitted, no pill is rendered at all: there is no neutral level to fall back on, and a pill invented to fill a gap would be a verdict nobody gave. PAIR `attention` AND `urgent` WITH AN `href`. Clinical status semantics says of `attention` that there is always a named action, and a tile has no room for a sentence. So on a tile the action is the tile itself, and a level on a tile that leads nowhere leaves a reader a verdict and no way to act on it. Nothing here enforces the pairing: the check belongs in the shared warning channel, which this file cannot add a code to, and it is recorded as an open gap on the component's page rather than left silent.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the icon and the label, and nothing else. Identity rather than meaning: in greyscale the tint is lost and not one fact goes with it.",
      required: false,
    },
    "icon": {
      type: "ReactNode",
      description: "The category glyph, supplied by the product. opsinjs ships no category icon set. [category identity](https://opsinjs.dev/docs/health/category-identity) says an icon is governed separately. So this is a slot rather than a lookup, and a tile with no icon is a complete tile. Rendered decorative: the label beside it says the same thing in words, and a glyph announced as well would make a screen reader say the subject twice. It must not be interactive; the tile is one target and nothing nests inside it. Because the wrapper is `aria-hidden`, a control passed here would be reachable by Tab and absent from the accessibility tree at the same time. Nothing here checks that, so this sentence is the whole guard, and the page's claim that nothing inside a tile is focusable is scoped to what this component controls.",
      required: false,
    },
    "href": {
      type: "string",
      description: "Where the tile leads. With it the whole tile is one link, meeting the target floor on both axes; without it the tile is a static readout. A clinical tile with nowhere to go raises a question the product refuses to answer, so most tiles should have one. With an `href` the tile renders a trailing chevron and underlines its label on hover and on keyboard focus, so a reader on a touch screen can see the tile is a door without hovering it. A static tile shows neither. ONE CONSTRAINT COMES WITH THE LINK, and it is named here because a product choosing a unit is the one who meets it. A link takes its accessible name from its content, and Value hides the unit SYMBOL from assistive technology and substitutes the spoken form. So a tile whose visible text reads \"kg\" is announced \"kilograms\", and the link's visible label shares no substring with its name. That is WCAG 2.2 SC 2.5.3, and this component cannot repair it: an `aria-label` would replace the whole sentence rather than mend one clause of it, so none is offered. It does not arise for a unit whose symbol and spoken form are the same word. It is recorded on the component's page rather than left to be discovered.",
      required: false,
    },
    "render": {
      type: "ReactElement",
      description: "The product's own router link element, rendered in place of the plain anchor while keeping the tile's `href`, its `data-slot=\"metric-tile\"`, its shape and its target floor on it. Pass a Next or React Router link here so a tap navigates client-side rather than reloading the page. Inert without an `href`, because the tile is a static readout with nowhere to go and nothing to route. WHY THE TILE TAKES THE SLOT RATHER THAN THE Link COMPONENT. Link is the seventh actions-and-forms component and the five action-bearing cards route their action anchors through it, but a tile is not one of those cases. Its anchor is a WRAPPER: it carries the tile's own `data-slot`, its shape and `text-inherit no-underline`, so the whole tile is one target and one object in the accessibility tree. Wrapping the tile in a `Link` would move `data-slot=\"link\"` onto a foreign root and put an action link's box around a whole card, so this file keeps its own anchor and takes the escape hatch `Field.Control` offers instead: the element is the tile, not a control inside it. The merge follows Link's: the tile's attributes win over the router element's and the class lists are joined so neither deletes the other.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for the number, its separators and the date. Passed through to Value and to RelativeTime together, so the reading and its timestamp cannot show two conventions on one tile. Omitted, the reader's own environment decides.",
      required: false,
    },
    "timeZone": {
      type: "string",
      description: "IANA time zone name, for example `\"Europe/London\"`, for the exact date the timestamp carries. Passed straight to RelativeTime, so the tile does not read it itself. Give the reader's own zone to put the reading on their wall clock; omitted, RelativeTime keeps the stored instant and labels its offset rather than guessing a zone. A name RelativeTime does not recognise is refused rather than approximated, on the same rule that governs it there.",
      required: false,
    },
    "showOffset": {
      type: "boolean",
      description: "Forwarded to the RelativeTime on the time line, which owns the offset label. A tile whose reading the reader's own device took passes `false`, because a zone that cannot differ from the reader's own is not worth naming and \"UTC+1\" is not a phrase a layperson reaches for. Omitted, RelativeTime's default stands and the offset is labelled, which is right for a reading that may have crossed zones. This component sets no default of its own and makes no such claim, because it cannot tell where the number came from, so the caller decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class passed here wins where the two conflict. That includes `truncate` and a fixed height, either of which can take digits off the end of a reading at 200% text. This component sets neither and never shortens a number on its own.",
      required: false,
    },
  },
  "RangeBarProps": {
    "label": {
      type: "string",
      description: "What was measured, in the reader's language rather than an internal code. It opens the summary sentence, so it reads as the subject of a sentence: \"Morning blood pressure is …\".",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The measurement. `null` is a first-class state meaning there is no reading, distinct from `0`, and renders the words rather than a tick at zero. A mark at the bottom of a range is a reading, and a missing one is not.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "Display symbol exactly as `tokens/units.json` spells it, as in \"kg\", \"mmol/L\" or \"mg/dL\". Every number this component renders goes through `Value`, which resolves the spoken form from that table, so a listener hears \"milligrams per decilitre\" rather than an improvised pronunciation.",
      required: true,
    },
    "range": {
      type: "ReferenceRange",
      description: "The range this reading is being compared with, and whose it is. Omit it entirely when none is available: the component then draws no band, says so in the summary, and substitutes nothing. `source` is required. A range with an empty one is reported as OPSIN-0004 and not drawn.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The level of attention the PRODUCT has assigned to this reading. RangeBar never derives it from position on its own bar: \"outside the range\" and \"needs attention\" are different claims. Omitted, the tick is drawn in a neutral tone and no level is stated, which is the correct rendering of \"no verdict has been made\" rather than a quiet \"nothing to see here\".",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "What the reading is ABOUT, for findability in a screen full of readings. It tints the label and nothing else: never the track, the band or the tick. Typed to the six rather than to `string`, because a component that accepts an arbitrary category accepts a seventh ramp that does not exist.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "DECIMAL PLACES, from the precision of the measurement. That is the resolution of the device, or the number of places the laboratory reported. Not significant figures: the same metric shown to a different number of decimal places at different magnitudes cannot be compared at a glance, which is what `health/numbers-units-precision` rule 2 forbids. It applies to the reading and to the two boundary labels alike, because a value and the bound it is being compared with are the same metric. It is required, so a TypeScript caller cannot ship a reading with no stated precision: an unstated precision is default float rendering, which `health/numbers-units-precision` rule 1 forbids anywhere. Required is not the same as defaulted. This component still invents no number of its own, because precision belongs to the metric rather than to the unit and nothing here could supply an honest one. The file ships as source into JavaScript projects, where a required prop is advice rather than a guarantee, so a caller who omits it there still gets the honest fallback, with nothing rounded and nothing padded.",
      required: true,
    },
    "measuredAt": {
      type: "string",
      description: "When the measurement was taken, ISO 8601. Rendered as a date in the footnote so that a number on a screen is not read as \"now\". Omitted, the footnote says that nobody knows when the reading was taken rather than saying nothing, because silence about a time is read as now. That is a recency signal, and it is not a staleness treatment. There is no `staleAfterHours` here and there will not be one: how old is too old is clinical, differs by metric, and opsinjs does not own it. A surface that needs a boundary wraps the reading in `RelativeTime`, which takes the boundary from you. A container that already states the instant itself can suppress this footnote sentence with `readingRecency=\"delegated\"`. See that prop.",
      required: false,
    },
    "readingRecency": {
      type: "\"state\" | \"delegated\"",
      description: "Who states when the reading was taken. Defaults to `\"state\"`, which is every existing caller's behaviour without exception: the footnote prints the reading's date, or prints that nobody knows when it was taken. `\"delegated\"` means the surrounding component states that instant itself, in view and in the accessibility tree, and takes responsibility for doing so; the bar then prints neither reading sentence. This exists to stop one card saying the same thing twice, not to make a number quieter about its age. A caller that passes `\"delegated\"` and then states nothing has removed a fact from the screen, which is the failure `measuredAt` exists to prevent. The one caller entitled to it is `ResultCard`, whose header carries the instant through `RelativeTime` with the absolute date always on screen. `measuredAt` is still passed under delegation, because it can feed an accessible name a container builds; it simply stops printing here.",
      required: false,
    },
    "summary": {
      type: "string",
      description: "Replaces the generated sentence. Use it for a unit whose phrasing does not fit the template, or for a reader whose language is not English. It cannot remove the sentence: there is no value of this prop that renders the component without one, because the sentence is the component.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for number separators, digit shapes and the dates in the footnote. Passed through to every `Value` this component renders, so one bar cannot show two conventions. This component renders on a server and again in a browser. With no locale the server formats with the host process's locale and the browser formats with the reader's, so where the two differ the number separators and the footnote date change under the reader on hydration and React reports a mismatch. Pass the locale the surface is rendered in, taken from wherever that surface already knows it. Omitting it does not hand formatting to the reader's own environment on the server; it hands it to the server's.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. A class passed here wins where the two conflict.",
      required: false,
    },
  },
  "RangeLegendProps": {
    "bands": {
      type: "RangeLegendBand[]",
      description: "The rows of the key, in the order the reader should meet them. Each names one tone a RangeBar draws: the neutral reference-range band, or one of the four clinical status levels. The words are yours, because the product owns the ranges those words describe; this component supplies none. An empty array renders nothing and is reported in development. A legend with no rows is a caption for a picture it forgot to name.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. A class passed here wins where the two conflict.",
      required: false,
    },
  },
  "ReadingInputProps": {
    "label": {
      type: "string",
      description: "The measurement, in the reader's words. Required, visible and persistent. A placeholder is not a label and disappears the moment somebody types. Put the unit in `unit`, not in here. The label names WHAT is being measured; a label reading \"Weight (kg)\" leaves readers who think in pounds typing pounds, with nothing on screen to stop them or to record what they meant.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "The unit shown beside the number, and the unit `value` and every segment's value are in. Required: a bare number in a health context is ambiguous between unit systems, and the same digits are one reading in mmol/L and a very different one in mg/dL. Use the display symbol exactly as `tokens/units.json` spells it, as in \"kg\", \"°C\" or \"mmHg\". The spoken form comes from that table, so a listener hears \"in kilograms\" rather than the letters. A symbol the table does not hold is spoken as written rather than pronounced by guesswork.",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The reading, in `unit`. Controlled: what you pass is what is shown, and a change reaches the screen only when you apply it. Omitted, or `null`, is an empty field. It is never a zero. Ignored when `segments` is supplied, because a compound reading has no single number.",
      required: false,
    },
    "segments": {
      type: "ReadingSegment[]",
      description: "A compound reading is two or more numbers that are one measurement, such as a blood pressure. Each becomes its own labelled box inside one named group, which is what makes them separately typable and separately announced. `numbers-units-precision` rule 11 says a compound value is DISPLAYED in its conventional form. That is 118/76 as one string, not two fields, and that rule is about display. This is entry, where `patterns/forms/units-and-numeric-entry` requires the opposite: separate fields under one legend, because asking somebody to type a solidus is asking them to format their own record. Both are right about their own half; the page says so.",
      required: false,
    },
    "onChange": {
      type: "(next: ReadingInputChange) => void",
      description: "Every change: a typed digit, a cleared box, a unit switch. There is no uncontrolled mode and no internal value. A caller that does not apply the change gets a field that will not accept typing, which is the ordinary behaviour of a controlled input rather than a fault.",
      required: true,
    },
    "units": {
      type: "string[]",
      description: "Units the reader may switch between. Two or more makes the unit a real control with its own name and a 44px target; fewer leaves it as text beside the number, which is where it has to be either way. Every pair the reader can reach should be one this system can convert: kg/lb/st and °C/°F are exact definitions and are converted for you. mmol/L and mg/dL are refused by name, because the factor is the molar mass of the substance being measured, which is a property of the substance and not of either unit. So a switch between them clears the entry and says so, and a product that needs it supplies its own arithmetic on `cause: \"unit\"`.",
      required: false,
    },
    "hint": {
      type: "string",
      description: "The shape of an answer, shown before anything is typed. Passed to `Field`, so it stays on screen when a warning appears. Write the SHAPE, never a bound and never a sample reading. \"Two digits\" or \"to one decimal place\" helps; \"for example 128\" hands the reader a plausible systolic to anchor on, and \"must be between 70 and 250\" is a threshold with no clinical owner presented as a rule the reader has broken.",
      required: false,
    },
    "warning": {
      type: "string",
      description: "An advisory sentence about what has been typed, in the product's own words. The product decides when to show it, because deciding when a number looks like a typing mistake needs bounds, and bounds are clinical and belong to whoever owns them. This component performs no comparison of any kind. What it guarantees is what happens to the sentence once you pass it: it is tied to the control's description so a screen reader reaches it, it does NOT mark the field invalid, it does not move focus, it does not clear the entry and it does not stop a form being submitted. The reader always wins the argument. Ask a question and offer the likely fix. Never \"invalid\", never \"error\", and never a bound for the reader to satisfy: most of the time they have typed exactly what they meant, and real readings fall outside plausible ranges precisely when they matter most.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the MEASUREMENT. That is the resolution of the instrument, or the places the laboratory reports. It is used for one thing only: rounding a number this component converted when the reader switched units. It never reformats, rounds or pads what the caller passed or what the reader typed, because rewriting digits underneath somebody's cursor is how a field loses a keystroke. Omitted, a conversion is not rounded at all and 5 kg becomes 11.023113109243878 lb.",
      required: false,
    },
    "name": {
      type: "string",
      description: "The form control name, put on every box. For a compound reading each box gets the name with its index appended, so the parts stay distinguishable in a `FormData`.",
      required: false,
    },
    "inputMode": {
      type: "\"decimal\" | \"numeric\"",
      description: "Which keypad appears. `\"decimal\"` for a measurement that can be fractional, `\"numeric\"` for one that cannot. Defaults to `\"decimal\"`: a decimal keypad can type a whole number and a numeric one cannot type a fraction, so the default is the one that fails safely.",
      required: false,
    },
    "enterKeyHint": {
      type: "\"done\" | \"enter\" | \"go\" | \"next\" | \"previous\" | \"search\" | \"send\"",
      description: "What the return key says it will do. Only the form around this knows.",
      required: false,
    },
    "optionality": {
      type: "\"required\" | \"optional\" | \"none\"",
      description: "Which state is marked, in words, inside the label. Passed to `Field`: mark the exception, because marking both is the same as marking neither.",
      required: false,
    },
    "disabled": {
      type: "boolean",
      description: "Disables every box and the unit switch.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout is the caller's.",
      required: false,
    },
  },
  "RelativeTimeProps": {
    "at": {
      type: "string",
      description: "ISO 8601 with an offset, as in `2026-03-14T08:12:00+01:00`. A timestamp with no offset is not a timestamp: it is parsed in whichever zone the code happens to be running in, and it is refused rather than guessed at.",
      required: true,
    },
    "event": {
      type: "TimeEvent",
      description: "Which event this instant belongs to. Named, never inferred: this is the difference between a fact and a guess, and it is the difference between when a reading was taken and when an app last spoke to a server.",
      required: true,
    },
    "now": {
      type: "string",
      description: "The instant the phrase is measured against, in the same form as `at`. Required, because a component that read the clock itself would be impure, would read it once per timestamp rather than once per screen, and would make a page of readings disagree with itself across a minute boundary. Read it once where the screen is rendered. Use `new Date().toISOString()` and pass the same value to every timestamp on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the staleness words and their muted treatment appear. Supplied by the product, because what counts as old is clinical and differs completely by measurement. There is no default: omit it and there is no stale treatment at all, which is the honest output when nobody has said what stale means here. Supply it and the timestamp always says something. Past the boundary it carries the words, and where the age could not be checked at all it carries the same words rather than falling silent.",
      required: false,
    },
    "absoluteAfterDays": {
      type: "number",
      description: "Days after which the exact date joins the relative phrase on screen. Defaults to one day, which is where content/numbers-dates-and-time keeps a relative phrase for recency and switches to the absolute date beyond about a day. Below the boundary a sighted reader sees the phrase alone; at or above it the date is shown beside the phrase so nobody has to count backwards from a phrase on its own. It is a legibility boundary and not a clinical one, and it never adds, removes or moves the staleness note. The exact date stays in the accessibility tree and in print at every age, so this prop moves only what is on screen. `0` is a first-class value: it means the date is shown beside the phrase at every age, including a reading only minutes old.",
      required: false,
    },
    "showAbsolute": {
      type: "boolean",
      description: "Whether the absolute date and time may appear on screen beside the phrase once the reading is older than `absoluteAfterDays`. The date is in the accessibility tree and in print either way, and a reading recent enough to be inside that boundary shows the phrase alone regardless. It defaults to true, because content/numbers-dates-and-time pairs relative with absolute beyond about a day and this component cannot see the surface it sits on. Pass `showAbsolute={false}` to keep the date off screen at every age: a timestamp inside a running sentence, or a dense list whose exact instant is already visible in the surrounding row, where the phrase alone is the point. The date stays in the accessibility tree and in print even then.",
      required: false,
    },
    "showOffset": {
      type: "boolean",
      description: "Whether the absolute time names the offset it was written in, as `UTC` or `UTC+1`. Defaults to true, because the component cannot see the reader's own zone and a reading taken abroad rendered as if it were local is the failure the specification's accessibility bullet is about. Pass `showOffset={false}` when the product knows the instant came from the reader's own device: content/numbers-dates-and-time names a zone only when it can differ from the reader's, and for a device measurement it cannot, so the label is then noise.",
      required: false,
    },
    "timeZone": {
      type: "string",
      description: "IANA time zone name, as in `Europe/London`, for the absolute date and time. Supply it and the reading is put on that zone's wall clock with no zone label, because it is then the reader's own clock and there is nothing to disambiguate. Omit it and the absolute time is the wall clock the reading was written in, with its offset named. A product that does not know the reader's zone must omit this rather than guess, because a guessed zone is a wrong time carrying a confident label, which is worse than an honest offset. An offset such as `+01:00` is not accepted here: offset zones are not portable across runtimes the way an IANA name is. Only a canonical IANA name Intl renders back as itself is used. Anything else, an unknown zone, an abbreviation like `BST` that Intl would silently resolve to a different place, or a legacy alias, is reported in development and falls back to the offset form rather than risk a confidently wrong wall clock.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the date and the phrase. It does not translate the event word. Those five are English, and the gap is documented rather than hidden behind a prop that would also let a caller relabel `synced`.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. The merge puts it last, so a conflicting class passed here wins: a type size or a colour set on the caller's side displaces the component's own. The one thing it cannot displace is the muted stale treatment, which is addressed at the parts rather than at the root for exactly that reason. See the class list on the root below.",
      required: false,
    },
  },
  "ResultCardProps": {
    "title": {
      type: "string",
      description: "What was measured, in the reader's language rather than an internal code. It is the card's accessible name and the card's heading, and it is the one part with no honest fallback.",
      required: true,
    },
    "titleLevel": {
      type: "2 | 3 | 4 | 5 | 6",
      description: "The heading level for the title, so the card fits the outline of the page it is on rather than imposing one. Appearance does not follow it: the type step is set explicitly, so an `h4` card and an `h2` card look identical.",
      default: "3",
      required: false,
    },
    "value": {
      type: "number | null",
      description: "The reading. `null` renders the absence form. That form is in words, never as `0` and never as a bare dash, because zero is a real measurement for several metrics and a missing one is not a measurement at all. Omit it only when the reading is compound and arrives through `segments`.",
      required: false,
    },
    "segments": {
      type: "ResultSegment[]",
      description: "A compound reading: two or more numbers that are one measurement, such as the pair in a blood-pressure result. Each segment is a real `Value`, so each is formatted, shaped and spoken like every other number in the system. When this is supplied, `value` is not read.",
      required: false,
    },
    "unit": {
      type: "string",
      description: "Display symbol exactly as `tokens/units.json` spells it, as in \"kg\", \"mmol/L\" or \"mmHg\". It reaches every number on the card, so one card cannot show two units. `Value` resolves the spoken form from that table, which is why a listener hears \"millimoles per mole\" rather than the symbol read out letter by letter, and why a unit the table does not hold is rendered as written rather than pronounced by guesswork.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "DECIMAL PLACES, from the precision of the measurement. That is the resolution of the device, or the number of places the laboratory reported. Not significant figures: the same metric shown to a different number of decimal places at different magnitudes cannot be compared at a glance. It reaches the reading, every segment of a compound one, and both boundary labels on the bar, because a reading and the bound it is compared with are the same metric. It is required, so a TypeScript caller cannot omit it and the omission that once printed a raw double is a compile error rather than a development warning. This file ships as source into JavaScript projects, where a required prop is advice and not a guarantee, so a value that still arrives without one is forwarded to `Value` unchanged and `Value` decides what an unstated precision does.",
      required: true,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for separators, digit shaping and the dates. It reaches every number and every instant on the card, so one card cannot show two conventions. Omitted, the reader's own environment decides.",
      required: false,
    },
    "timeZone": {
      type: "string",
      description: "IANA time zone name, as in `Europe/London`, handed straight through to `RelativeTime` for the absolute date and time. Supply it and the reading is put on that zone's wall clock with no zone label, because it is then the reader's own clock and there is nothing to disambiguate. Omit it and the absolute time is the wall clock the reading was written in, with its offset named. This card always shows the absolute time, so a wrong wall clock is most visible here: a product that knows the reader's zone should pass it, and one that does not must omit it rather than guess, because a guessed zone is a wrong time carrying a confident label. An offset such as `+01:00` is not accepted, and an unrecognised or ambiguous name falls back to the offset form; `RelativeTime` owns that guard and this prop only forwards.",
      required: false,
    },
    "measuredAt": {
      type: "string",
      description: "When the measurement was taken, ISO 8601 with an offset. The time of MEASUREMENT, never of retrieval, of sync or of render: a fetch timestamp here tells a reader their four-month-old reading was taken this morning. REQUIRED, AND WITH NO ABSENCE FORM. That is a known gap rather than a decision. Every other claim on this card degrades to a stated absence, and this one cannot: a card given `value={null}` still renders an instant at which that missing reading was measured. Do not invent one to satisfy the type. `RelativeTime`, which owns every instant in this system, has no absence form either, and inventing a sentence here would be a second copy of a rule that belongs there. Until it has one, a card whose reading is absent should not be given a measurement time the product does not have.",
      required: true,
    },
    "now": {
      type: "string",
      description: "The instant the card is being read against, in the same form as `measuredAt`. Required, because a component that read the clock itself would read it once per card rather than once per screen and make a page of results disagree with itself across a minute boundary. Read it once where the screen is rendered. Use `new Date().toISOString()` and pass the same value to every card on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the card shows its staleness treatment. The product owns this number because it is clinical rather than visual, and it differs completely by measurement. There is no default: omit it and there is no staleness treatment at all, which is the honest output when nobody has said what old means here.",
      required: false,
    },
    "range": {
      type: "ReferenceRange",
      description: "The interval this reading is being compared with, and whose it is. Omit it when there is none: the bar is then not drawn at all and nothing is substituted. Never defaulted, in any population, for any metric. It is drawn only where there is also a `unit` and a single `value`. A bar needs a scale, a scale needs a unit to be read in, and a compound reading has no single position on one line.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The level of attention the PRODUCT has assigned to this result. Never derived here from `value` and `range`, and the derivation is not missing. It is refused. Omitted, no pill is rendered and no level is stated, which is what \"nobody has made a judgement about this\" looks like rather than a quiet reassurance.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "What the reading is ABOUT, for finding the heart results among the sleep results. It tints the title and nothing else: never the card's surface, never the pill, never the bar. Typed to the six rather than to `string`, because a component that accepts an arbitrary category accepts a seventh colour ramp that does not exist.",
      required: false,
    },
    "meaning": {
      type: "ReactNode",
      description: "The plain-English paragraph: what the test looks at, what this result means in context, what usually happens next. Absent, the card says in words that there is no explanation rather than rendering nothing. Silence reads as reassurance, and it is the default nobody chose.",
      required: false,
    },
    "summary": {
      type: "string",
      description: "The one-line position sentence for the bar, handed straight through to `RangeBar`. It replaces the sentence the bar would generate from the reading and its interval, for a unit whose phrasing the template does not fit or a reader whose language is not English. It cannot remove the sentence: an empty string is refused by `RangeBar`, which renders its own line and reports the misuse rather than drawing a bar with no words. This is the BAR'S sentence, not the card's `meaning`. A product that wants the card to say less about the position says less here; deleting the explanation the reader came for is not what this prop is for, and it cannot do it. Omitted, the bar writes its own sentence, which is the default nobody has to choose. A replacement sentence replaces the attribution along with everything else. The generated sentence ends by naming whose interval this is, taken from `ReferenceRange.source`, and a supplied `summary` prints in its place and carries no attribution unless you write one into it. The card shows the source nowhere else, so a `summary` that omits it leaves a reading compared against an interval whose owner is named nowhere, which is the case `ReferenceRange.source` is required to prevent. State whose range it is inside the sentence you pass, or carry it in `provenance`.",
      required: false,
    },
    "actions": {
      type: "ResultAction[]",
      description: "The next steps, at most two. More than two is a screen rather than a card, and a third is dropped with a warning rather than rendered.",
      required: false,
    },
    "provenance": {
      type: "string",
      description: "Who measured it, with what device or assay, and where the range came from when that is not already on the bar. Rendered as the footnote. Omitted, there is no footnote: this component ships no default provenance and no default disclaimer. FREE TEXT, WITH NO PROVENANCE CLASS, AND THAT LIMITS WHAT A `status` HERE MAY MEAN. Data provenance and device accuracy sorts every value into four classes, which are clinically measured, device measured, device estimated and self-reported. It bounds what an interface may assert by the class: a device-estimated or self-reported value may not carry a clinical status on its own. This card cannot tell those apart, because nothing in the system carries the class yet. So the rule is the caller's to keep: do not pass a `status` derived from an estimated or self-reported value.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here. A card sets no width and no place in a grid, because those are decisions of the screen it is on. A class passed here wins where the two conflict, `truncate` included, which is the one way to make a reading come back to somebody with digits missing.",
      required: false,
    },
  },
  "ScoreDialProps": {
    "label": {
      type: "string",
      description: "What the score is called, in the reader's language. Not an internal code.",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The score. `null` renders the no-score state, which is not a score of zero: zero is a real result on many scales and an absent one is not a result. A value that is not a finite number is a third state again. It is a calculation that ran and failed, and it is announced as one.",
      required: true,
    },
    "min": {
      type: "number",
      description: "The scale's lower bound. Required: an unbounded dial is unreadable.",
      required: true,
    },
    "max": {
      type: "number",
      description: "The scale's upper bound. Required, and it is stated to the reader.",
      required: true,
    },
    "bands": {
      type: "ScoreBand[]",
      description: "The product's bands: contiguous, non-overlapping, covering the whole scale, each named and each with a source. opsinjs ships none and never supplies a default. An empty list renders the number with no band and says so, rather than inventing one.",
      required: true,
    },
    "status": {
      type: "DialStatus",
      description: "The level of attention this reading needs, assigned by the product from a reference range or a threshold the product owns. An INPUT, never a derivation: this component does not compare the score with anything and decide what it means, because it does not know the reader. Only `steady` and `watch` are accepted. `attention` and `urgent` are refused and reported, because both are defined as carrying a named action and a dial has nowhere to put one. Use CareCard or AlertBanner, which do.",
      required: false,
    },
    "derivation": {
      type: "string",
      description: "One sentence saying what went into the score and over what window. Required, and always rendered. A dial that cannot explain itself is a decorative authority claim, and Value is the honest component instead.",
      required: true,
    },
    "precision": {
      type: "number",
      description: "Decimal places for the score, from the product, and required here rather than optional as it is on Value. A composite score is arithmetic, so a fractional double is the ordinary case rather than the edge, and with nothing stated one IEEE 754 double prints as many as seventeen digits in a single tabular token that has no break opportunity, which is wider than a phone column at 200 percent text. Precision belongs to the metric and opsinjs invents no default, which is why the prop is required here rather than defaulted. The file ships as source into JavaScript projects, where a required prop is advice rather than a guarantee: a caller who omits it gets one console report and the number keeps the digits it arrived with.",
      required: true,
    },
    "coverage": {
      type: "{ available: number; expected: number }",
      description: "How much of the expected input the score was actually calculated from, as in `{ available: 4, expected: 6 }`. When it is short the dial says so on its face, because a reader has no other way to know that today's number rests on a third of the usual evidence. What was counted is the derivation sentence's job to name: this component does not know whether they were nights, readings or days.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the label, and nothing else. Never the track, the bands or the indicator. Those belong to the status axis, and one surface carries one axis.",
      required: false,
    },
    "calculatedAt": {
      type: "string",
      description: "When the score was calculated, ISO 8601. It renders on its own labelled line, and a dial that has a score but no instant says in words that nobody knows when it was calculated. It gets no staleness treatment and no relative phrasing: a relative phrase needs the instant to measure against, which this API does not carry, and a staleness window is a number opsinjs does not own for any metric. A caller who needs \"2 hours ago\", or needs an old score to LOOK old, renders a RelativeTime beside the dial and passes it one `now` for the whole screen. This prop is not `measuredAt`: nothing here was measured.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for every number and the date. Omitted, the reader's own environment decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root, and a class passed here WINS over the component's own where the two conflict. That includes `truncate`, `sr-only`, a zeroed type size and any fixed height. The band name, the scale and the derivation are mandatory content that no prop of this component removes, and a class that clips or hides them is the one way left to remove them anyway. The accessible sentence on the arc would survive; the words a sighted reader needs would not.",
      required: false,
    },
  },
  "SegmentedControlProps": {
    "options": {
      type: "SegmentedControlOption[]",
      description: "The options, in the order they appear. Two or more: a control offering one option is not a choice, and a control offering none has nothing to render. Each option is a value, a visible label and an optional `disabled` flag.",
      required: true,
    },
    "value": {
      type: "string",
      description: "The currently chosen value, matching one option's `value`. This is a controlled component with no internal selection state, so a `value` that matches no option renders the row with nothing chosen, and a development warning names it.",
      required: true,
    },
    "onValueChange": {
      type: "(value: string) => void",
      description: "Called with the new value when the reader chooses a different segment. The caller stores it and passes it back as `value`; the control keeps no state of its own.",
      required: true,
    },
    "label": {
      type: "string",
      description: "Required. The accessible name for the group, applied as `aria-label` on the radiogroup, so a screen-reader user hears what the row selects before its options. Name the parameter the row sets, \"Chart window\" rather than \"day, week, month\". There is no default, because a guessed name would describe the wrong thing on most screens.",
      required: true,
    },
    "size": {
      type: "\"sm\" | \"md\"",
      description: "Visual weight only. `md` sets the label at the headline step; `sm` is narrower and a step quieter. Both clear the target floor, so `sm` is never shorter. Defaults to `md`.",
      required: false,
    },
    "fullWidth": {
      type: "boolean",
      description: "Fills the width of its container, with the segments sharing it equally. For a control that spans a card or a toolbar. Defaults to `false`, where the row is only as wide as its options.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root track. Width, margin and place in a layout belong here. A class you pass wins over the track's own where the two conflict, because it is merged last.",
      required: false,
    },
  },
  "SheetContentProps": {
    "children": {
      type: "ReactNode",
      description: "Everything that scrolls.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the scrolling region. The region's own classes win where they conflict, and the two that must not be overridden are the ones that make it a scroll boundary at all.",
      required: false,
    },
  },
  "SheetDescriptionProps": {
    "children": {
      type: "ReactNode",
      description: "The sentence the reader weighs before they answer.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the paragraph.",
      required: false,
    },
  },
  "SheetProps": {
    "open": {
      type: "boolean",
      description: "Whether the sheet is on screen. Required and controlled: a modal surface that owned its own visibility would be a surface a product could not close when the data underneath it changed.",
      required: true,
    },
    "onOpenChange": {
      type: "(open: boolean, route: SheetDismissRoute) => void",
      description: "Called when the sheet asks to open or close. The second argument says which route was taken: `close-control` for the header's close button, `scrim` for a tap on the background, `escape` for the escape key or the platform's back gesture, `drag` for a swipe down, and `other` for anything else, including a close the product asked for itself. The sheet does not close itself: `open` is the only thing that closes it. That is what makes \"ask before discarding unsaved input\" possible. Leave `open` alone, show the confirmation, and close when the reader answers.",
      required: true,
    },
    "title": {
      type: "string",
      description: "The sheet's accessible name, and a visible heading. Required: an unnamed modal surface is announced as \"dialog\" and nothing else, which tells a screen-reader user that something has taken the screen and not what.",
      required: true,
    },
    "detents": {
      type: "Detent[]",
      description: "Rest positions, in order; the first is where the sheet opens. A single entry disables drag-between-detents, which is the common case and the default. `\"content\"` is supported only on its own. It is not a snap point but the absence of one: the sheet takes its own height, up to the full viewport, and the browser lays it out. `\"half\"` and `\"full\"` are fractions of the viewport and can be combined; passing `\"content\"` alongside either drops it with a development warning, because a sheet that can reach the full screen is already as tall as the screen and has no content height to return to.",
      default: "[\"content\"]",
      required: false,
    },
    "modal": {
      type: "boolean",
      description: "Traps focus, marks the page behind `aria-hidden`, and lets the scrim stop a pointer. Be exact about the mechanism: the primitive marks everything outside the portal `aria-hidden=\"true\"` rather than setting the HTML `inert` attribute, so the page behind is hidden and unreachable but it is NOT inert. The difference is observable, because focus moved programmatically from behind the sheet takes and keeps focus on a control the accessibility tree has just been told is not there. A modal sheet is also the only state in which the sheet takes focus on appearance: `modal={false}` does none of this, so it opens where the reader can see it and leaves the caret exactly where they left it. A non-modal sheet has no accessibility story on this page beyond that sentence. It is pinned to the bottom edge while the page behind stays focusable, which is the obscured-focus shape WCAG 2.4.11 is about, and nothing here has been checked against it.",
      default: "true",
      required: false,
    },
    "dismissible": {
      type: "boolean",
      description: "Whether the scrim, the escape key and a downward drag close the sheet. Set it `false` for a form, where each of those three is an accident waiting to throw away what somebody typed. It never removes the close control in the header: a modal surface with no way out is a trap, and the one surface that legitimately has no \"went away\" outcome is a `Dialog`.",
      default: "true",
      required: false,
    },
    "footer": {
      type: "ReactNode",
      description: "The pinned action area. A prop rather than a compound part because a prop can carry it, and because the pinning is the point: the footer sits outside the scrolling region, above the software keyboard and above the safe-area inset, so the primary action cannot be scrolled away from or covered.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the sheet's container, and last in the list, so it wins. The sheet is full width on a phone and no wider than the comfortable body measure above the `sm` breakpoint, because the system's own doctrine caps the reading measure on every surface. Left uncapped, a 1024px sheet puts roughly 120 characters on a line and turns a footer action into a 984px bar. The cap is a default rather than a lock: a product that wants the sheet wider or narrower on a large display sets a `max-w` here and this class overrides the default.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "What the sheet holds. Usually a single `Sheet.Content`, which is the scrolling region; anything placed beside it does not scroll.",
      required: true,
    },
  },
  "SkeletonProps": {
    "shape": {
      type: "\"text\" | \"line\" | \"block\" | \"circle\"",
      description: "The shape being stood in for. There is deliberately no \"value\", \"dial\" or \"bar\" member: a placeholder shaped like a measurement asserts that a measurement is coming, and sometimes none is. A value outside the four resolves to `text`, which is the shape that claims least.",
      required: false,
    },
    "lines": {
      type: "number",
      description: "Number of lines for the text shape, ignored by the other three. The last is rendered shorter, the way a paragraph's last line is. Defaults to 3. The count is repaired at both ends rather than trusted: a value below 1 is raised to 1 rather than rendering a group that reserves no space at all, and a value above 24 is lowered to 24. No paragraph a skeleton stands in for has more lines than that, and an unbounded count allocates an unbounded array during a server render.",
      required: false,
    },
    "appearAfterMs": {
      type: "number",
      description: "Delay in milliseconds before the skeleton appears. Content that arrives faster than this never shows one, which removes the flash. Implemented in CSS, so it holds before hydration and with JavaScript switched off.",
      required: false,
    },
    "shimmer": {
      type: "boolean",
      description: "Movement is a preference, never a signal. It does not encode progress, it does not speed up, and it is suppressed under `prefers-reduced-motion`, which leaves the static tint behind. On by default: a motionless grey rectangle reads as content that did not arrive at least as readily as it reads as content that is arriving. The movement runs twice and then stops, which is under the five seconds past which WCAG 2.2 SC 2.2.2 asks for a page-level pause, stop or hide mechanism that no single component owns. After the second cycle the static tint remains, which is the same end state `shimmer={false}` gives from the first frame, so pass `false` to start there.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. This is where the size of what is coming goes, and it is expected rather than exceptional: the component knows the vocabulary of shapes and the caller knows the content.",
      required: false,
    },
  },
  "SourceCitationProps": {
    "source": {
      type: "ReactNode",
      description: "Where this piece of health information came from, in the reader's own plain words: \"from your cuff\", \"estimated by your watch from movement and heart rate\", \"you entered this\". It renders inline content rather than a block element. THERE IS NO DEFAULT AND THERE WILL NOT BE ONE. Provenance shipped from a design system attributes a reading to an instrument the product may not own, and it arrives looking checked because it came from a library. Supply none and the citation says on screen that none was supplied, rather than inventing a source. `false` from a `&&` branch, `0` from the same branch on an empty collection, an empty array and a whitespace-only string all count as supplying none. The boundary is words: a caller who wraps the provenance in an element is taken at their word, so an empty string inside a `<strong>` is the one route to a silently sourceless citation. TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape `DisclaimerNote.children` has. Marking it required buys nothing, because `{reading.source}` with an undefined `reading.source` type-checks either way. It costs the ability to render the missing state at all, which is the state a product is most likely to ship by accident and the one that most needs seeing.",
      required: false,
    },
    "more": {
      type: "{ label: string; href: string }",
      description: "The fuller citation, for readers who want it: a manufacturer's accuracy document, a reference range's own source, a study you have read. This is where rule 6 of data provenance lands. A manufacturer's accuracy claim is attributed and linked here rather than restated as the product's own, and it is never paraphrased into a stronger claim. BOTH HALVES TOGETHER, and that is why this is one object rather than a bare href. A destination with no label would need a label written here, and the label this system would have to invent is exactly the one the requirement refuses: \"learn more\" names nothing, and a screen reader's list of links is where that costs somebody the citation they were looking for. The product names its own destination in its own words. `more` mirrors `DisclaimerNote.more` for that reason.",
      required: false,
    },
    "checkedOn": {
      type: "string | number",
      description: "When this provenance was last checked, as a calendar date. A string is a strict `YYYY-MM-DD`; a number is epoch milliseconds. It renders as a plain date in the reader's locale, pinned to UTC so the day does not drift, inside a `<time>` element that carries the machine date. There is no live timer and no clock read: a date not supplied is a date not shown, and a value that is not a real calendar date is refused rather than rendered as a plausible wrong one. It is not a freshness verdict. This component holds no staleness boundary and says nothing about whether the source can still be relied on; it reports the date the product recorded and no more. Deciding a source is out of date belongs to the product.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the last-checked date, as in `en-GB`. It formats the date and nothing else, because the source words and the link label are the product's own text in the product's own language and this component neither writes nor translates them. Omit it and the date takes the runtime's default locale, which on a server is the server's language rather than the reader's. A malformed tag is reported in development and falls back to that default.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Width, margin and place in a layout belong here: they are decisions of the surface the citation stands on rather than of the citation. It is also the one hole in this component's refusal to carry a colour, and the component says so rather than pretending otherwise: a utility from either axis passed through here reaches the root, and in development it raises a warning naming what to use instead.",
      required: false,
    },
  },
  "StatusPillProps": {
    "status": {
      type: "ClinicalStatus",
      description: "Required. There is no neutral default and no \"unknown\" level.",
      required: true,
    },
    "label": {
      type: "string",
      description: "Overrides the default word for this level. Use it for translation, or for a product whose readers use different language. It may not change the meaning, and it may not be an empty string. A banned word in `label` raises OPSIN-0006 once in development. The list is `BANNED_WORDS` in the substrate (\"normal\", \"healthy\", \"good\" and the rest), matched case-insensitively on word boundaries. The component renders the label anyway, because the product owns its copy; the warning names the word and its replacement so the copy can be fixed at source.",
      required: false,
    },
    "size": {
      type: "\"sm\" | \"md\" | \"lg\"",
      description: "Visual weight only, and it changes exactly two things: the type step the word and its glyph are set at, and the padding around them. Every size renders icon, word and colour, and none of them drops the word. `lg` exists so a pill composed inside a heading can carry the heading's own step rather than sitting a step below the sentence it qualifies.",
      required: false,
    },
    "describes": {
      type: "string",
      description: "What the pill applies to, for the accessible name: \"HbA1c result\". Without it a screen-reader user hears a level with no subject. Pass it when the pill is read on its own: a table cell reached by column navigation, a card corner, or any pill that floats free of its subject. Do not pass it when the subject is visible text in the same reading unit, such as a list item whose row already names the measurement. The subject rides an sr-only span appended inside the pill, so there a screen reader would read the subject once as visible text and then a second time inside the pill.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class you pass WINS over the pill's own where the two conflict: `cn(…, TONE[status], SIZE[size], className)` puts yours last and `twMerge` keeps the later of a conflicting pair. That includes the level's fill and its boundary. A class that removes either of them leaves the word and the glyph carrying the status on their own, so if you need the pill to sit quietly in a dense row, change `size` rather than stripping the surface. THE INK IS THE ONE EXCEPTION, and the comment above `TONE` says why: it is written as the arbitrary property `color:var(--opsin-status-<level>-ink)` in square brackets, so `tailwind-merge` does not file it against a `text-*` class, and a `text-*` class you pass does not replace it. It is spelled out that way here because Tailwind's scanner reads comments too, and a bracketed candidate with a `<level>` placeholder in it compiles to CSS that does not parse. Both declarations are emitted and source order decides. Recolour it with a rule of your own on `[data-slot=\"status-pill\"]` instead. Read `tokens/color.json` first, because the ink you would be replacing is the half of the pairing that was tuned to stay legible on the surface underneath it.",
      required: false,
    },
  },
  "StepperProps": {
    "steps": {
      type: "StepperStep[]",
      description: "The steps, in the order the reader moves through them. Two or more: one step is not a sequence and nothing is a sequence with none. Each step is a short `label` and an optional `description`. The order here is the order drawn, so order the steps the way the reader progresses, not the way a table stores them.",
      required: true,
    },
    "current": {
      type: "number",
      description: "The 0-based index of the step the reader is on now. Every step before it is drawn complete, the step at this index is drawn current and carries aria-current=\"step\", and every step after it is drawn upcoming. This is a value the product passes from a flow it owns; the component keeps no state. A value outside the range, or a non-integer, is truncated and clamped to the nearest real step and a development warning names it, because a progress indicator that renders nothing is useless.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the root list. Width, margin and place in a layout belong here. A class you pass wins over the list's own where the two conflict, because it is merged last.",
      required: false,
    },
  },
  "SurfaceProps": {
    "rung": {
      type: "MaterialRung",
      description: "Which rung of the material ladder. Required: there is no sensible default depth, and a component that guessed would put a surface at the wrong height silently. The names are the token names: `canvas`, `card`, `raised`, `sheet`, `overlay` and `scrim`.",
      required: true,
    },
    "opaque": {
      type: "boolean",
      description: "Renders the rung's opaque fallback regardless of engine or preference. A reviewer needs this to see the degraded path without changing an operating system setting, and print and export need it so that a translucent tint is never composited against paper. The exception to name is its reach: the prop changes the tint and the alpha and nothing else. On paper the boundary reaches paper whatever the settings, because the edge is drawn as an outline rather than a box-shadow and a printer keeps an outline, and the rounded geometry reaches it with the boundary. The fill is a separate question with two owners. The theme layer's print block in `app/product.css` decides what colour the fill would be on paper, carrying the rung to its opaque tint; whether the fill prints at all is the reader's own background-graphics setting, which a browser leaves off by default. Setting this prop is therefore not by itself the whole print path: this component owns only whether its own boundary is drawn with a property a printer keeps.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Shape belongs here: Surface sets no corner of its own, and every layer inside it inherits whatever radius the caller applies. It is also unrestricted, so it is the one prop through which a caller can put colour on a Surface, and the two-colour-axes rule applies to it in full: a Surface may take a category tint or sit under a status, never both. A category-tinted Surface renders its status as a StatusPill inside it rather than as a tint on the root. Both axes on one element is OPSIN-0001, and this component cannot detect it. `cn` merges whatever it is handed.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Everything the surface holds.",
      required: true,
    },
  },
  "TabBarProps": {
    "items": {
      type: "TabBarItem[]",
      description: "The destinations, in the order they appear. Two to five: one destination is not navigation, and a persistent bar with more than five stops no longer reads as one glanceable set. Each item is a key, a label, an icon and an optional href. A count outside two to five raises a development warning and still renders, so the mistake is visible rather than silent.",
      required: true,
    },
    "value": {
      type: "string",
      description: "The key of the current destination, matching one item's key. This is a controlled component with no internal selection state, so a value that matches no item renders the bar with no destination current, and a development warning names it.",
      required: true,
    },
    "onValueChange": {
      type: "(key: string) => void",
      description: "Called with the chosen destination's key when the reader picks a different one. Optional, because a bar built from links can leave navigation to the href alone. When present, the caller stores the key and passes it back as value; the bar keeps no state of its own.",
      required: false,
    },
    "label": {
      type: "string",
      description: "Required. The accessible name for the nav landmark, applied as aria-label, so a screen-reader user hears what the bar navigates before its destinations. Name what the bar moves between, \"Main sections\" rather than \"navigation\". There is no default, because a guessed name would describe the wrong thing on most screens.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the Surface root. Position belongs here: a product pins the bar with something like \"fixed inset-x-0 bottom-0\" through this prop, and the bar itself sets no position of its own. A class you pass wins over the root's own where the two conflict.",
      required: false,
    },
  },
  "TableProps": {
    "caption": {
      type: "string",
      description: "The caption naming what the table holds. Required, and required for accessibility rather than for looks: a screen reader user who lands on a grid of numbers with no caption has no idea what they count. It renders as a real caption element, and captionHidden can take it off the screen but never out of the markup. A string, so it can serve as the visible or the visually hidden caption text without a second prop.",
      required: true,
    },
    "captionHidden": {
      type: "boolean",
      description: "Take the caption off the screen while leaving it in the accessibility tree, for the twin that sits under a heading already naming the data. It uses the sr-only pattern, so the caption is still present and still read. Default false: a table on its own keeps its caption visible.",
      required: false,
    },
    "columns": {
      type: "TableColumn[]",
      description: "The columns, left to right. Each has a stable key, a header node, an optional alignment and an optional numeric flag. A numeric column right-aligns and renders tabular figures. An empty array renders nothing and warns, because a table with no columns is a caller mistake rather than an empty result.",
      required: true,
    },
    "rows": {
      type: "Array<Record<string, ReactNode>>",
      description: "The rows, each a record keyed by column key to the node for that cell. A key with no value renders an empty cell rather than warning, because sparse rows are legitimate. Zero rows renders the header over an empty body; for a genuinely empty result reach for EmptyState instead, which says so in words.",
      required: true,
    },
    "rowHeader": {
      type: "boolean",
      description: "Treat the first column as each row's header cell, a th scope=\"row\", so a screen reader names every row by its first cell. Default true, because in a chart twin the first column is the period or the category that identifies the row. Pass false when the first column is data rather than a label, and every cell becomes a plain td.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the scroll container with tailwind-merge, and a class you pass wins where the two conflict. This is where a max width or a top and bottom border goes.",
      required: false,
    },
  },
  "TermGlossaryProviderProps": {
    "glossary": {
      type: "readonly GlossaryEntry[]",
      description: "Every term this subtree can name. Hoist it to a module constant: it is rebuilt into a lookup whenever its identity changes, and an array literal written inline in JSX is a new identity on every render. It may be handed straight across the server/client boundary. A plain array of plain objects is serialisable, so the definitions can be read from a file on the server and never reach the browser as code.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      required: true,
    },
  },
  "TermProps": {
    "id": {
      type: "string",
      description: "The glossary key. Resolved against the glossary supplied by <TermGlossaryProvider>. `term.mdx:132-134` asks for an unknown id to be a build error. A component cannot fail somebody else's build from inside a render, so what happens instead is stated rather than implied: the word is rendered unmarked, no affordance is drawn, and development gets a warning naming the id. Marking a word whose explanation does not exist is the one outcome that is worse than leaving it plain. The build-time half of that promise belongs in a lint rule over the product's own source, and it does not exist yet.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "The word as it should read in this sentence, where a plural, a tense or a capitalisation makes it differ from the glossary's headword. It changes what is printed and nothing else: the definition and the expansion still come from the entry, and so does the spoken form of an abbreviation, which is appended to the control's name rather than replacing what is written there. Every path that can render prints it when a call site supplied it, because the author's sentence is the only grammatical one available and a runtime cannot rewrite it. A `plain-only` entry is the case where doing so is a contradiction rather than a convenience: `children` is where a call site writes the clinical word inflected for its sentence, and that entry's whole content is that the clinical word is never shown, so the component renders the children and warns loudly in development that the two disagree. Only when no children are supplied does that path fall back to the entry's plain wording. An `id` that is not in the glossary prints children gratefully, because there it is the only real word available and without it the raw key appears in the sentence instead.",
      required: false,
    },
    "present": {
      type: "\"auto\" | \"inline\" | \"disclosure\"",
      description: "How the definition is presented. `inline` puts it in parentheses after the word; `disclosure` puts it behind a control. `auto` chooses by the length of the definition. There is no `hover` value, on purpose. A hover-only definition does not exist on a phone, does not exist for a keyboard, and is unreliable for anybody with a tremor.",
      default: "\"auto\"",
      required: false,
    },
    "once": {
      type: "boolean",
      description: "Suppress the repeat. Set it on the second and later appearances of a term on one surface: the word is still marked, the definition is still one press away and still in the accessibility tree, and it is not printed again on screen or on paper. opsinjs does not count the appearances for you. It cannot see where one surface ends and the next begins, and a component that guessed would either repeat itself down a page or silently drop a definition the reader had not yet met. Repetition is noise and absence is a barrier; this is the compromise, and the caller is the only party that can make it.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here; the mark, the control and the definition's own treatment do not, because each of them is an accessibility claim this component makes on the page.",
      required: false,
    },
  },
  "TimelineEntryProps": {
    "when": {
      type: "string",
      description: "When the event was recorded, as ISO 8601 with an offset, for example `2026-03-14T08:12:00+01:00`. It is handed to the composed RelativeTime as its `at`, so the same contract applies: a timestamp with no offset is read in whichever zone the code is running in and is refused rather than guessed at, and a string that cannot be parsed renders no relative phrase.",
      required: true,
    },
    "now": {
      type: "Date | number | string",
      description: "The instant the recorded time is measured against, as a Date, a number of milliseconds since the epoch, or an ISO 8601 string. Required, because this component never reads the clock: a Date or a number is normalised to an ISO string before it reaches RelativeTime, and a string is passed straight through so RelativeTime applies its own offset rule. Read the clock once where the screen is rendered and pass the same value to every entry on it.",
      required: true,
    },
    "title": {
      type: "string",
      description: "What happened, in the reader's words: `Repeat prescription issued`, `Blood test booked`. Required. An empty title is reported in development and the entry still renders, because the product owns its copy, but an entry with a time and no event beside it is a marker on a rail that says nothing.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "The body of the entry: any detail the product wants beneath the title. It takes colour from neither axis and is the product's own content. Omit it and the entry is a time and a title.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The clinical status the product assigned to this event, from the four-level union shared across the system. It is rendered as a nested StatusPill beside the title, never as a tint on the entry, the rail or the marker. It is an input the product owns and is never derived here. Omit it and no pill is rendered. A value outside the four is refused by StatusPill itself.",
      required: false,
    },
    "isLast": {
      type: "boolean",
      description: "Whether this is the last entry, which stops the connector line below the marker so the rail does not trail past the final event. Defaults to false. The product sets it on the last item of the list it owns.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root list item with `tailwind-merge`, last, so a conflicting class passed here wins. The entry's own chrome is neutral by design; a class that tints it is the caller's decision and the two colour axes gate reads the component source rather than a caller override.",
      required: false,
    },
  },
  "TrendSparklineProps": {
    "label": {
      type: "string",
      description: "What was measured, in the reader's language. It names the subject in the plot's accessible name, which is otherwise a description of a line with no subject. It is deliberately not drawn: the anatomy has no label part, and the surface a sparkline sits in has already said what it is about.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "Unit symbol as `tokens/units.json` spells it, such as \"bpm\", \"mmol/L\" or \"steps\". Every reading in the caption is rendered through `Value`, which resolves the spoken form from that table so a screen reader says \"millimoles per litre\" rather than improvising.",
      required: true,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the measurement. That is the resolution of the device, or the number of places the laboratory reported, and never a number chosen at render time. Required, so a TypeScript caller cannot omit it: a reading that arrived from arithmetic can carry seventeen digits, and a caption is exactly where those show. Forwarded untouched to every `Value` this component renders. A JavaScript caller who omits it gets the digits it was handed plus a development warning from `Value`. The caption also prints the band bounds the caller supplied on `range`, and this same precision is applied to them as well as to the readings. A bound stated to more places than the measurement carries is therefore shown rounded to this precision rather than to its own, so a product whose source range is finer than its reading precision should state that range in the precision it was given.",
      required: true,
    },
    "series": {
      type: "TrendPoint[]",
      description: "The readings, in chronological order. A gap is an explicit entry with `value: null`, never an omitted one: an entry missing from the array is one this component cannot know about, and a line drawn straight through it asserts a measurement nobody took. An entry whose value is a number but not a finite one is a failure rather than a gap, is counted and described as one, and is not drawn.",
      required: true,
    },
    "minimumPoints": {
      type: "number",
      description: "How many real readings there must be before a line may be drawn at all. Required, with no default, and the omission is the point. How many readings make a trend depends on what was measured, how often it is measured and who is reading it. That is a number opsinjs cannot know and must never guess. Below it this component draws nothing and says so, naming your number and the count it actually has.",
      required: true,
    },
    "window": {
      type: "string",
      description: "The period the series covers, as the reader should see it, such as \"the last 14 days\". A display string rather than a duration, which has a consequence worth knowing: the x-axis is the extent of the series you passed, not the extent of this period, so two sparklines are only comparable side by side when their series cover the same span.",
      required: true,
    },
    "changeThreshold": {
      type: "number",
      description: "The smallest difference this metric counts as a change, in the reading's own unit. There is no default, and without it the caption names no direction. A metric declares the difference below which a series is presented as unchanged; below that noise floor \"about the same\" is the true sentence. Supplied, the caption reads \"Up, from … to …\"; omitted, it prints both endpoints and stops, and the accessible name says \"with no clear direction\". Zero is a legitimate value and means your metric counts any difference at all. It still has to be your product saying so, not this file.",
      required: false,
    },
    "range": {
      type: "ReferenceRange",
      description: "An interval to shade behind the line, in neutral tones. Never status-coloured, and never invented: omit it and no band is drawn. Its `source` is required and is named in the caption, because a shaded band with no owner is an assertion with no author. A band is drawn only when BOTH bounds are present and the lower is below the upper. A one-sided range is stated in the caption as words such as \"10 steps and above\", and it is drawn as nothing, because the missing edge would have to come from the data or from zero and would then be attributed to your source.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the line so it is findable in a grid of six. It is identity, not meaning: in greyscale the tint is lost and nothing else is.",
      required: false,
    },
    "caption": {
      type: "string",
      description: "Your own sentence, in place of the composed one. Use it when you have a cadence, a phrasing or a comparison this component cannot know about. It replaces the direction-and-magnitude sentence. It does not replace the coverage clause (how many readings there are and what is missing), the clause naming a marked reading, or the clause naming a range's source. Those are appended either way, because a count of absent measurements, a status and an attribution are not decoration. Where there are too few readings to draw, your sentence is appended to the refusal rather than replacing it: the refusal is the one sentence that explains why there is no picture.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for number separators, digit shapes and the date in the caption. Passed through to every `Value` this component renders and used for the plot's accessible name, so the spoken name and the printed sentence cannot show two conventions. Omitted, the reader's environment decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class you pass wins where the two conflict. That includes `hidden` and `sr-only`, and it includes a variant that targets the caption's `data-slot`: this prop reaches the whole subtree, and a caller who hides the caption hides the text twin. Nothing in this component prevents it and no gate checks for it.",
      required: false,
    },
  },
  "ValueProps": {
    "value": {
      type: "number | null",
      description: "The reading. `null` renders the absence form and is never rendered as 0: zero is a real measurement for several metrics, and a missing one is not a measurement at all.",
      required: true,
    },
    "unit": {
      type: "string | null",
      description: "Display symbol, exactly as `tokens/units.json` spells it, such as \"kg\", \"mmol/L\" or \"°C\". The spoken form is resolved from that table, so this is the only place a unit is named. A symbol the table does not hold is rendered as written rather than pronounced by guesswork. Three states, and they are distinct on purpose. `undefined` means nobody said, which is the ambiguity OPSIN-0003 fires about: the same digits are one reading in mmol/L and a very different one in mg/dL. `null` means this number has no unit by design, which a composite score, a count already named by its label, or a ratio all are, and it renders the digits alone and warns about nothing. A string is the symbol.",
      required: false,
    },
    "unitDisplay": {
      type: "\"symbol\" | \"spoken\"",
      description: "Where the unit is shown. The default is `symbol`, which prints the symbol beside the number and speaks the words in the accessibility tree, the form every reading has always taken. `spoken` keeps the unit in the accessibility tree and takes it off the screen, for the one case where the visible sentence already prints the unit once for a pair of readings, as \"10 to 20 mg/dL\" does. A screen reader still hears \"10 milligrams per decilitre\" so no reading is spoken bare. It is never a way to render a number with no unit at all, which is what OPSIN-0003 exists to prevent, so it is meaningless without `unit` and reports itself when it is asked for with none.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the MEASUREMENT, which is the resolution of the device, or the number of places the laboratory reported. Never chosen at render time to make a column line up. A whole number from 0 to 20. Required, and required rather than defaulted on purpose. There is no per-unit default to fall back on: precision is a property of the metric and not of the unit, and two metrics reported in the same unit do not share one, so the honest place for the number is the caller's, and the honest place for the omission is a compile error. A TypeScript caller that forgets it does not ship a raw double to a reader; it fails to build. The type is a guarantee only where TypeScript is enforced. This file ships as source into JavaScript projects, where a required prop is advice, so a caller who omits it there prints the digits the double happened to hold. The component then rounds nothing and pads nothing and warns in development, naming the unit and the count of unasked-for digits. The warning is the honest signal, because there is no number this file could supply in place of the one nobody stated.",
      required: true,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for separators and digit shaping. Distinct from `unit`: locale decides how a number is written, unit systems decide which number. Omitted on the client, the reader's own environment decides. Under server rendering there is no reader's environment, so the server process's own default formats the first paint. A de-DE reader then sees \"1,000.2\" before hydration and \"1.000,2\" after it, with a React text mismatch in between, and rule 10 of `health/numbers-units-precision` is about exactly that confusion of separators being a hundredfold error. On any surface that renders on a server, pass `locale` explicitly, from the request or from the reader's stored setting. A tag `Intl` cannot parse, such as \"en_GB\" with an underscore, is reported in development and ignored, and the runtime's default formats the number, because a malformed setting must not take a screen down.",
      required: false,
    },
    "absenceLabel": {
      type: "string",
      description: "What the absence form says when there is no reading. The default is \"no reading yet\". It is not used for a number that arrived broken, which is a different thing and says so in different words. An empty string falls back to the default and reports itself. The absence form is words and nothing else, so an empty label would leave an empty element where a reader expects to be told something.",
      required: false,
    },
    "size": {
      type: "\"inherit\" | \"display\"",
      description: "Visual weight. Never changes the value, the precision or the unit.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class you pass WINS over the component's own where the two conflict. `cn(\"inline tabular-nums\", …, className)` puts yours last and `twMerge` keeps the later of a conflicting pair. That was verified: `twMerge(\"inline tabular-nums\", \"block truncate\")` returns `\"tabular-nums block truncate\"`. That includes `truncate` and any fixed height. This component never shortens a number on its own and sets no ellipsis and no height; passing a class that does is the one way to make a reading come back to somebody with digits missing off the end.",
      required: false,
    },
  },
  "VisuallyHiddenProps": {
    "children": {
      type: "ReactNode",
      description: "The words to announce. They are read by assistive technology and drawn nowhere. Give a control the name its icon stands for, or a repeated link the subject a sighted reader gets from the layout around it. Do not place a focusable control in here: an always-hidden control is a keyboard trap, and a control that must appear on focus is a skip link, which is a different pattern. Empty children announce nothing and raise a development warning.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the span. It is rarely needed, because the component's whole treatment is the clip and there is nothing visible to style. Use it to position the span when it must sit at a particular point for a control's accessible name to compose correctly, not to make any of it visible: a class that unclips the content defeats the component.",
      required: false,
    },
  },
}

/** Interface name to the file it is exported from, relative to apps/www. */
export const PROPS_SOURCES: Record<string, string> = {
  "AlertBannerProps": "registry/bases/base/alert-banner.tsx",
  "AvatarProps": "registry/bases/base/avatar.tsx",
  "BodyMapProps": "registry/bases/base/body-map.tsx",
  "ButtonProps": "registry/bases/base/button.tsx",
  "CalloutProps": "registry/bases/base/callout.tsx",
  "CardBodyProps": "registry/bases/base/card.tsx",
  "CardFooterProps": "registry/bases/base/card.tsx",
  "CardHeaderProps": "registry/bases/base/card.tsx",
  "CardProps": "registry/bases/base/card.tsx",
  "CareCardProps": "registry/bases/base/care-card.tsx",
  "ConsentSheetProps": "registry/bases/base/consent-sheet.tsx",
  "DialogProps": "registry/bases/base/dialog.tsx",
  "DisclaimerNoteProps": "registry/bases/base/disclaimer-note.tsx",
  "DividerProps": "registry/bases/base/divider.tsx",
  "EmptyStateProps": "registry/bases/base/empty-state.tsx",
  "FieldControlProps": "registry/bases/base/field.tsx",
  "FieldProps": "registry/bases/base/field.tsx",
  "IconButtonProps": "registry/bases/base/icon-button.tsx",
  "LinkProps": "registry/bases/base/link.tsx",
  "LogSheetProps": "registry/bases/base/log-sheet.tsx",
  "MetricTileProps": "registry/bases/base/metric-tile.tsx",
  "RangeBarProps": "registry/bases/base/range-bar.tsx",
  "RangeLegendProps": "registry/bases/base/range-legend.tsx",
  "ReadingInputProps": "registry/bases/base/reading-input.tsx",
  "RelativeTimeProps": "registry/bases/base/relative-time.tsx",
  "ResultCardProps": "registry/bases/base/result-card.tsx",
  "ScoreDialProps": "registry/bases/base/score-dial.tsx",
  "SegmentedControlProps": "registry/bases/base/segmented-control.tsx",
  "SheetContentProps": "registry/bases/base/sheet.tsx",
  "SheetDescriptionProps": "registry/bases/base/sheet.tsx",
  "SheetProps": "registry/bases/base/sheet.tsx",
  "SkeletonProps": "registry/bases/base/skeleton.tsx",
  "SourceCitationProps": "registry/bases/base/source-citation.tsx",
  "StatusPillProps": "registry/bases/base/status-pill.tsx",
  "StepperProps": "registry/bases/base/stepper.tsx",
  "SurfaceProps": "registry/bases/base/surface.tsx",
  "TabBarProps": "registry/bases/base/tab-bar.tsx",
  "TableProps": "registry/bases/base/table.tsx",
  "TermGlossaryProviderProps": "registry/bases/base/term.tsx",
  "TermProps": "registry/bases/base/term.tsx",
  "TimelineEntryProps": "registry/bases/base/timeline-entry.tsx",
  "TrendSparklineProps": "registry/bases/base/trend-sparkline.tsx",
  "ValueProps": "registry/bases/base/value.tsx",
  "VisuallyHiddenProps": "registry/bases/base/visually-hidden.tsx",
}

export const PROPS_META: { interfaces: number; props: number } = {
  interfaces: 44,
  props: 311,
}
