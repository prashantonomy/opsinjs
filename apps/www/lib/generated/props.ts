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
      description: "The level, assigned by the product. Required, and it drives the role, the announcement and the affordances rather than only the colour. `steady` is legal, and it is the level worth being careful with. Its one honest use is de-escalation — saying that a condition the product raised earlier has resolved, which is news the reader is owed and which no other component in the system delivers. It is not a place to put a message that needs nothing: a banner that can say \"nothing needs attention\" is a banner a product will reach for whenever it wants to be noticed, and it still spends one of the two the screen is allowed. If nothing has changed, the component is a Callout. There is no `unknown`. It is the absence of an assertion rather than a fifth level, and an interruption with no level is an interruption with no meaning. ESCALATE BY REMOUNTING, NOT BY RE-RENDERING. Raising the level on a banner that is already on the screen patches `role` and `aria-live` onto a DOM node assistive technology has already registered, and a live region is registered when its node is inserted: adding the role afterwards commonly announces nothing at all, which on the way up to `urgent` is the one failure this component exists to prevent. Give the element a key that contains the level — `key={status}` — so React replaces the node instead of patching it. Nobody has confirmed this with a screen reader; it is the conservative reading of the live-region model and it is written here rather than left implicit, because the recipe this component appears in escalates exactly this way.",
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
      description: "Which heading element the banner's heading renders as. Defaults to `h2`. The component cannot know where it sits, and a heading at the wrong level makes an outline that skips a level on one screen and repeats one on the next. Pass the level below the heading of the surface the banner is on — `h3` inside a section that already has an `h2`.",
      required: false,
    },
    "detectedAt": {
      type: "string",
      description: "When the condition was detected, ISO 8601 with an offset. The instant the product's rules found the condition, not the instant this rendered — a banner stamped with its own render time tells the reader something that is true of the page and false of their data. It renders through RelativeTime, which needs `now` as well; without one the timestamp is omitted and a warning says why. IT IS LABELLED *Recorded*, AND THAT WORD IS NEAR RATHER THAN EXACT. RelativeTime's five event words contain no `detected`, a sixth member of that union is that component's decision rather than this one's, and drawing a second timestamp here would be a copy of formatting, rounding and absolute-date behaviour that would drift from the original. So read the phrase precisely: it is the age of the DETECTION, never the age of the reading. A rule that ran an hour ago may have found a reading taken days before it, and \"Recorded 1 hour ago\" over a sentence about a reading is exactly the pair of separately-true statements RelativeTime's own file calls the most consequential error in health dashboards. If the reader needs to know how old the reading is, show that where the reading is.",
      required: false,
    },
    "now": {
      type: "string",
      description: "The instant `detectedAt` is measured against, in the same form. Required alongside it, because a component that read the clock itself would be impure and would make two timestamps on one screen disagree across a minute boundary. Read it once where the screen is rendered — `new Date().toISOString()` — and pass the same value to every timestamp on it. DO NOT REFRESH IT UNDER A MOUNTED `attention` OR `urgent` BANNER. Those two levels carry an atomic live region, so any change inside the banner re-announces the whole of it — heading, body, timestamp and every action label — and at `urgent` it does so assertively. The timestamp's visible phrase is a function of this prop, so a screen that ticks `now` on a minute boundary interrupts a listening reader in full, once a minute, for as long as the banner is up. `alarm-fatigue` is explicit that repetition is not escalation and that a re-raise belongs to a change of state rather than to a timer. Hold `now` still while the banner is mounted, and refresh it when something about the alert actually changes.",
      required: false,
    },
    "actions": {
      type: "AlertAction[]",
      description: "At most two. Required at `attention` and `urgent`, where a banner with nothing to do about it is the most common way a health product creates anxiety it cannot resolve — and where this component reports the omission rather than quietly rendering it.",
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
      description: "The dismiss control's visible word. Defaults to *Dismiss*, and the heading is appended to the accessible name so it says what it dismisses rather than standing alone. Override it to translate, or to say what acknowledgement means in this product — *I have read this*.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the timestamp, which is the one formatted thing on the banner. Omitted, the reader's own environment decides. It does not translate the event word or the dismiss control; `dismissLabel` is the override for the second, and the first is a gap this component cannot close from here.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root, and a class passed here WINS over the component's own where the two conflict. A banner sets no width and no margin, because both belong to the surface it sits at the top of. It is also the one way left to hide what this component insists on: a `sr-only`, a zeroed type size or a `truncate` passed here reaches the root and takes the heading, the body or the actions off the screen while leaving them in the tree. The component says so rather than pretending the hole is not there.",
      required: false,
    },
  },
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
  "CareCardProps": {
    "heading": {
      type: "string",
      description: "The instruction. Starts with a verb, and says what rather than why: \"Book a repeat blood test\", not \"About your recent result\". It is the card's accessible name, so it is also what a reader hears when they list the regions on a screen.",
      required: true,
    },
    "urgency": {
      type: "CareUrgency",
      description: "When the reader should do it, rendered as one of three fixed phrases inside the heading. Required, and never derived from `status`: a card with no timing is a demand with no deadline, and the reader supplies the missing urgency themselves — usually the wrong one.",
      required: true,
    },
    "attribution": {
      type: "string",
      description: "Who is asking. Required, and free text rather than an enum, because \"your GP surgery\" and \"an automatic reminder from this app\" are both true answers and the difference matters more than any category we could invent. Left empty, the card says in words that it does not know, and warns in development — it never quietly drops the line.",
      required: true,
    },
    "reason": {
      type: "string",
      description: "One sentence: what prompted this instruction.",
      required: false,
    },
    "dueBy": {
      type: "string",
      description: "The deadline, as a calendar date — `2026-10-12`. Written out in full rather than as a relative phrase, because a date does not change meaning while the card sits on a screen. Anything that is not a calendar date is refused rather than guessed at, and no deadline line is rendered for it.",
      required: false,
    },
    "overdue": {
      type: "boolean",
      description: "Whether that date is behind the reader now. An input, like everything else with a time in it here: the card reads no clock, and comparing a calendar date to \"now\" needs the reader's own time zone, which a component rendered on a server does not have. When it is true the card says so in words, and the product owns saying what to do about it — usually by changing `heading`.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 language tag for the deadline date. It does not translate the three timing phrases or the two admissions: those are English, and the gap is recorded on the page rather than hidden behind a prop that would also let a caller relabel \"Do this today\" as something more insistent.",
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
      description: "What that status is about, for the pill's accessible name: \"your last blood test\". Without it a screen-reader user hears a level with no subject inside a card full of other nouns, and the likeliest thing they attach it to is the instruction — which is not what it describes.",
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
      description: "Merged onto the root. Layout belongs here — the card sets no width and no place in a grid, because both are decisions of the screen it is on. It is also the one hole in this component's refusal to take a status colour: a colour utility passed through here reaches the root, and a card tinted from the status axis is the thing the pill exists to make unnecessary.",
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
      description: "What is being asked, phrased as a question the reader can answer yes or no to. It is the sheet's accessible name and its visible heading — the two are the same element, which is why there is no separate `title`.",
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
      description: "Where the reader can change this decision later, as a sentence in their own language. Required, and the sheet will not ask without it: a consent with no exit is not revocable whatever the copy says. It renders as text and is deliberately not turned into a link. A string is not a destination, and the doctrine's answer is that revocation lives where the data lives rather than inside the sheet that asked for it — so what belongs here is the sentence that tells the reader where to go, and the control belongs on the screen showing the data.",
      required: true,
    },
    "details": {
      type: "ConsentDetails",
      description: "The full wording, disclosed in place behind a named control, for the reader who wants all of it. Omitted, no control is drawn: an empty disclosure is a promise of more that there is no more of.",
      required: false,
    },
    "consequenceOfDeclining": {
      type: "string",
      description: "What the reader loses by declining, stated before they choose. Optional, because opsinjs cannot know whether a product still works after a refusal — and required by the doctrine whenever it does not. If refusing breaks something the reader came for, this is where they are told, and they are told before the controls rather than in a confirmation afterwards.",
      required: false,
    },
    "acceptLabel": {
      type: "string",
      description: "The word on the accept control. Required, with no default anywhere in this file, and there is no fallback if it is blank. Name the outcome rather than the press: a label that begins with the reader's own word for yes and then says what will happen is an answer, and one that only describes pressing the button is not. A generic label raises a development warning and is rendered exactly as written — only the product knows what it is agreeing to, and a component that rewrote the word would be writing consent copy.",
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
  "DisclaimerNoteProps": {
    "children": {
      type: "ReactNode",
      description: "The product's own words. One or two sentences: what this product does, then what it does not do. It renders a paragraph, so it takes text or inline content rather than a block element. There is no default text and there will not be one. Legal copy shipped from a design system puts words into products whose authors never read them, and it arrives looking reviewed because it came from a library. Supply none and the note says on screen that none was supplied, rather than inventing a sentence — `false` from a `&&` branch, `0` from the same branch on an empty collection, an empty array and a whitespace-only string all count as supplying none. The boundary is words: a caller who wraps the copy in an element is taken at their word, so an empty string inside a `<strong>` is the one route to a silently empty note that stays open. TYPED OPTIONAL AND REQUIRED BY THE CONTRACT, which is the same shape `EmptyState.children` has. Marking it required buys nothing — `{copy.text}` with an undefined `copy.text` type-checks either way — and it costs the ability to render the state at all, which is the state that most needs seeing.",
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
      description: "The id of this note's wording, so a product can record which version a reader was shown. Legal text changes, and a record should say which one applied. It renders as visible text, exactly as it is written here. An attribute would be tidier and would be a record only the product that already had the value could read: it survives no screenshot, no printout and no support ticket, and the data-attribute vocabulary is closed at four in any case. So write something a reader could quote back in a support conversation rather than an internal identifier, and write it in their language: no word is added around it, because any word added here would be English.",
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
  "LogSheetProps": {
    "values": {
      type: "Record<string, number | string | null>",
      description: "What the product's own controls currently hold, keyed the way the product wants them back. Handed to `onSave` verbatim. This is the channel that makes `onSave` possible at all: `children` is an opaque element tree and no component can read structured data out of one. The product already holds this state to render its own controlled inputs, so nothing here is duplicated — the key is simply written down beside the control instead of being inferred from it. `{}` is legitimate, for an entry that is a note and a time and nothing else. It is also how the sheet knows there is unsaved input. What is here when the sheet opens is the baseline; what is here when the reader tries to leave is compared against it, and a save resets the baseline so that a sheet the product keeps open afterwards does not claim to hold input nobody has saved.",
      required: true,
    },
    "children": {
      type: "ReactNode",
      description: "The entry controls, rendered in order at the top of the sheet. They stay opaque. This component never walks them, never counts them and never reads a value out of them — `values` is the channel for that. There is no enforced ceiling, and the \"about five\" in the specification is deliberately not implemented as a check. `React.Children` sees only direct children, so a product that wraps its own two fields in one component of its own would be counted as having one, and a count that is wrong in the common case teaches the wrong lesson twice: it clears a sheet that is too long and complains about one that is not. The ceiling is a design rule, and this is the file saying so rather than pretending to enforce it.",
      required: true,
    },
    "category": {
      type: "HealthCategory",
      description: "What the entry is about, tinting one band and nothing else. Omit it and the band is not rendered — there is no default category, because a capture sheet with the wrong identity colour is worse than one with none. The status axis is not available here at any price. Colouring a field while somebody is typing their own measurement into it is a verdict delivered mid-keystroke, and it is the fastest way to teach a person to stop logging honestly.",
      required: false,
    },
    "saveLabel": {
      type: "string",
      description: "The primary action's label, and it is required because there is no honest default. The content rule is that the action says what it saves — *Save reading*, *Save this dose* — and a component that shipped *Save* would let every product skip the rule without noticing it had one.",
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
      description: "How far back an entry may be dated, in days. The product owns this number; omit it and no earliest date is offered or stated. What it does: it sets the time control's `min`, which is what the platform date picker reads, and it names the earliest date in the field's guidance. What it does NOT do is block: a time typed outside the window still saves, and `onSave` still fires. A log that refuses an entry is a log with a hole in it exactly where the interesting record was.",
      required: false,
    },
    "onSave": {
      type: "(entry: LogEntry) => void",
      description: "Called on an explicit save and at no other moment. There is no autosave, no commit on close, and no debounce. It does not close the sheet. `open` belongs to the product, which is the only party that knows whether the save reached anywhere — a queued entry, a rejected one and a stored one all arrive here identically, and a sheet that closed itself would have decided the reader was finished on the strength of a function call returning.",
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
      description: "What was measured, in the reader's words — two or three of them. Not an acronym and not an internal code: a dashboard that has to be learnt before it can be read is a dashboard that is read wrong.",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The reading. `null` renders the no-reading state, which is not zero — zero is a real measurement for several metrics and a missing one is not a measurement at all. A number and not a string. A pre-formatted reading has already been rounded by somebody, carries no spoken unit and leaves nothing machine-readable behind it; a compound reading such as a pair is two measurements and takes two tiles.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "Display symbol, exactly as `tokens/units.json` spells it — \"kg\", \"mmol/L\", \"steps\". The spoken form is resolved from that table by Value, so this is the only place the unit is named. Optional by type and all but mandatory in practice: a bare number is ambiguous between unit systems, and Value raises OPSIN-0003 when one arrives without a unit rather than this file raising a second copy of the same complaint.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places, from the precision of the measurement — the resolution of the device, or the number of places the laboratory reported. Forwarded to Value untouched. Omitted, nothing is rounded and nothing is padded, which for a value that arrived from arithmetic can be seventeen digits: on a tile that is also a layout problem, and it is the prompt to go and find out what the measurement's resolution actually is.",
      required: false,
    },
    "measuredAt": {
      type: "string",
      description: "When the reading was taken, ISO 8601 with an offset. The time of MEASUREMENT, never of retrieval, sync or render — a tile that timestamps itself with the moment the screen was drawn tells every reader that every reading is current. Required, and refused rather than approximated: a value with no locatable time is undated, and for health data undated is the same as wrong.",
      required: true,
    },
    "now": {
      type: "string",
      description: "The instant the age is measured against, in the same form as `measuredAt`. Required for the same reason RelativeTime requires it: a component that read the clock itself would be impure, would read it once per tile rather than once per screen, and would let a grid of eight disagree with itself across a minute boundary. Read it once where the screen is rendered — `new Date().toISOString()` — and pass the same value to every tile on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the tile shows its stale treatment. Supplied by the product, and by nobody else: what counts as an old reading is clinical, it differs completely from one measurement to the next, and opsinjs holds no such number for any measurement in any population. Writing one here — or in an example, or in a comment as an illustration — would publish a boundary this system has no standing to publish. There is no default and there will not be one. Omitted, there is no stale treatment at all — the honest output when nobody has said what stale means here, and never a substituted number.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The level the product assigned to this reading. Rendered as an embedded StatusPill and never as the tile's fill. Omitted, no pill is rendered at all: there is no neutral level to fall back on, and a pill invented to fill a gap would be a verdict nobody gave. PAIR `attention` AND `urgent` WITH AN `href`. Clinical status semantics says of `attention` that there is always a named action, and a tile has no room for a sentence — so on a tile the action is the tile itself, and a level on a tile that leads nowhere leaves a reader a verdict and no way to act on it. Nothing here enforces the pairing: the check belongs in the shared warning channel, which this file cannot add a code to, and it is recorded as an open gap on the component's page rather than left silent.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the icon and the label, and nothing else. Identity rather than meaning: in greyscale the tint is lost and not one fact goes with it.",
      required: false,
    },
    "icon": {
      type: "ReactNode",
      description: "The category glyph, supplied by the product. opsinjs ships no category icon set — [category identity](https://opsinjs.dev/docs/health/category-identity) says an icon is governed separately — so this is a slot rather than a lookup, and a tile with no icon is a complete tile. Rendered decorative: the label beside it says the same thing in words, and a glyph announced as well would make a screen reader say the subject twice. It must not be interactive; the tile is one target and nothing nests inside it — and because the wrapper is `aria-hidden`, a control passed here would be reachable by Tab and absent from the accessibility tree at the same time. Nothing here checks that, so this sentence is the whole guard, and the page's claim that nothing inside a tile is focusable is scoped to what this component controls.",
      required: false,
    },
    "href": {
      type: "string",
      description: "Where the tile leads. With it the whole tile is one link, meeting the target floor on both axes; without it the tile is a static readout. A clinical tile with nowhere to go raises a question the product refuses to answer, so most tiles should have one. ONE CONSTRAINT COMES WITH THE LINK, and it is named here because a product choosing a unit is the one who meets it. A link takes its accessible name from its content, and Value hides the unit SYMBOL from assistive technology and substitutes the spoken form — so a tile whose visible text reads \"kg\" is announced \"kilograms\", and the link's visible label shares no substring with its name. That is WCAG 2.2 SC 2.5.3, and this component cannot repair it: an `aria-label` would replace the whole sentence rather than mend one clause of it, so none is offered. It does not arise for a unit whose symbol and spoken form are the same word. It is recorded on the component's page rather than left to be discovered.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for the number, its separators and the date. Passed through to Value and to RelativeTime together, so the reading and its timestamp cannot show two conventions on one tile. Omitted, the reader's own environment decides.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root with `tailwind-merge`, and a class passed here wins where the two conflict. That includes `truncate` and a fixed height, either of which can take digits off the end of a reading at 200% text — this component sets neither and never shortens a number on its own.",
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
      description: "When the measurement was taken, ISO 8601. Rendered as a date in the footnote so that a number on a screen is not read as \"now\". Omitted, the footnote says that nobody knows when the reading was taken rather than saying nothing — the same answer this component gives for a range nobody has dated, and for the same reason: silence about a time is read as now. That is a recency signal, and it is not a staleness treatment. There is no `staleAfterHours` here and there will not be one: how old is too old is clinical, differs by metric, and opsinjs does not own it. A surface that needs a boundary wraps the reading in `RelativeTime`, which takes the boundary from you.",
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
  "ReadingInputProps": {
    "label": {
      type: "string",
      description: "The measurement, in the reader's words. Required, visible and persistent — a placeholder is not a label and disappears the moment somebody types. Put the unit in `unit`, not in here. The label names WHAT is being measured; a label reading \"Weight (kg)\" leaves readers who think in pounds typing pounds, with nothing on screen to stop them or to record what they meant.",
      required: true,
    },
    "unit": {
      type: "string",
      description: "The unit shown beside the number, and the unit `value` and every segment's value are in. Required: a bare number in a health context is ambiguous between unit systems, and the same digits are one reading in mmol/L and a very different one in mg/dL. Use the display symbol exactly as `tokens/units.json` spells it — \"kg\", \"°C\", \"mmHg\". The spoken form comes from that table, so a listener hears \"in kilograms\" rather than the letters. A symbol the table does not hold is spoken as written rather than pronounced by guesswork.",
      required: true,
    },
    "value": {
      type: "number | null",
      description: "The reading, in `unit`. Controlled: what you pass is what is shown, and a change reaches the screen only when you apply it. Omitted, or `null`, is an empty field — never a zero. Ignored when `segments` is supplied, because a compound reading has no single number.",
      required: false,
    },
    "segments": {
      type: "ReadingSegment[]",
      description: "A compound reading — two or more numbers that are one measurement, such as a blood pressure. Each becomes its own labelled box inside one named group, which is what makes them separately typable and separately announced. `numbers-units-precision` rule 11 says a compound value is DISPLAYED in its conventional form — 118/76, one string, not two fields — and that rule is about display. This is entry, where `patterns/forms/units-and-numeric-entry` requires the opposite: separate fields under one legend, because asking somebody to type a solidus is asking them to format their own record. Both are right about their own half; the page says so.",
      required: false,
    },
    "onChange": {
      type: "(next: ReadingInputChange) => void",
      description: "Every change: a typed digit, a cleared box, a unit switch. There is no uncontrolled mode and no internal value — a caller that does not apply the change gets a field that will not accept typing, which is the ordinary behaviour of a controlled input rather than a fault.",
      required: true,
    },
    "units": {
      type: "string[]",
      description: "Units the reader may switch between. Two or more makes the unit a real control with its own name and a 44px target; fewer leaves it as text beside the number, which is where it has to be either way. Every pair the reader can reach should be one this system can convert: kg/lb/st and °C/°F are exact definitions and are converted for you. mmol/L and mg/dL are refused by name — the factor is the molar mass of the substance being measured, which is a property of the substance and not of either unit — so a switch between them clears the entry and says so, and a product that needs it supplies its own arithmetic on `cause: \"unit\"`.",
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
      description: "Decimal places, from the precision of the MEASUREMENT — the resolution of the instrument, or the places the laboratory reports. It is used for one thing only: rounding a number this component converted when the reader switched units. It never reformats, rounds or pads what the caller passed or what the reader typed, because rewriting digits underneath somebody's cursor is how a field loses a keystroke. Omitted, a conversion is not rounded at all and 5 kg becomes 11.023113109243878 lb.",
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
      description: "The reading. `null` renders the absence form — in words, never as `0` and never as a bare dash — because zero is a real measurement for several metrics and a missing one is not a measurement at all. Omit it only when the reading is compound and arrives through `segments`.",
      required: false,
    },
    "segments": {
      type: "ResultSegment[]",
      description: "A compound reading: two or more numbers that are one measurement, such as the pair in a blood-pressure result. Each segment is a real `Value`, so each is formatted, shaped and spoken like every other number in the system. When this is supplied, `value` is not read.",
      required: false,
    },
    "unit": {
      type: "string",
      description: "Display symbol exactly as `tokens/units.json` spells it — \"kg\", \"mmol/L\", \"mmHg\". It reaches every number on the card, so one card cannot show two units. `Value` resolves the spoken form from that table, which is why a listener hears \"millimoles per mole\" rather than the symbol read out letter by letter, and why a unit the table does not hold is rendered as written rather than pronounced by guesswork.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "DECIMAL PLACES, from the precision of the measurement — the resolution of the device, or the number of places the laboratory reported. Not significant figures: the same metric shown to a different number of decimal places at different magnitudes cannot be compared at a glance. It reaches the reading, every segment of a compound one, and both boundary labels on the bar, because a reading and the bound it is compared with are the same metric. Omitted, nothing is rounded and nothing is padded, and the digits the caller was handed are the digits that show.",
      required: false,
    },
    "locale": {
      type: "string",
      description: "BCP 47 locale for separators, digit shaping and the dates. It reaches every number and every instant on the card, so one card cannot show two conventions. Omitted, the reader's own environment decides.",
      required: false,
    },
    "measuredAt": {
      type: "string",
      description: "When the measurement was taken, ISO 8601 with an offset. The time of MEASUREMENT, never of retrieval, of sync or of render: a fetch timestamp here tells a reader their four-month-old reading was taken this morning. REQUIRED, AND WITH NO ABSENCE FORM — which is a known gap rather than a decision. Every other claim on this card degrades to a stated absence, and this one cannot: a card given `value={null}` still renders an instant at which that missing reading was measured. Do not invent one to satisfy the type. `RelativeTime`, which owns every instant in this system, has no absence form either, and inventing a sentence here would be a second copy of a rule that belongs there. Until it has one, a card whose reading is absent should not be given a measurement time the product does not have.",
      required: true,
    },
    "now": {
      type: "string",
      description: "The instant the card is being read against, in the same form as `measuredAt`. Required, because a component that read the clock itself would read it once per card rather than once per screen and make a page of results disagree with itself across a minute boundary. Read it once where the screen is rendered — `new Date().toISOString()` — and pass the same value to every card on it.",
      required: true,
    },
    "staleAfterHours": {
      type: "number",
      description: "Hours after which the card shows its staleness treatment. The product owns this number because it is clinical rather than visual, and it differs completely by measurement. There is no default: omit it and there is no staleness treatment at all, which is the honest output when nobody has said what old means here.",
      required: false,
    },
    "range": {
      type: "ReferenceRange",
      description: "The interval this reading is being compared with, and whose it is. Omit it when there is none: the bar is then not drawn at all and nothing is substituted. Never defaulted, in any population, for any metric. It is drawn only where there is also a `unit` and a single `value` — a bar needs a scale, a scale needs a unit to be read in, and a compound reading has no single position on one line.",
      required: false,
    },
    "status": {
      type: "ClinicalStatus",
      description: "The level of attention the PRODUCT has assigned to this result. Never derived here from `value` and `range`, and the derivation is not missing — it is refused. Omitted, no pill is rendered and no level is stated, which is what \"nobody has made a judgement about this\" looks like rather than a quiet reassurance.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "What the reading is ABOUT, for finding the heart results among the sleep results. It tints the title and nothing else: never the card's surface, never the pill, never the bar. Typed to the six rather than to `string`, because a component that accepts an arbitrary category accepts a seventh colour ramp that does not exist.",
      required: false,
    },
    "meaning": {
      type: "ReactNode",
      description: "The plain-English paragraph: what the test looks at, what this result means in context, what usually happens next. Absent, the card says in words that there is no explanation rather than rendering nothing — silence reads as reassurance, and it is the default nobody chose.",
      required: false,
    },
    "actions": {
      type: "ResultAction[]",
      description: "The next steps, at most two. More than two is a screen rather than a card, and a third is dropped with a warning rather than rendered.",
      required: false,
    },
    "provenance": {
      type: "string",
      description: "Who measured it, with what device or assay, and — where it is not already on the bar — where the range came from. Rendered as the footnote. Omitted, there is no footnote: this component ships no default provenance and no default disclaimer. FREE TEXT, WITH NO PROVENANCE CLASS, AND THAT LIMITS WHAT A `status` HERE MAY MEAN. Data provenance and device accuracy sorts every value into four classes — clinically measured, device measured, device estimated, self-reported — and bounds what an interface may assert by the class: a device-estimated or self-reported value may not carry a clinical status on its own. This card cannot tell those apart, because nothing in the system carries the class yet. So the rule is the caller's to keep: do not pass a `status` derived from an estimated or self-reported value.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Layout belongs here — a card sets no width and no place in a grid, because those are decisions of the screen it is on. A class passed here wins where the two conflict, `truncate` included, which is the one way to make a reading come back to somebody with digits missing.",
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
      description: "The score. `null` renders the no-score state, which is not a score of zero: zero is a real result on many scales and an absent one is not a result. A value that is not a finite number is a third state again — a calculation that ran and failed — and it is announced as one.",
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
      description: "The level of attention this reading needs, assigned by the product from a reference range or a threshold the product owns. An INPUT, never a derivation: this component does not compare the score with anything and decide what it means, because it does not know the reader. Only `steady` and `watch` are accepted. `attention` and `urgent` are refused and reported, because both are defined as carrying a named action and a dial has nowhere to put one — use CareCard or AlertBanner, which do.",
      required: false,
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
    "calculatedAt": {
      type: "string",
      description: "When the score was calculated, ISO 8601. Rendered as a date beside the derivation. It gets no staleness treatment and no relative phrasing: a relative phrase needs the instant to measure against, which this API does not carry, and a staleness window is a number opsinjs does not own for any metric. A caller who needs \"2 hours ago\", or needs an old score to LOOK old, renders a RelativeTime beside the dial and passes it one `now` for the whole screen. This prop is not `measuredAt`: nothing here was measured.",
      required: false,
    },
    "precision": {
      type: "number",
      description: "Decimal places for the score, from the product. Omitted, the number is shown with exactly the digits it arrived with — nothing is rounded and nothing is padded, because precision belongs to the metric and there is no honest default for a composite score. It is load-bearing for layout as well as for honesty: an unstated precision can print nineteen digits of a double as one unbreakable token.",
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
      description: "The readings, in chronological order. A gap is an explicit entry with `value: null`, never an omitted one: an entry missing from the array is one this component cannot know about, and a line drawn straight through it asserts a measurement nobody took. An entry whose value is a number but not a finite one is a failure rather than a gap, is counted and described as one, and is not drawn.",
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
    "changeThreshold": {
      type: "number",
      description: "The smallest difference this metric counts as a change, in the reading's own unit. There is no default, and without it the caption names no direction. A metric declares the difference below which a series is presented as unchanged; below that noise floor \"about the same\" is the true sentence. Supplied, the caption reads \"Up, from … to …\"; omitted, it prints both endpoints and stops, and the accessible name says \"with no clear direction\". Zero is a legitimate value and means your metric counts any difference at all — but it has to be your product saying so, not this file.",
      required: false,
    },
    "range": {
      type: "ReferenceRange",
      description: "An interval to shade behind the line, in neutral tones. Never status-coloured, and never invented: omit it and no band is drawn. Its `source` is required and is named in the caption, because a shaded band with no owner is an assertion with no author. A band is drawn only when BOTH bounds are present and the lower is below the upper. A one-sided range is stated in the caption as words — \"10 steps and above\" — and drawn as nothing, because the missing edge would have to come from the data or from zero and would then be attributed to your source.",
      required: false,
    },
    "category": {
      type: "HealthCategory",
      description: "Tints the line so it is findable in a grid of six. It is identity, not meaning: in greyscale the tint is lost and nothing else is.",
      required: false,
    },
    "caption": {
      type: "string",
      description: "Your own sentence, in place of the composed one. Use it when you have a cadence, a phrasing or a comparison this component cannot know about. It replaces the direction-and-magnitude sentence. It does not replace the coverage clause (how many readings there are and what is missing), the clause naming a marked reading, or the clause naming a range's source — those are appended either way, because a count of absent measurements, a status and an attribution are not decoration. Where there are too few readings to draw, your sentence is appended to the refusal rather than replacing it: the refusal is the one sentence that explains why there is no picture.",
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
  "AlertBannerProps": "registry/bases/base/alert-banner.tsx",
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
  "EmptyStateProps": "registry/bases/base/empty-state.tsx",
  "FieldControlProps": "registry/bases/base/field.tsx",
  "FieldProps": "registry/bases/base/field.tsx",
  "LogSheetProps": "registry/bases/base/log-sheet.tsx",
  "MetricTileProps": "registry/bases/base/metric-tile.tsx",
  "RangeBarProps": "registry/bases/base/range-bar.tsx",
  "ReadingInputProps": "registry/bases/base/reading-input.tsx",
  "RelativeTimeProps": "registry/bases/base/relative-time.tsx",
  "ResultCardProps": "registry/bases/base/result-card.tsx",
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
  interfaces: 30,
  props: 233,
}
