/**
 * Card is a boundary, some padding, and one rung of the material ladder.
 *
 * Card is the most-used component in any design system and the one that most
 * often becomes a dumping ground, so the interesting work here is what it
 * refuses. There is no `status`, no `variant` and no `color`: a Card that could
 * be tinted from the clinical axis would be a ResultCard with none of a
 * ResultCard's obligations. It would have no staleness treatment, no
 * attribution and no axis discipline, and nothing in review catches the
 * difference, because the two render identically.
 *
 * THE DEFAULT RUNG IS `card`, AND THE SPECIFICATION SAID `raised`. That page was
 * written against the retired rung vocabulary, where `raised` was the name for
 * the rung a resting block of content sits on. On the ladder the tokens
 * actually publish, `raised` is one rung higher. `tokens/material.json` gives
 * it a drop shadow and describes it as "menus, popovers, tooltips, a dragged
 * card". The rung named `card` is "the default home for a health value",
 * opaque and deliberately shadowless. Taking the old word literally would have
 * put a shadow under every resting card in the system, which is the exact
 * clutter that rung's note exists to prevent. So the default is `card` and the
 * page has been corrected rather than implemented. See ADR 0014.
 *
 * "Products may move a card down the ladder, never off it" survives that
 * correction and means what it says: `canvas` for a card that should read as
 * part of the page, `raised` while a card is being lifted, and never above
 * `raised`, because a number a reader is trying to read must not sit over a
 * moving backdrop. A card is being lifted when it is dragged or opened as a
 * menu.
 *
 * IT IS ONE OF EXACTLY THREE COMPONENTS WITH REAL COMPOUND PARTS. `Card.Header`,
 * `Card.Body` and `Card.Footer` are exported functions rather than `data-slot`
 * names, because the consumer supplies their content and no prop could carry
 * three ordered slots of arbitrary children. Everything else in the anatomy is
 * a `data-slot`, which is enough to style and not enough to take apart. That
 * covers the root, the title and the description. All three parts are optional:
 * a Card with only children is the common case and takes no ceremony at all.
 *
 * IT IS A SERVER COMPONENT. It holds no state, listens for nothing, and every
 * decision it makes is made from props at render time. The one thing a reader
 * can change underneath it is the density of the interface, and it arrives as a
 * CSS custom property on the document, not as a value this component reads.
 */

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"

import { ChevronRight } from "lucide-react"

import { isDevelopment, type MaterialRung } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { Surface } from "@/registry/base-lyra/ui/surface"

/**
 * The three rungs that composite what is behind them.
 *
 * A second copy of a fact `tokens/material.json` owns and `Surface` also holds,
 * and it is here rather than imported because a registry file's import surface
 * is closed: `Surface` exports its component, its props and its demo, and a
 * private lookup is not one of the three. The cost of the duplication is a
 * warning that goes quiet if a rung changes phase; the cost of avoiding it
 * would be a fourth public export on Surface that exists only for this check.
 *
 * The list is used for one thing: telling somebody that a Card has been asked
 * to be a layer. `choosing-a-layer` puts it plainly. A translucent rung may
 * never contain another translucent rung, and a card inside a sheet stays
 * opaque. `tokens/material.json` adds that a health value never goes above
 * `raised`. Both are rules a caller can break with one prop and never see.
 */
const TRANSLUCENT_RUNGS: MaterialRung[] = ["sheet", "overlay", "scrim"]

