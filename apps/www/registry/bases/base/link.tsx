/**
 * Link is the control that takes the reader somewhere else.
 *
 * IT IS THE OTHER HALF OF BUTTON. `button.tsx` says, at length, that a control
 * which produces a new URL is a link and refuses `href` on principle: a link can
 * be opened in a new tab, copied, and found in a screen reader's list of links,
 * and none of that survives being reimplemented as a button with a click
 * handler. This file is the component that other half points at. Between them the
 * system's anatomy rule, "a real <button>, or an <a> only when it navigates", is
 * finally implemented in full: Button owns the first clause and Link the second.
 *
 * WHY IT EXISTS RATHER THAN SIX PRIVATE ANCHORS. Before this file, six components
 * each shipped their own raw anchor with its own class string. `ACTION_LINK` was
 * byte-identical in `alert-banner.tsx`, `result-card.tsx` and `empty-state.tsx`,
 * `care-card.tsx` re-spelled Button's fills by hand, and `disclaimer-note.tsx`
 * carried a fifth. The visible consequence was two link treatments on one card:
 * a bordered action anchor beside an underlined one, with different focus rings,
 * underline offsets and target heights, because nothing made them agree. Link is
 * the one place those treatments are decided, so a banner's action and a card's
 * action are the same control on the same screen.
 *
 * WHY `emphasis` IS REQUIRED AND NOT DEFAULTED. It is the same refusal
 * `surface.tsx` makes for `rung`: there is no sensible default weight for a link,
 * and a component that guessed would put an action-weight box around a link that
 * wanted to sit inside a sentence, or leave a card's primary action reading as
 * body copy. A defaulted weight is a decision nobody made, so the caller makes it
 * every time.
 *
 * WHERE THE CLASS STRINGS COME FROM. `action` and `secondary` are the card
 * action recipe, so the anchor and the handler-form Button cannot drift: `action`
 * is `cardActionClassName({ weight: "recommended", ... })` and `secondary` is the
 * `quiet` weight, both from `button.tsx`. `inline` is Link's own. It began as
 * `disclaimer-note.tsx`'s underline-only form, but that form is a grid item and
 * carries a box and a target floor that are wrong inside a sentence, so `inline`
 * keeps only the parts an in-sentence link needs: `wrap-anywhere`, `underline
 * underline-offset-[0.25em]`, the one-pixel press and the focus ring, with no
 * box, no boundary and no floor. The `0.25em` offset rather than the
 * `underline-offset-4` step is deliberate, and the reason is written on
 * `disclaimer-note.tsx`: the step compiles to a flat `4px` while everything
 * around it is relative, so at 200% text a fixed offset walks the rule down into
 * the descenders. The floor is dropped because SC 2.5.8 exempts an inline target
 * and a 2.75rem floor would inflate the paragraph's line box.
 *
 * `ground` rides through to the recipe for `action` and `secondary` and is inert
 * for `inline`. On a neutral surface it leaves the default the six adopters used
 * to inline; on a status tint it hands the recipe the tinted arm, which brings no
 * neutral ink and, for `action`, a boundary whose colour the caller supplies per
 * level beside `className`. Nothing here names a status colour, and Link emits no
 * `data-status` and no `data-category`, because a link is on neither axis and the
 * two colour axes never meet on one element.
 *
 * WHY THE FOCUS RING IS IN THIS FILE. It is the reason `card.tsx` gives for
 * carrying its own: `app/product.css` already gives every `:focus-visible` an
 * outline, and a consumer's stylesheet may not. A link whose focus ring depends
 * on a file it was not installed with is a link that loses it silently, so every
 * emphasis carries the ring in its own class list.
 *
 * WHY THE RENDER SLOT, AND WHY `cloneElement` RATHER THAN A PRIMITIVE. A product
 * on Next or React Router routes client-side, and a raw `<a href>` gives it a
 * full page reload on every action. The `render` slot lets the product pass its
 * router's own link element and keep Link's contract on it: the emphasis classes,
 * the `data-slot` and the target floor. This is the escape hatch `Field.Control`
 * offers for a control opsinjs does not ship. `Field.Control` delegates to a Base
 * UI primitive that owns the render merge; there is no link primitive in Base UI
 * 1.7.0, so this file does the merge itself with `cloneElement`, which is a plain
 * function and keeps Link renderable on the server rather than forcing a client
 * boundary the anchor does not need. Link's own attributes win over the router
 * element's, exactly as `Field.Control` keeps the ids and aria it generated, and
 * the two class lists are joined rather than one deleting the other.
 */

