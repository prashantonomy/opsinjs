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
      description: "In-place loading. The label stays visible and unchanged, the button stays in the accessibility tree and in the tab order, and it is announced as busy and unavailable rather than disappearing. It replaces the icon slot, so a button that has no icon grows by one glyph when it becomes busy; give a button an icon if its width must not move.",
      required: false,
    },
    "fullWidth": {
      type: "boolean",
      description: "Fills its container. For the bottom of a sheet or a form, where the primary action should be as wide as the thumb's reach. Not for a row of buttons — two full-width buttons stacked read as two primary actions.",
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
      description: "Padding scale. Affects space only, never type size. `\"compact\"` moves the padding one published step down the spacing scale; it does not shrink the type, the separation between two controls in the footer, or the card's touch target.",
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
    "initialFocus": {
      type: "\"safest\" | \"content\"",
      description: "Where focus lands when the dialog opens. `safest` puts it on the LAST control in `actions`, which is where the specification's own example puts the answer that changes nothing; `content` puts it on the first control inside `children`, for a dialog whose job is a short task rather than a question. Neither ever lands on the scrim or on the container while a control is available, and neither can be pointed at a destructive action without the caller ordering their actions the wrong way round.",
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
      description: "When the control's own constraints are checked. Governs the invalid state, not the `error` prop — a message the product passed in is a message the product has already decided to show. Defaults to `\"submit-then-change\"`: never tell somebody their answer is wrong while they are still typing it.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. Field lays its own parts out in a column and leaves the space BETWEEN fields to the form, which is the only place that knows how many there are.",
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
      description: "Traps focus and makes the page behind genuinely inert — not dimmed, but unreachable, by a pointer and by assistive technology alike. Non-modal does neither and is a different component wearing the same clothes; the flag exists so that the difference is declared rather than emergent.",
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
      description: "Merged onto the root. Shape belongs here: Surface sets no corner of its own, and every layer inside it inherits whatever radius the caller applies.",
      required: false,
    },
    "children": {
      type: "ReactNode",
      description: "Everything the surface holds.",
      required: true,
    },
  },
}

/** Interface name to the file it is exported from, relative to apps/www. */
export const PROPS_SOURCES: Record<string, string> = {
  "ButtonProps": "registry/bases/base/button.tsx",
  "CardBodyProps": "registry/bases/base/card.tsx",
  "CardFooterProps": "registry/bases/base/card.tsx",
  "CardHeaderProps": "registry/bases/base/card.tsx",
  "CardProps": "registry/bases/base/card.tsx",
  "DialogProps": "registry/bases/base/dialog.tsx",
  "FieldControlProps": "registry/bases/base/field.tsx",
  "FieldProps": "registry/bases/base/field.tsx",
  "SheetContentProps": "registry/bases/base/sheet.tsx",
  "SheetProps": "registry/bases/base/sheet.tsx",
  "StatusPillProps": "registry/bases/base/status-pill.tsx",
  "SurfaceProps": "registry/bases/base/surface.tsx",
}

export const PROPS_META: { interfaces: number; props: number } = {
  interfaces: 12,
  props: 62,
}