/**
 * Development warnings, said once per distinct offence.
 *
 * `tokens/errors.json` states the policy. Warnings are emitted in development
 * only, once per offending call site. The warning below lives in a render
 * body, so without a keyed set it repeats on every render and twice again
 * under Strict Mode. A card inside a list that re-renders on scroll would print
 * the same four sentences until the console is unusable, and a channel
 * somebody filters is a channel that no longer carries its one real finding.
 *
 * It is a module-local set rather than the substrate's `warnOnce` for the reason
 * the warning itself gives: `warnOnce` is keyed to an `OpsinErrorCode`, and no
 * code is allocated for a card asked to be a layer. Allocating one in
 * `tokens/errors.json` and deleting this is a strict improvement.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Padding, as literal class strings.
 *
 * Tailwind reads class names out of source as text, so this cannot be built
 * from the density at runtime: `p-${density === "compact" ? "4.375" : "5"}`
 * generates no CSS and renders a card with no padding at all.
 *
 * WHERE THE NUMBERS COME FROM, AND WHICH SCALE THEY ARE ON. Comfortable is
 * `p-5`, five multiples of Tailwind's `--spacing`. The 5 is borrowed from
 * `tokens/space.json`, which publishes step 5 as "card inner padding on a
 * phone". Compact is `calc(var(--spacing) * 4.375)`, which is 0.875 of the
 * comfortable padding. That 0.875 is the multiplier `tokens/space.json`
 * publishes for the compact density, so the card's own `density` prop and the
 * document's `[data-density]` attribute now tighten a card by the same fraction
 * rather than by two different ones. Both values ride `--spacing`, which
 * `app/product.css` sets to 0.25rem at the default density and scales by
 * `--opsin-density-scale` when the document asks for a denser interface;
 * `p-opsin-5` reads the fixed token step instead.
 *
 * At the default density comfortable renders 20px, which coincides with the
 * fixed step 5 and sits on the 4px grid; a denser document density shrinks
 * `--spacing` and both values fall off it. Compact is off the 4px grid at every
 * density: at the default density it is 17.5px, and 0.875 of `--spacing` is
 * never a whole multiple of 4px. That is the density-scaled scale, the one
 * exception `tokens/space.json` rules[0] names to the 4px guarantee, which
 * otherwise covers the fixed `--opsin-space-*` steps that density never moves.
 * The scaled scale is the choice rather than an oversight, and it is the one
 * place this component follows `app/product.css` rather than the token steps
 * directly: that file names "the inside of a card" as the canonical use of the
 * scaled scale, so a reader who asks for a denser interface gets one here. The
 * two controls multiply. A product asking for `compact` inside a document
 * already set to a compact density gets the tightest card the system offers,
 * and that is the intended floor rather than an accident.
 */
const PADDING: Record<"comfortable" | "compact", string> = {
  comfortable: "p-5",
  compact: "p-[calc(var(--spacing)*4.375)]",
}

/**
 * The corner, and the enhancement that rides on it.
 *
 * `radius-md` is what `tokens/shape.json` publishes as the default for cards.
 * A card that is nearly the width of a phone screen takes `radius-lg` instead,
 * and that is a caller's decision through `className` rather than a prop. It
 * depends on the layout the card is in, which this component cannot see.
 *
 * `corner-shape` is applied as a property rather than through the product
 * theme's `data-opsin-shape="squircle"` attribute, for two reasons. The
 * attribute is a fifth member of a data-attribute vocabulary that is closed at
 * four, and it lives in a stylesheet that does not travel with this file into a
 * consumer's project. An engine without `corner-shape` drops the declaration
 * and draws an ordinary rounded corner, which is the fallback `tokens/shape.json`
 * specifies and the reason every radius on the ladder is chosen to look correct
 * without it.
 */
const SHAPE = "rounded-opsin-md [corner-shape:var(--opsin-corner-shape)]"

/**
 * The boundary, for print and for forced colours.
 *
 * Surface draws the card's edge as an outline, and `forced-colors: active`
 * keeps an outline while recolouring it to CanvasText, so the card's boundary
 * survives forced colours on its own and this file adds nothing to carry it
 * there. No forced-colours border is added here for exactly that reason: D11
 * puts that boundary on the outline in Surface, where an outline is the
 * mechanism forced colours keeps and a border would be the wrong one.
 *
 * Print is not the same story, and the outline does not close it. A printer
 * keeps the outline as a mechanism, but draws it in the rung's own edge colour,
 * and for the default `card` rung that colour is `--opsin-material-card-border`,
 * a near-white hairline in the light theme that measures about 1.23:1 on white
 * paper and so is no boundary a reader can see. The theme's `@media print`
 * block inks the chrome roles and carries every rung to its opaque fill, but it
 * leaves `--opsin-material-*-border` at its screen value, so the outline never
 * reaches paper as a line. The boundary a reader on paper actually sees is
 * `print:border print:border-border`, whose `--border` the same print block
 * redeclares as printable ink. That makes this the primary print rule rather
 * than a second answer for the fill, and removing it on the theory that Surface
 * already carries the edge would return the card to a boundaryless printout.
 */