import {
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"
import { cardActionClassName } from "@/registry/base-lyra/ui/button"

/**
 * The emphasis ladder, and it is required rather than defaulted. `inline` is a
 * link inside a sentence, underline only. `action` is a card's primary action,
 * the recommended weight of the card action recipe. `secondary` is the quiet
 * weight beside it. The three survive greyscale: `inline` has no box, `action`
 * has a bordered box at the larger type step, and `secondary` a smaller box with
 * none, so the ladder is a box and a boundary rather than a hue.
 */
type LinkEmphasis = "inline" | "action" | "secondary"

/**
 * The `inline` form. It is the underline-only link that reflows with the
 * paragraph it sits in, and it is a real inline box rather than the grid-item
 * anchor `disclaimer-note.tsx` ships. That anchor is `inline-flex` with a
 * `--opsin-target-minimum` floor and `items-center`, which is right for a cell
 * of its own grid but wrong dropped inside a sentence. `inline-flex` makes an
 * atomic inline-level box whose label cannot break across lines with the
 * sentence around it, and the floor forces the line box that holds it to about
 * 44px against roughly 24px for every other line, opening a visible gap
 * mid-paragraph. `justify-self-start` is inert outside a grid, which is the tell
 * that copying the grid form here was a copy rather than a re-read.
 *
 * So `inline` keeps only what an in-sentence link needs. `wrap-anywhere` is the
 * one value that reduces the anchor's min-content size, so a compound label in a
 * language that builds them does not scroll the page sideways at 200% text;
 * `underline-offset-[0.25em]` keeps the rule off the descenders because it grows
 * with the type where the flat `4px` step would not; `active:translate-y-px` is
 * the one-pixel press a touch reader gets; and the focus ring rides along for
 * the reason every emphasis carries it.
 *
 * The target floor is dropped here on purpose. SC 2.5.8 exempts an inline
 * target, and a 2.75rem floor would inflate the line box of the paragraph the
 * link sits in, which is the defect it would otherwise cause.
 * `accessibility/target-size-and-motor.mdx` records the exemption and asks that
 * it be named out loud where it is relied on. `action` and `secondary` keep the
 * floor because each is its own box; `inline` is not.
 */
const INLINE =
  "wrap-anywhere underline underline-offset-[0.25em] active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/**
 * The class list for one emphasis on one ground. `action` and `secondary` come
 * straight from the shared recipe so a link and its handler-form Button stay in
 * step; `inline` is Link's own and takes no ground.
 */
function classForEmphasis(emphasis: LinkEmphasis, ground: "neutral" | "tinted"): string {
  if (emphasis === "inline") return INLINE
  return cardActionClassName({
    weight: emphasis === "action" ? "recommended" : "quiet",
    ground,
    as: "link",
  })
}

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  /**
   * Required. Where the link goes. It is a string rather than optional, because a
   * link with no destination is a button, and that is a different component.
   */
  href: string
  /**
   * Required. The weight, and there is no default: `inline` for a link inside a
   * sentence, `action` for a card's primary action, `secondary` for the quiet one
   * beside it. There is no sensible default weight, and a guessed one is a
   * decision nobody made.
   */
  emphasis: LinkEmphasis
  /**
   * Whether the link sits on a neutral surface or a status tint. Only meaningful
   * for `action` and `secondary`. On `tinted` the recipe brings no neutral ink,
   * so the surface's own level ink shows through, and an `action` link takes a
   * boundary whose colour the caller supplies per level beside `className`.
   * Defaults to `neutral`.
   */
  ground?: "neutral" | "tinted"
  /**
   * The product's own router link element, rendered in place of the plain anchor
   * while keeping Link's classes, `data-slot` and target floor on it. Pass a
   * Next or React Router link here so navigation stays client-side rather than
   * reloading the page. Without it Link renders a real `<a href>`.
   */
  render?: ReactElement
  /**
   * Required. The link text, and the accessible name. Write it so it reads on its
   * own out of a screen reader's list of links: name the destination, never "click
   * here" or "read more".
   */
  children: ReactNode
}

export function Link({
  href,
  emphasis,
  ground = "neutral",
  render,
  className,
  children,
  ...rest
}: LinkProps) {
  const classes = cn(classForEmphasis(emphasis, ground), className)

  if (render && isValidElement(render)) {
    /* Link's own attributes win over the router element's, exactly as
       Field.Control keeps the ids it generated, and the class lists are joined
       so neither deletes the other. `cloneElement` replaces children, which is
       right: the label belongs to this component, not to the router element. */
    const renderClassName = (render.props as { className?: string }).className
    return cloneElement(
      render as ReactElement<Record<string, unknown>>,
      {
        href,
        "data-slot": "link",
        ...rest,
        className: cn(renderClassName, classes),
      },
      children,
    )
  }

  return (
    <a href={href} data-slot="link" {...rest} className={classes}>
      {children}
    </a>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows all three emphases together
 * on a neutral ground, because the only question worth answering at a glance is
 * whether the ladder reads as a ladder: an underline inside a sentence, a
 * bordered action, and a quieter one beside it, each meeting the target floor and
 * each taking the focus ring on keyboard focus.
 *
 * The labels name a fictional destination (ADR 0012). No number, no unit, and no
 * "click here": every label reads on its own out of a link list.
 */
export default function LinkDemo() {
  return (
    <div className="flex flex-col gap-opsin-4">
      <p className="m-0 text-opsin-body">
        Your readings are yours to keep, and you can{" "}
        <Link href="#example-destination" emphasis="inline">
          read how this example measurement is worked out
        </Link>{" "}
        before you share them.
      </p>
      <Link href="#example-destination" emphasis="action" className="self-start">
        Book a repeat example appointment
      </Link>
      <Link href="#example-destination" emphasis="secondary" className="self-start">
        Read about this example measurement
      </Link>
    </div>
  )
}
