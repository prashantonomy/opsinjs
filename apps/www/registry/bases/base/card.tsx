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

import type { ReactNode } from "react"

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
 * from the density at runtime: `p-${density === "compact" ? 4 : 5}` generates
 * no CSS and renders a card with no padding at all.
 *
 * WHERE THE 5 AND THE 4 COME FROM, AND WHICH SCALE THEY ARE ON. The two
 * numbers are borrowed from `tokens/space.json`, which publishes step 5 as
 * "card inner padding on a phone" and step 4 as the step below it. What ships
 * is not those steps. `p-5` and `p-4` are five and four multiples of Tailwind's
 * `--spacing`, which `app/product.css` sets to 0.28rem and the document's
 * `[data-density]` attribute moves to 0.24rem or 0.32rem; `p-opsin-5` and
 * `p-opsin-4` are the utilities that read the fixed tokens instead. So neither
 * rendered value is a published step and neither sits on the 4px grid, and this
 * file claims neither. The numbers carry the intent; the scale carries the
 * response to density.
 *
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
  compact: "p-4",
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
 * The boundary, for print.
 *
 * The rung paints its fill with a background and its edge with an inset
 * box-shadow, and a browser drops both when it prints unless the reader has
 * gone looking for the setting that keeps them. Left alone, every card on a
 * printed page loses its boundary. A printout is how a reading most often
 * reaches a clinician. A real border is the one boundary a printer keeps, so
 * the card grows one at print time and only at print time.
 */
const PRINT_BOUNDARY = "print:border print:border-border"

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
   * padding to four times `--spacing` rather than five, one multiplier down the
   * density-scaled spacing scale. It does not shrink the type, the separation
   * between two controls in the footer, or the card's touch target.
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
   */
  href?: string
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
  const material = (
    <Surface
      rung={rung}
      className={cn("h-full rounded-[inherit]", PADDING[density])}
    >
      {children}
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

       `group` is what lets the title underline on hover without knowing it is
       inside a link. It is a CSS ancestor relationship, so `Card.Title` needs
       no prop, no context and no client boundary to respond to it. */
    <a
      href={href}
      data-slot="card"
      className={cn(
        "group grid min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem)",
        "text-inherit no-underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        SHAPE,
        PRINT_BOUNDARY,
        className,
      )}
    >
      {material}
    </a>
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
        className="text-opsin-headline *:m-0 *:[font:inherit] group-hover:underline group-focus-visible:underline"
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
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the two things worth
 * seeing: the full anatomy with the page supplying its own heading level, and
 * the same card at the other density beside it, so the prop's effect is visible
 * as a difference rather than described as a percentage.
 *
 * There is not a number anywhere in it, and there is no status pill and no
 * category tint (ADR 0012). A Card holding a value, a coloured pill and a
 * paragraph is a ResultCard drawn without any of a ResultCard's guarantees, and
 * a demo that showed one would teach the mistake this component's boundary
 * exists to prevent.
 */
export default function CardDemo() {
  return (
    <div className="grid w-full max-w-lg gap-opsin-6 sm:grid-cols-2">
      <Card>
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
      </Card>

      <Card density="compact">
        <Card.Body>
          <p className="m-0 text-opsin-body">
            A card with only a body, at the compact density. One idea, one
            boundary, no ceremony.
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