const PRINT_BOUNDARY = "print:border print:border-border"

/**
 * The class list for the link-card root, whether it is the plain anchor or the
 * product's router element rendered through `render`. It is lifted here so both
 * branches carry byte-identical classes: the whole card is one control, so the
 * `group/card` hover relationship, the target floor on both axes, the shape and
 * the print boundary must be the same regardless of which element navigates.
 * The reasoning behind each fragment is on the return branch below.
 */
const LINK_ROOT_CLASS = cn(
  "group/card grid min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)",
  "text-inherit no-underline",
  "active:translate-y-px",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  SHAPE,
  PRINT_BOUNDARY,
)

export interface CardProps {
  /**
   * Which rung of the material ladder. Defaults to `"card"`. That rung is named
   * for this component, opaque and deliberately shadowless. Products may move a
   * card down the ladder to `"canvas"`, or up to `"raised"` while it is being
   * lifted, and never above that: a value a reader is trying to read must not
   * sit over a moving backdrop.
   *
   * @default "card"
   */
  rung?: MaterialRung
  /**
   * Padding scale. Affects space only, never type size. `"compact"` drops the
   * padding to 0.875 of the comfortable padding, the same fraction
   * `tokens/space.json` publishes for the compact density, on the density-scaled
   * spacing scale. It does not shrink the type, the separation between two
   * controls in the footer, or the card's touch target.
   *
   * @default "comfortable"
   */
  density?: "comfortable" | "compact"
  /**
   * Makes the whole card a single link. A card that is a link may hold no other
   * interactive element: a reader cannot tell what tapping the gap between two
   * buttons will do, and a keyboard user reaches controls that are nested
   * inside a control. TypeScript cannot express that exclusion, because
   * `children` is a `ReactNode` and an element's interactivity is not in its
   * type. So it is a rule this component states and does not enforce.
   *
   * A link card carries a resting cue the whole audience can read: a trailing
   * chevron in the material's content row, visible with no pointer and no
   * focus. It is `aria-hidden`, because the anchor's accessible name is already
   * its whole text content. The hover, focus-visible and press title underline
   * stays as well, now an addition rather than the only signal. `group-active`
   * is what holds it through the press instead of dropping when an engine stops
   * matching `:hover` on pointerdown.
   */
  href?: string
  /**
   * The product's own router link element, rendered in place of the plain
   * anchor while the card keeps its `data-slot`, its shape, the target floor and
   * the `group/card` hover relationship on it. Pass a Next or React Router link
   * here so a linked card navigates client-side rather than reloading the whole
   * page. It takes the element itself and not the function form Base UI parts
   * accept, and it is only meaningful alongside `href`. In development a
   * `render` passed without `href`, or one that is not a React element, warns
   * once and the card falls back to the plain anchor.
   *
   * This is the escape hatch `Link` offers, and it is the only half of that
   * component a card takes. Five components that shipped a private anchor moved
   * to `Link` outright, because their anchor was a control inside the card: an
   * action a reader chooses among others. A card's anchor is not that. The
   * whole card is the target, so the element is the card rather than a control
   * inside it, and it carries `data-slot="card"`. Wrapping it in a `Link` would
   * move `data-slot` onto a foreign root and put an action link's box and
   * underline around a whole card, which is why this file keeps its own anchor
   * and borrows only the `render` slot.
   */
  render?: ReactElement
  /**
   * Merged onto the root. Layout belongs here: a card sets no width, no
   * position and no place in a grid, because those are decisions of the screen
   * it is on rather than of the card.
   */
  className?: string
  /**
   * Everything the card holds. Usually that is `Card.Header`, `Card.Body` and
   * `Card.Footer`, and equally correctly it is a single paragraph.
   */
  children: ReactNode
}

