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
  "ButtonProps": {
    "variant": {
      type: "ButtonVariant",
      description: "Emphasis. Four values, in descending order: `primary`, `secondary`, `quiet`, `destructive`. One primary per surface — the hierarchy is the answer to \"what should I do here?\", and three primaries answer it with a shrug. Defaults to `secondary`, because the safe default is the one that does not claim to be the most important thing on the screen.",
      required: false,
    },
    "size": {
      type: "\"sm\" | \"md\"",
      description: "Visual weight only. Both sizes clear the 44pt target floor; `sm` is narrower and takes a smaller type step, and is never shorter. Defaults to `md`.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Required. The label, and there is no way to remove it: no `iconOnly` prop and no size at which the icon stands alone. An icon-only control needs its accessible name supplied some other way and a different target treatment, which makes it a different component.",
      required: true,
    },
    "type": {
      type: "\"button\" | \"submit\" | \"reset\"",
      description: "Inherited from `button`, redeclared here because its default is the surprising one. **Defaults to `button`, not to `submit`.** Base UI's `useButton` merges `type: \"button\"` into every native button, so this component does not inherit the platform's implicit submit behaviour: a control at the foot of a form needs `type=\"submit\"` written on it. The value you pass wins, so submitting is one word away — but it is a word you have to write.",
      required: false,
    },
    "icon": {
      type: "ReactNode",
      description: "An optional glyph beside the label. Always decorative and always hidden from assistive technology — the label carries the meaning, and an announced icon makes a screen reader say the action twice.",
      required: false,
    },
    "iconPosition": {
      type: "\"leading\" | \"trailing\"",
      description: "Which side the icon sits on. Defaults to `leading`. Use `trailing` for a control that moves the reader forward through a flow, so the glyph points the way the action goes.",
      required: false,
    },
    "busy": {
      type: "boolean",
      description: "In-place loading. The label stays visible and unchanged, and the button stays in the accessibility tree and in the tab order rather than disappearing. The state is EXPOSED on the control as `aria-busy` plus `aria-disabled`; whether any screen reader says anything about it has not been tested here, and `aria-busy` on a control that is not a live region is a hint rather than a promise. It replaces the icon slot, so a button that has no icon grows by one glyph when it becomes busy; give a button an icon if its width must not move.",
      required: false,
    },
    "fullWidth": {
      type: "boolean",
      description: "Fills its container. For the bottom of a sheet or a form, where the primary action should be as wide as the thumb's reach. Not for a row of buttons — two full-width buttons stacked read as two primary actions.",
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
      description: "An optional short heading. It renders as styled text and not as an `h1`-`h6` element, so it never appears in the page's outline: a component cannot know which level it is nested at, and one that guessed would produce an outline that skips a level on some screens and repeats one on others. If the callout is a section a reader needs to navigate to, it needs a real heading outside it — and at that point it is probably a section rather than a callout. An empty or whitespace-only string is treated exactly like no title at all: the element leaves the DOM rather than rendering an empty line of heading-weight space.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "The body: one short paragraph. There is no actions slot and no `action` prop. A callout that needs a button is asking the reader to do something, and an instruction with somebody behind it is a CareCard.",
      required: true,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here — a callout sets no width and no margin, because both are decisions of the content it sits in. It is also the one hole in this component's refusal to carry a status, and the component says so rather than pretending otherwise: a colour utility from either axis passed through here reaches the root, and in development it raises a warning that names what to use instead.",
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
      description: "The card's title. Pass the heading element the page's outline needs — `<h3>Recent readings</h3>` — and the slot takes care of how it looks. Pass a string instead and the title is styled text with no place in the outline, which is a legitimate choice for a card nobody needs to navigate to and a mistake for one they do.",
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
      description: "Which rung of the material ladder. Defaults to `\"card\"` — the rung named for this component, opaque and deliberately shadowless. Products may move a card down the ladder to `\"canvas\"`, or up to `\"raised\"` while it is being lifted, and never above that: a value a reader is trying to read must not sit over a moving backdrop.",
      default: "\"card\"",
      required: false,
    },
    "density": {
      type: "\"comfortable\" | \"compact\"",
      description: "Padding scale. Affects space only, never type size. `\"compact\"` drops the padding one multiplier on the density-scaled spacing scale — four times `--spacing` rather than five — and it does not shrink the type, the separation between two controls in the footer, or the card's touch target.",
      default: "\"comfortable\"",
      required: false,
    },
    "href": {
      type: "string",
      description: "Makes the whole card a single link. A card that is a link may hold no other interactive element: a reader cannot tell what tapping the gap between two buttons will do, and a keyboard user reaches controls that are nested inside a control. TypeScript cannot express that exclusion — `children` is a `ReactNode` and an element's interactivity is not in its type — so it is a rule this component states and does not enforce.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here: a card sets no width, no position and no place in a grid, because those are decisions of the screen it is on rather than of the card.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Everything the card holds — usually `Card.Header`, `Card.Body` and `Card.Footer`, and — equally correctly — a single paragraph.",
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
      description: "What happens if the reader says yes, and what happens if they say no, in one or two sentences. Optional on an ordinary dialog and effectively required on an alert one — it is the only place the reader is told why Escape will not let them out, and its absence raises a development warning.",
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
      description: "The accessible name of the close control, which is the only reader-facing word this component owns. It exists so that the word can be translated: a component that ships an untranslatable English string into a product whose readers do not read English has removed their way out of the dialog as surely as deleting the control would. The default is English, and that is the residual gap — the same one `StatusPill.label` has, and it is listed on the page rather than described as solved. Ignored when `severity` is `alert`, which renders no close control at all.",
      default: "\"Close\"",
      required: false,
    },
    "initialFocus": {
      type: "\"safest\" | \"content\"",
      description: "Where focus lands when the dialog opens. `safest` puts it on the LAST control in `actions`, which is where the specification's own example puts the answer that changes nothing; `content` puts it on the first control inside `children`, for a dialog whose job is a short task rather than a question. Neither ever lands on the scrim or on the container while a control is available. `content` falls back to the safest action when `children` holds nothing focusable, and only then to the primitive's own behaviour. That order is the point rather than a tidy-up: the primitive's default is the first tabbable element in the popup, an alert dialog has no close control, and so the first tabbable element in an alert dialog is the FIRST action — which the ordering rule reserves for the answer that changes something. The cost of `safest` is that it is the LAST tab stop in the dialog, so the first Tab wraps round to the close control and the other answer is reached with Shift+Tab. That is the trade: a stray Return is harmless, and the other answer is one key further away than it looks.",
      default: "\"safest\"",
      required: false,
    },
    "actions": {
      type: "ReactNode",
      description: "The actions, in order, least destructive LAST. At most two — a dialog with three answers is a menu that has not admitted it — and that limit is a rule this component states rather than enforces, because `ReactNode` does not say how many controls are inside it and `React.Children.count` cannot see through a fragment. They are pinned to the foot of the dialog and never scroll away.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Anything the dialog holds beyond its title and its description: a short form, a list of what will be affected. Optional, and most confirmations need none of it. Nothing translucent goes in here. The dialog is itself a translucent rung and a translucent rung may never contain another one — a card inside a dialog is a `card`, which is opaque and is where a health value has to sit.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the container. Width belongs here: the dialog takes the full width of a phone and a readable measure above that, and a product with a genuinely wider dialog overrides it rather than asking for a prop.",
      required: false,
    },
  },
  "EmptyStateProps": {
    "reason": {
      type: "\"nothing-yet\" | \"no-matches\" | \"nothing-left\" | \"not-enough\"",
      description: "Why the surface is empty. Required, and it deliberately changes nothing you can see. `nothing-yet` — the reader has not added anything yet. `no-matches` — a filter or a search matched nothing. The data exists. `nothing-left` — there was content and there is none now; everything was completed or removed. `not-enough` — there is data, but not enough for this view to be honest. It is required because each one needs different words, and because one of them is a safety statement rather than an inconvenience. It renders nothing of its own: a component that turned a reason into a sentence would be writing a sentence about the reader's data, which is the one thing this system will not do.",
      required: true,
    },
    "title": {
      type: "string",
      description: "What is not here, in one short line. Rendered as a real heading so the empty state can be navigated to rather than stumbled into. Required, and checked as well as typed. A blank or whitespace-only string renders a visible line saying none was supplied, and warns — because the alternative is a heading with no name, which is silent to everything except a screen reader and an audit.",
      required: true,
    },
    "titleLevel": {
      type: "2 | 3 | 4 | 5 | 6",
      description: "The heading level the surrounding page needs. There is no way for this component to know it — an empty state replacing a page's main content wants a different level from one inside a card — so `2` is a starting point and not an answer. Check it against the outline of the screen it lands on.",
      default: "2",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Why it is empty, in one or two sentences. Say what is not here, then why, then what to do; for `not-enough`, state the rule and the gap. It renders a paragraph, so it takes text or inline content rather than a block element. Omitting it does not produce a tidier empty state. It produces a visible line saying that no explanation was supplied, because the alternative — a default sentence about an absence of health data — is a sentence nobody reviewed. `false` from a `&&` branch, an empty array and a whitespace-only string all count as omitting it. A body that is only a number is refused outright and replaced with the same line, because `{items.length && \"…\"}` at a length of zero renders the digit `0` — and an absence rendered as a number reads as a measurement of nothing.",
      required: false,
    },
    "action": {
      type: "{ label: string; href?: string; onSelect?: () => void }",
      description: "Exactly one primary action, or none. Never a row of three. `href` navigates and renders an anchor; `onSelect` acts and renders a Button. Supply one of the two. A control that produces a new URL is a link however it is styled, and rebuilding it as a button loses the new tab, the copied address and the screen reader's list of links.",
      required: false,
    },
    "secondary": {
      type: "{ label: string; href?: string; onSelect?: () => void }",
      description: "A quieter alternative, for the reader who cannot take the primary one. Same shape and same rule; it is not a second primary action, and it does not belong here on its own.",
      required: false,
    },
    "illustration": {
      type: "ReactNode",
      description: "Decorative only, and never the carrier of the message. It is hidden from assistive technology and made `inert`, dropped in print, and dropped again when the surface is narrow — if a picture is carrying meaning, the meaning is missing from the words. `inert` is why nothing focusable belongs here: a control inside a decorative wrapper would be hidden from the accessibility tree and unreachable by keyboard, which is a worse outcome than not passing it.",
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
      description: "Only meaningful alongside `render`, for an element that has children of its own — the `<option>` list of a `<select>`. An `<input>` is void and takes none.",
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
      description: "The control. Put a `Field.Control` here — Field supplies its id, its `aria-describedby` and its invalid state through context, so a product never wires them by hand. Anything else that participates in Base UI's field context works too; anything that does not gets a label pointing at nothing, which is the one failure this component cannot detect for you.",
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
      type: "\"blur\" | \"submit\" | \"submit-then-change\"",
      description: "When the control's own constraints are checked. Governs the invalid state, not the `error` prop — a message the product passed in is a message the product has already decided to show. Defaults to `\"submit-then-change\"`: never tell somebody their answer is wrong while they are still typing it. Both submit values need Base UI's `<Form>` around the fields. Base UI gates them on a flag that only its own form primitive ever sets, so inside a plain `<form>` the constraints are checked on Enter in a text input and at no other moment. `\"blur\"` needs no `<Form>`. Passing `error` is unaffected either way, and is the path to be on.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Field lays its own parts out in a column and leaves the space BETWEEN fields to the form, which is the only place that knows how many there are.",
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
      description: "The measurement. `null` is a first-class state meaning there is no reading, distinct from `0`, and renders the words rather than a tick at zero — a mark at the bottom of a range is a reading, and a missing one is not.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "Display symbol exactly as `tokens/units.json` spells it — \"kg\", \"mmol/L\", \"mg/dL\". Every number this component renders goes through `Value`, which resolves the spoken form from that table, so a listener hears \"milligrams per decilitre\" rather than an improvised pronunciation.",
      required: true,
    },
    "range": {
      type: "ReferenceRange",
      description: "The range this reading is being compared with, and whose it is. Omit it entirely when none is available: the component then draws no band, says so in the summary, and substitutes nothing. `source` is required — a range with an empty one is reported as OPSIN-0004 and not drawn.",
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
      description: "DECIMAL PLACES, from the precision of the measurement — the resolution of the device, or the number of places the laboratory reported. Not significant figures: the same metric shown to a different number of decimal places at different magnitudes cannot be compared at a glance, which is what `health/numbers-units-precision` rule 2 forbids. It applies to the reading and to the two boundary labels alike, because a value and the bound it is being compared with are the same metric. Omitted, nothing is rounded and nothing is padded.",
      required: false,
    },
    "measuredAt": {
      type: "string",
      description: "When the measurement was taken, ISO 8601. Rendered as a date in the footnote so that a number on a screen is not read as \"now\". There is NO staleness treatment here and no `staleAfterHours`: how old is too old is clinical, differs by metric, and opsinjs does not own it. A surface that needs one wraps the reading in `RelativeTime`, which takes the boundary from you.",
      required: false,
    },
    "summary": {
      type: "string",
      description: "Replaces the generated sentence — for a unit whose phrasing does not fit the template, or for a reader whose language is not English. It cannot remove the sentence: there is no value of this prop that renders the component without one, because the sentence is the component.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for number separators, digit shapes and the dates in the footnote. Passed through to every `Value` this component renders, so one bar cannot show two conventions. Omitted, the reader's environment decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. A class passed here wins where the two conflict.",
      required: false,
    },
  },
  "RelativeTimeProps": {
    "at": {
      type: "string",
      description: "ISO 8601 with an offset — `2026-03-14T08:12:00+01:00`. A timestamp with no offset is not a timestamp: it is parsed in whichever zone the code happens to be running in, and it is refused rather than guessed at.",
      required: true,
    },
    "event": {
      type: "TimeEvent",
      description: "Which event this instant belongs to. Named, never inferred: this is the difference between a fact and a guess, and it is the difference between when a reading was taken and when an app last spoke to a server.",
      required: true,
    },
    "now": {
      type: "string",
      description: "The instant the phrase is measured against, in the same form as `at`. Required, because a component that read the clock itself would be impure, would read it once per timestamp rather than once per screen, and would make a page of readings disagree with itself across a minute boundary. Read it once where the screen is rendered — `new Date().toISOString()` — and pass the same value to every timestamp on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the staleness words and their muted treatment appear. Supplied by the product, because what counts as old is clinical and differs completely by measurement. There is no default: omit it and there is no stale treatment at all, which is the honest output when nobody has said what stale means here. Supply it and the timestamp always says something — past the boundary it carries the words, and where the age could not be checked at all it carries the same words rather than falling silent.",
      required: false,
    },
    "absoluteAfterDays": {
      type: "number",
      description: "Days after which the absolute date replaces the relative phrase. Defaults to a fortnight, which is a legibility boundary and not a clinical one: past it, \"437 days ago\" is arithmetic nobody should be asked to do. It never adds, removes or moves the staleness note. `0` is a first-class value and means the phrase is never used — the date is rendered on its own at every age — rather than an error to be replaced by the default.",
      required: false,
    },
    "showAbsolute": {
      type: "boolean",
      description: "Puts the absolute date and time on screen beside the phrase. It is in the accessibility tree and in print either way — this prop decides whether a sighted reader sees it without asking, which on anything durable or consequential they should.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the date and the phrase. It does not translate the event word — those five are English, and the gap is documented rather than hidden behind a prop that would also let a caller relabel `synced`.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. The merge puts it last, so a conflicting class passed here wins: a type size or a colour set on the caller's side displaces the component's own. The one thing it cannot displace is the muted stale treatment, which is addressed at the parts rather than at the root for exactly that reason — see the class list on the root below.",
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
      description: "The score. `null` renders the no-score state, which is not a score of zero: zero is a real result on many scales and an absent one is not a result.",
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
      description: "The product's bands: contiguous, non-overlapping, covering the whole scale. opsinjs ships none and never supplies a default. An empty list renders the number with no band and says so, rather than inventing one.",
      required: true,
    },
    "derivation": {
      type: "string",
      description: "One sentence saying what went into the score and over what window. Required, and always rendered. A dial that cannot explain itself is a decorative authority claim, and Value is the honest component instead.",
      required: true,
    },
    "coverage": {
      type: "{ available: number; expected: number }",
      description: "How much of the expected input the score was actually calculated from — `{ available: 4, expected: 6 }`. When it is short the dial says so on its face, because a reader has no other way to know that today's number rests on a third of the usual evidence. What was counted is the derivation sentence's job to name: this component does not know whether they were nights, readings or days.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the label, and nothing else. Never the track, the bands or the indicator — those belong to the status axis, and one surface carries one axis.",
      required: false,
    },
    "measuredAt": {
      type: "string",
      description: "When the score was calculated, ISO 8601. Rendered as a date beside the derivation. It gets no staleness treatment and no relative phrasing: a relative phrase needs the instant to measure against, which this API does not carry, so a caller who wants \"2 hours ago\" renders a RelativeTime beside the dial and passes it one `now` for the whole screen.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places for the score, from the product. Omitted, the number is shown with exactly the digits it arrived with — nothing is rounded and nothing is padded, because precision belongs to the metric and there is no honest default for a composite score.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for the number and the date. Omitted, the reader's own environment decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. A class passed here wins where the two conflict.",
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
  "SheetProps": {
    "open": {
      type: "boolean",
      description: "Whether the sheet is on screen. Required and controlled: a modal surface that owned its own visibility would be a surface a product could not close when the data underneath it changed.",
      required: true,
    },
    "onOpenChange": {
      type: "(open: boolean, route: SheetDismissRoute) => void",
      description: "Called when the sheet asks to open or close. The second argument says which route was taken — `close-control` for the header's close button, `scrim` for a tap on the background, `escape` for the escape key or the platform's back gesture, `drag` for a swipe down, and `other` for anything else, including a close the product asked for itself. The sheet does not close itself: `open` is the only thing that closes it. That is what makes \"ask before discarding unsaved input\" possible — leave `open` alone, show the confirmation, and close when the reader answers.",
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
      description: "Traps focus and makes the page behind genuinely inert — not dimmed, but unreachable, by a pointer and by assistive technology alike. It is also the only state in which the sheet takes focus on appearance: `modal={false}` does none of the three, so it opens where the reader can see it and leaves the caret exactly where they left it. A non-modal sheet has no accessibility story on this page beyond that sentence. It is pinned to the bottom edge while the page behind stays focusable, which is the obscured-focus shape WCAG 2.4.11 is about, and nothing here has been checked against it.",
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
      description: "Merged onto the sheet's container. Width belongs here: a sheet is as wide as the screen by default, and a product that wants it narrower on a large display knows something about its layout that this component does not.",
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
      description: "Number of lines for the text shape, ignored by the other three. The last is rendered shorter, the way a paragraph's last line is. Defaults to 3. The count is repaired at both ends rather than trusted: a value below 1 is raised to 1 rather than rendering a group that reserves no space at all, and a value above 24 is lowered to 24 — no paragraph a skeleton stands in for has more lines than that, and an unbounded count allocates an unbounded array during a server render.",
      required: false,
    },
    "appearAfterMs": {
      type: "number",
      description: "Delay in milliseconds before the skeleton appears. Content that arrives faster than this never shows one, which removes the flash. Implemented in CSS, so it holds before hydration and with JavaScript switched off.",
      required: false,
    },
    "shimmer": {
      type: "boolean",
      description: "Movement is a preference, never a signal. It does not encode progress, it does not speed up, and it is suppressed under `prefers-reduced-motion`, which leaves the static tint behind. On by default: a motionless grey rectangle reads as content that did not arrive at least as readily as it reads as content that is arriving. It loops for as long as the skeleton is mounted, and there is no pause, stop or hide control — `prefers-reduced-motion` is an operating-system preference, not the page-level mechanism WCAG 2.2 SC 2.2.2 asks for past five seconds. Pass `false`, or replace the skeleton with words, on a wait long enough for that to matter.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. This is where the size of what is coming goes, and it is expected rather than exceptional: the component knows the vocabulary of shapes and the caller knows the content.",
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
      description: "Overrides the default word for this level — for translation, or for a product whose readers use different language. It may not change the meaning, and it may not be an empty string.",
      required: false,
    },
    "size": {
      type: "\"sm\" | \"md\"",
      description: "Visual weight only. Both sizes render icon, word and colour; neither drops the word.",
      required: false,
    },
    "describes": {
      type: "string",
      description: "What the pill applies to, for the accessible name: \"HbA1c result\". Without it a screen-reader user hears a level with no subject.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. The pill's own classes win where they conflict.",
      required: false,
    },
  },
  "SurfaceProps": {
    "rung": {
      type: "MaterialRung",
      description: "Which rung of the material ladder. Required: there is no sensible default depth, and a component that guessed would put a surface at the wrong height silently. The names are the token names — `canvas`, `card`, `raised`, `sheet`, `overlay`, `scrim`.",
      required: true,
    },
    "contentWeight": {
      type: "\"body\" | \"large\"",
      description: "Whether content on this surface has to clear the floor for body text or only for large text. Defaults to `\"body\"`, which is the stricter of the two. Both take the published floor today, because the token source measures one floor per rung.",
      required: false,
    },
    "opaque": {
      type: "boolean",
      description: "Renders the rung's opaque fallback regardless of engine or preference — the path for print and export, where there is no backdrop to see through and a translucent tint composites against paper.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Shape belongs here: Surface sets no corner of its own, and every layer inside it inherits whatever radius the caller applies. It is also unrestricted, so it is the one prop through which a caller can put colour on a Surface, and the two-colour-axes rule applies to it in full: a Surface may take a category tint or sit under a status, never both. A category-tinted Surface renders its status as a StatusPill inside it rather than as a tint on the root. Both axes on one element is OPSIN-0001, and this component cannot detect it — `cn` merges whatever it is handed.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Everything the surface holds.",
      required: true,
    },
  },
  "TermGlossaryProviderProps": {
    "glossary": {
      type: "readonly GlossaryEntry[]",
      description: "Every term this subtree can name. Hoist it to a module constant: it is rebuilt into a lookup whenever its identity changes, and an array literal written inline in JSX is a new identity on every render. It may be handed straight across the server/client boundary — a plain array of plain objects is serialisable — so the definitions can be read from a file on the server and never reach the browser as code.",
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
      description: "The word as it should read in this sentence, when it differs from the glossary's headword — plural, tense, or capitalisation. It changes what is printed and nothing else: the definition and the expansion still come from the entry, and so does the spoken form of an abbreviation, which is appended to the control's name rather than replacing what is written there. Two paths do not print it, and both are cases where printing it would be worse. A `plain-only` entry discards it, because `children` is where a call site writes the clinical word inflected for its sentence and that entry's whole content is that the clinical word is never shown; the discard warns in development. An `id` that is not in the glossary prints it and prints it gratefully — there it is the only real word available, and without it the raw key appears in the sentence instead.",
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
      description: "Suppress the repeat. Set it on the second and later appearances of a term on one surface: the word is still marked, the definition is still one press away and still in the accessibility tree, and it is not printed again — on screen or on paper. opsinjs does not count the appearances for you. It cannot see where one surface ends and the next begins, and a component that guessed would either repeat itself down a page or silently drop a definition the reader had not yet met. Repetition is noise and absence is a barrier; this is the compromise, and the caller is the only party that can make it.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here; the mark, the control and the definition's own treatment do not, because each of them is an accessibility claim this component makes on the page.",
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
      description: "Unit symbol as `tokens/units.json` spells it — \"bpm\", \"mmol/L\", \"steps\". Every reading in the caption is rendered through `Value`, which resolves the spoken form from that table so a screen reader says \"millimoles per litre\" rather than improvising.",
      required: true,
    },
    "series": {
      type: "TrendPoint[]",
      description: "The readings, in chronological order. A gap is an explicit entry with `value: null`, never an omitted one: an entry missing from the array is one this component cannot know about, and a line drawn straight through it asserts a measurement nobody took.",
      required: true,
    },
    "minimumPoints": {
      type: "number",
      description: "How many real readings there must be before a line may be drawn at all. Required, with no default, and the omission is the point. How many readings make a trend depends on what was measured, how often it is measured and who is reading it — a number opsinjs cannot know and must never guess. Below it this component draws nothing and says so, naming your number and the count it actually has.",
      required: true,
    },
    "window": {
      type: "string",
      description: "The period the series covers, as the reader should see it — \"the last 14 days\". A display string rather than a duration, which has a consequence worth knowing: the x-axis is the extent of the series you passed, not the extent of this period, so two sparklines are only comparable side by side when their series cover the same span.",
      required: true,
    },
    "range": {
      type: "ReferenceRange",
      description: "An interval to shade behind the line, in neutral tones. Never status-coloured, and never invented: omit it and no band is drawn. Its `source` is required and is named in the caption, because a shaded band with no owner is an assertion with no author.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the line so it is findable in a grid of six. It is identity, not meaning: in greyscale the tint is lost and nothing else is.",
      required: false,
    },
    "caption": {
      type: "string",
      description: "Your own sentence, replacing the composed one. Use it when you have a change threshold, a cadence or a phrasing this component cannot know about. It replaces the direction-and-magnitude sentence only. The clause naming a marked reading and the clause naming the band's source are appended by the component and cannot be removed by any prop — one is a status that owes a word, the other is an attribution.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. There is no class that hides the caption.",
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
      type: "string",
      description: "Display symbol, exactly as `tokens/units.json` spells it — \"kg\", \"mmol/L\", \"°C\". The spoken form is resolved from that table, so this is the only place a unit is named. A symbol the table does not hold is rendered as written rather than pronounced by guesswork.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the MEASUREMENT — the resolution of the device, or the number of places the laboratory reported. Never chosen at render time to make a column line up. Omitted, the component rounds nothing and pads nothing. There is no per-unit default to fall back on, deliberately: precision is a property of the metric and not of the unit, and two metrics reported in the same unit do not share one.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for separators and digit shaping. Distinct from `unit`: locale decides how a number is written, unit systems decide which number. Omitted, the reader's own environment decides.",
      required: false,
    },
    "absenceLabel": {
      type: "string",
      description: "What the absence form says when there is no reading — \"no reading yet\" by default. It replaces the words, never the em dash, and it is not used for a number that arrived broken, which is a different thing and says so. An empty string falls back to the default and reports itself: an em dash with no words beside it is banned outright, because speech synthesis either skips it or reads it out as \"dash\".",
      required: false,
    },
    "size": {
      type: "\"inherit\" | \"display\"",
      description: "Visual weight. Never changes the value, the precision or the unit.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class you pass WINS over the component's own where the two conflict. `cn(\"inline tabular-nums\", …, className)` puts yours last and `twMerge` keeps the later of a conflicting pair — verified: `twMerge(\"inline tabular-nums\", \"block truncate\")` returns `\"tabular-nums block truncate\"`. That includes `truncate` and any fixed height. This component never shortens a number on its own and sets no ellipsis and no height; passing a class that does is the one way to make a reading come back to somebody with digits missing off the end.",
      required: false,
    },
  },
}

/** Interface name to the file it is exported from, relative to apps/www. */
export const PROPS_SOURCES: Record<string, string> = {
  "ButtonProps": "registry/bases/base/button.tsx",
  "CalloutProps": "registry/bases/base/callout.tsx",
  "CardBodyProps": "registry/bases/base/card.tsx",
  "CardFooterProps": "registry/bases/base/card.tsx",
  "CardHeaderProps": "registry/bases/base/card.tsx",
  "CardProps": "registry/bases/base/card.tsx",
  "DialogProps": "registry/bases/base/dialog.tsx",
  "EmptyStateProps": "registry/bases/base/empty-state.tsx",
  "FieldControlProps": "registry/bases/base/field.tsx",
  "FieldProps": "registry/bases/base/field.tsx",
  "RangeBarProps": "registry/bases/base/range-bar.tsx",
  "RelativeTimeProps": "registry/bases/base/relative-time.tsx",
  "ScoreDialProps": "registry/bases/base/score-dial.tsx",
  "SheetContentProps": "registry/bases/base/sheet.tsx",
  "SheetProps": "registry/bases/base/sheet.tsx",
  "SkeletonProps": "registry/bases/base/skeleton.tsx",
  "StatusPillProps": "registry/bases/base/status-pill.tsx",
  "SurfaceProps": "registry/bases/base/surface.tsx",
  "TermGlossaryProviderProps": "registry/bases/base/term.tsx",
  "TermProps": "registry/bases/base/term.tsx",
  "TrendSparklineProps": "registry/bases/base/trend-sparkline.tsx",
  "ValueProps": "registry/bases/base/value.tsx",
}

export const PROPS_META: { interfaces: number; props: number } = {
  interfaces: 22,
  props: 135,
}