export function Card({
  rung = "card",
  density = "comfortable",
  href,
  render,
  className,
  children,
}: CardProps) {
  /* Not an OPSIN code. `tokens/errors.json` has no entry for a card asked to be
     a layer, and a component may not mint one. The codes are a versioned
     contract and the table on the errors page is generated from that file. A
     development warning is the honest channel until one exists.

     It warns and renders. A rung that is legal for a Surface is legal here; the
     mistake is a composition mistake rather than a broken value, and taking a
     reader's content off the screen to report one would be the larger error.
     A rung outside the six is not checked here at all: Surface already warns
     about it, names the retired rung the caller probably meant, and renders the
     children with no material, and a second warning would only make the first
     harder to read. */
  if (TRANSLUCENT_RUNGS.includes(rung)) {
    warnDev(
      `translucent-rung:${rung}`,
      `[opsinjs] <Card rung="${rung}"> puts a card on a translucent rung. A card ` +
        "is a block of content on the page, not a layer over it: `sheet`, " +
        "`overlay` and `scrim` composite what is behind them, and a card on one " +
        "of them costs a blur, dissolves into whatever is scrolling underneath, " +
        "and may not hold a health value at all. Use `card`, `canvas`, or " +
        "`raised` while the card is being lifted. If you want the layer itself, " +
        "the component is <Surface>. " +
        "See /docs/foundations/materials/choosing-a-layer.",
    )
  }

  /* `render` is consulted only on the link branch, and only when it is a real
     element. A value that misses either condition is otherwise discarded in
     silence: a `render` without `href` never reaches the static branch's
     return, and a `render` that is not an element falls through to the plain
     `<a>`. Both leave a product shipping a full page load from a card it meant
     to route client-side, with nothing in the console. The likely mistake is
     the function form, because the composition-and-render handbook shows every
     Base UI part taking `render={(props) => <MyLink {...props} />}`, and Card's
     slot takes the element itself. These are the same one-prop mistakes the rung
     warning above catches, so they take the same dev-only channel and key. */
  if (render !== undefined) {
    if (href === undefined) {
      warnDev(
        "render-without-href",
        "[opsinjs] <Card render={...}> was passed without `href`. The render " +
          "slot replaces the card's own anchor, so a card that is not a link " +
          "has no element for the router link to become and the slot does " +
          "nothing. Add `href` to make the card a link, or drop `render`.",
      )
    } else if (!isValidElement(render)) {
      warnDev(
        "render-not-element",
        "[opsinjs] <Card render={...}> was given a value that is not a React " +
          "element. Card's slot takes an element, for example " +
          "<NextLink href={href} />, and not the function form that Base UI " +
          "parts accept. The card has fallen back to a plain anchor and will " +
          "navigate with a full page load. " +
          "See /docs/handbook/composition-and-render.",
      )
    }
  }

  /* The material is a child rather than the root, which is what Surface's own
     page asks for: a component that needs a different element wraps a Surface
     instead of becoming one. It also has to be, because the root carries
     `data-slot="card"` and a Surface root carries `data-slot="surface"`, and
     one element cannot carry both.

     The padding goes on the Surface, not on the wrapper. Surface's three
     decorative layers are absolutely positioned to `inset-0`, whose containing
     block is the padding box, so the fill and the edge cover the padding rather
     than being inset from it. Padding the wrapper instead would leave a card
     with a boundary drawn inside its own whitespace.

     `h-full` needs the root to give it a definite height, and only two things
     do. One is a parent grid or flex row stretching the card. The other is the
     link root below being a grid itself. Without one of those the percentage
     resolves against an auto height, computes to `auto`, and the material is
     content-sized while the root is taller. That is visible rather than
     theoretical: the fill and the edge are `inset-0` OF THE SURFACE, so a root
     held open by the 44px floor would draw its boundary short of its own
     bottom edge. */
  /* When the card is a link, the material's content is laid out as a two-column
     row so a resting chevron sits at the trailing edge. Surface's content layer
     is a bare `relative` div with no layout of its own, so the card lays its own
     content out inside it. The chevron is the resting affordance a link card
     needs: it is visible with no pointer and no focus, so a person scanning a
     list on a phone can tell a tappable card from a static one before touching
     anything, and it survives touch, dark theme, greyscale and print. It is the
     trailing-glyph convention this audience already knows from iOS lists. It is
     `aria-hidden` because the anchor's accessible name is already its whole text
     content, so the glyph would only repeat that name to a screen reader.
     `gap-opsin-3` is the fixed spacing step rather than the density-scaled one,
     so the glyph never collides with a title when a reader asks for a denser
     interface; `size-[1.25em]` grows with the reader's text size; `min-w-0` on
     the content cell is what stops a long title from pushing the glyph off the
     card. The hover, focus-visible and press underline on the title stays as
     an addition, no longer the only signal that the card leads somewhere. */
  const surfaceChildren =
    href === undefined ? (
      children
    ) : (
      <div
        data-slot="card-link-row"
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-opsin-3"
      >
        <div className="min-w-0">{children}</div>
        <ChevronRight
          aria-hidden="true"
          className="size-[1.25em] shrink-0 text-muted-foreground"
        />
      </div>
    )

  const material = (
    <Surface
      rung={rung}
      className={cn("h-full rounded-[inherit]", PADDING[density])}
    >
      {surfaceChildren}
    </Surface>
  )

  if (href === undefined) {
    return (
      <div
        data-slot="card"
        className={cn(SHAPE, PRINT_BOUNDARY, className)}
      >
        {material}
      </div>
    )
  }

  return (
    /* One control, and everything that follows from that.
       `min-h-` and `min-w-(--opsin-target-minimum)` carry the 44px floor in the
       component rather than relying on the product theme's
       `a[data-opsin-target]` backstop: that attribute is outside the
       four-attribute vocabulary a component may stamp, and the stylesheet
       declaring it does not travel with this file into somebody else's project.
       BOTH AXES, because the backstop sets both and the layout half of the
       accessibility rig measures both. A card is usually far wider than its
       floor, but a link card dropped into a narrow grid column is not, and a
       floor that holds on one axis is not a floor. The token is rem, so it
       grows when a reader raises their text size instead of pinning at 44
       device pixels.

       THE `2.75rem` INSIDE THE `var()` IS LOAD-BEARING, and for the same reason
       the backstop is not trusted: `--opsin-target-minimum` is declared only in
       `app/tokens.generated.css`, which does not travel with this file. Written
       bare, `min-h-(--opsin-target-minimum)` is invalid at computed-value time
       in a project that installed the card without the token sheet, `min-height`
       reverts to `auto`, and the floor this comment is about disappears with no
       error anywhere.

       `grid` rather than `block` is what makes the material fill the floor. A
       single grid item stretches on both axes by default, so the Surface
       reaches the bottom of a root that the 44px minimum is holding open, and
       with it the fill, the edge and the padding. As `block` the Surface would
       be content-sized inside a taller root, and the boundary would stop short
       of the focus ring drawn around the whole of it.

       The focus ring is declared here for the same reason. `app/product.css`
       already gives every `:focus-visible` an outline, and a consumer's
       stylesheet may not; a card whose focus ring depends on a file it was not
       installed with is a card that loses it silently.

       `group/card` is what lets the title underline on hover, on focus-visible
       and through a press without knowing it is inside a link. It is a CSS ancestor relationship, so `Card.Title`
       needs no prop, no context and no client boundary to respond to it. The
       group is NAMED rather than the bare `group`, and that is not cosmetic: an
       unnamed `group-*` variant matches any ancestor carrying `.group`, and
       `group` is one of the most common class names in a consumer's layout, so
       a static card dropped inside a hovered list row or table cell would
       underline its title from a stylesheet Card never saw, wearing link
       affordance it does not have. `group/card` matches only this anchor. That
       underline is no longer the only cue: the material lays a trailing chevron
       into its content row so the link is legible at rest and on touch, where
       there is no hover, and the underline is now the pointer-and-keyboard
       addition on top of it.

       `active:translate-y-px` is the press acknowledgement, the same one-pixel
       shift Button ships and for the same reason: a transform is instantaneous,
       which is the timing interaction-states asks of a press, so it carries no
       transition. The press does NOT tint the fill. The obvious move, an
       `:active` background on this anchor, cannot reach the fill a Card shows,
       because that fill is Surface's `--opsinjs-surface-tint` written as an
       inline style on Surface's own root, and an inline style beats any custom
       property an ancestor sets. So the derived state fills the system defines
       are unreachable from here, and the transform is the honest cue. The
       static `div` branch above takes none of this: a card that is not a
       control has no press state.

       The `render` slot rides on this branch and nowhere else. When a product
       passes its router's link element, that element takes the whole
       `LINK_ROOT_CLASS` list this comment describes, the `data-slot`, the
       target floor and the `group/card` hover relationship, exactly as the
       plain `<a>` would, so a linked card renders
       identically whether it navigates client-side or reloads the page. The
       merge is `cloneElement` rather than a Base UI primitive for the reason
       `Link` gives: there is no link primitive to delegate to, `cloneElement`
       is a plain function that keeps the card renderable on the server, and
       Card's own attributes win over the router element's while the two class
       lists are joined so neither deletes the other. It stays on this anchor
       branch because only a link card has an anchor to replace; the static
       `div` has nothing for a router element to become. */
    render && isValidElement(render) ? (
      cloneElement(
        render as ReactElement<Record<string, unknown>>,
        {
          href,
          "data-slot": "card",
          className: cn(
            (render.props as { className?: string }).className,
            LINK_ROOT_CLASS,
            className,
          ),
        },
        material,
      )
    ) : (
      <a
        href={href}
        data-slot="card"
        className={cn(LINK_ROOT_CLASS, className)}
      >
        {material}
      </a>
    )
  )
}

/**
 * Vertical rhythm between the parts, as a class every part carries.
 *
 * `:not(:first-child)` rather than a gap on a flex parent, because the parent
 * is Surface's content layer and this component does not reach inside another
 * component to lay out its children. Step 4 is what `tokens/space.json`
 * publishes as "the default gap between elements inside a card", on the same
 * density-scaled scale as the padding, so the two move together.
 */
const PART_RHYTHM = "[&:not(:first-child)]:mt-4"

export interface CardHeaderProps {
  /**
   * The card's title. Pass the heading element the page's outline needs, and
   * the slot takes care of how it looks. `<h3>Recent readings</h3>` is the
   * shape it takes. Pass a string instead and the title is styled text with no
   * place in the outline, which is a legitimate choice for a card nobody needs
   * to navigate to and a mistake for one they do.
   */
  title: ReactNode
  /**
   * One supporting line under the title. It renders a paragraph, so it takes
   * text or inline content rather than a block element.
   */
  description?: ReactNode
  /** Anything else the header holds, after the title and the description. */
  children?: ReactNode
  /** Merged onto the header. */
  className?: string
}

export function CardHeader({
  title,
  description,
  children,
  className,
}: CardHeaderProps) {
  return (
    <div data-slot="card-header" className={cn(PART_RHYTHM, className)}>
      {/* THE HEADING LEVEL IS THE PAGE'S AND THE APPEARANCE IS THE CARD'S, and
          the two lines below are what keeps them separate. A card that hard-codes
          its own level produces an outline that jumps from h1 to h3, or a screen
          of eleven h2s, depending on which mistake the library made; a card that
          takes the level as a number is the same mistake with an extra prop. So
          the caller passes the element.

          The reset is what makes that safe. Left alone a browser gives an `h3`
          its own size, weight and margins, so the same title would be a
          different size in a card under an h2 and a card under an h4. The
          level would be carrying visual weight it is not entitled to. `font`
          and `margin` are reset on the direct children only, which is exactly
          the element the caller passed. */}
      <div
        data-slot="card-title"
        className="text-opsin-headline *:m-0 *:[font:inherit] group-hover/card:underline group-focus-visible/card:underline group-active/card:underline"
      >
        {title}
      </div>
      {/* `undefined` AND `null`, because `description` is a `ReactNode` and
          both spellings type-check. `description={subtitle ?? null}` is the
          ordinary way a caller says "there is no subtitle", and guarding on
          `undefined` alone answers it with an empty paragraph carrying `mt-2`.
          That is a blank gap substituted for an absence, which is the shape
          this system refuses everywhere else. */}
      {description === undefined || description === null ? null : (
        <p
          data-slot="card-description"
          className="mt-2 mb-0 text-opsin-footnote text-muted-foreground"
        >
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

export interface CardBodyProps {
  /** The content. */
  children: ReactNode
  /** Merged onto the body. */
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div data-slot="card-body" className={cn(PART_RHYTHM, className)}>
      {children}
    </div>
  )
}

export interface CardFooterProps {
  /** Actions or metadata. */
  children: ReactNode
  /** Merged onto the footer. */
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        /* The token the documentation names, read directly, rather than a
           spacing step that happens to equal it today.
           `--opsin-target-separation` is the published minimum gap between two
           adjacent controls, and a footer with two buttons in it is exactly the
           case it was published for. `gap-opsin-2` would render the same 0.5rem
           and would keep rendering it if `tokens/space.json` ever raised the
           separation floor. That divergence is one no gate in the system
           measures, because both halves of the rig read elements and not gaps.

           It is the fixed scale rather than `gap-2` for the reason the prop
           documentation gives: padding may tighten when somebody asks for a
           denser interface; the distance between two things a thumb has to hit
           may not. */
        "flex flex-wrap items-center gap-(--opsin-target-separation,0.5rem)",
        PART_RHYTHM,
        className,
      )}
    >
      {children}
    </div>
  )
}

/* The compound parts, assigned after their declarations rather than through
   Object.assign, so each one keeps its own name in a stack trace and in React
   devtools. `Card.Header` and `CardHeader` are the same function; the dotted
   spelling is the one the anatomy uses and the one to write. */
Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

/**
 * The content both demo cards show, lifted out so density is the only variable.
 *
 * The finding this answers is that two cards which differ in content as well as
 * in density teach nothing about the prop: a reader cannot tell which of the
 * two changes moved the text. So the header, body and footer live here once and
 * render into both cards below, and the only thing that differs between the two
 * is the `density` prop. The heading stays an `<h3>` the demo supplies, because
 * a card takes its level from the page's outline rather than owning one.
 */
function DemoCardContent() {
  return (
    <>
      <Card.Header
        title={<h3>Example section</h3>}
        description="One supporting line, which stays when the card is tight."
      />
      <Card.Body>
        <p className="m-0 text-opsin-body">
          The body is whatever the card is for. It has no contract of its own,
          which is the point: a card that knew what was inside it would be a
          different component.
        </p>
      </Card.Body>
      <Card.Footer>
        <span className="text-opsin-footnote text-muted-foreground">
          Example metadata
        </span>
      </Card.Footer>
    </>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows one thing worth seeing: the
 * same card, full anatomy and all, at both densities side by side. Nothing else
 * differs between the two cards, so the `density` prop reads as a difference a
 * reader can point at rather than as a percentage described in prose. The
 * shared content is lifted into `DemoCardContent` and rendered into both, which
 * is what keeps density the only variable.
 *
 * There is not a number anywhere in it, and there is no status pill and no
 * category tint (ADR 0012). A Card holding a value, a coloured pill and a
 * paragraph is a ResultCard drawn without any of a ResultCard's guarantees, and
 * a demo that showed one would teach the mistake this component's boundary
 * exists to prevent.
 */
export default function CardDemo() {
  return (
    /* `items-start` rather than the grid's default `align-items: stretch`. The
       two cards are a density comparison, so their difference is height: the
       compact card has less padding and is the shorter of the two. A stretched
       grid item would grow the shorter card to its neighbour's height, filling
       it with empty space and erasing the very difference this demo exists to
       show. Do not swap this for `h-full` on either card: that is the opposite
       instruction, and the `h-full` on the Surface inside Card is a different
       mechanism that stays. */
    <div className="grid w-full max-w-lg items-start gap-opsin-6 sm:grid-cols-2">
      {/* The corner is the layout's decision rather than the card's, which is
          why it rides on `className` and is not a prop. `tokens/shape.json` gives
          `radius-lg` the use "cards on a phone, where the card is nearly the
          width of the screen", and below the `sm` breakpoint this demo is a
          single full-width column, so each card is exactly that case and takes
          `radius-lg`. At `sm` it becomes a two-column grid, each card is no
          longer near the screen's width, and it falls back to Card's own
          `radius-md` default. So the demo models the phone-width rung of the
          ladder rather than silently taking the one radius the component ships.

          The override is important because `cn()` merges through
          `tailwind-merge`, which is not taught the `opsin-radius` scale and so
          keeps both this class and `SHAPE`'s `rounded-opsin-md`. The two then
          reach the element at equal weight, and named radii are emitted in
          alphabetical order, so `md` lands after `lg` and would win by source
          order, leaving a plain `rounded-opsin-lg` inert. The important flag is
          how the caller's radius takes the corner back. The root cause is in
          `lib/utils.ts`. */}
      <Card className="max-sm:rounded-opsin-lg!">
        <DemoCardContent />
      </Card>

      <Card density="compact" className="max-sm:rounded-opsin-lg!">
        <DemoCardContent />
      </Card>
    </div>
  )
}
