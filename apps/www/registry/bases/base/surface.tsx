/**
 * Surface is the material a layer is made of, and the promise that whatever
 * sits on it stays readable.
 *
 * THE RUNG NAMES ARE THE TOKEN NAMES (ADR 0014). `canvas`, `card`, `raised`,
 * `sheet`, `overlay`, `scrim`. Three documents named these six rungs three
 * different ways and the token source won, because it is the only one a
 * stylesheet resolves: every value below is a `--opsin-material-<rung>-*`
 * custom property emitted from `tokens/material.json`. The union this component
 * takes is imported from `@/lib/opsinjs` rather than declared here, so there is
 * one list and it is the list the CSS has.
 *
 * The trap in that renaming is worth stating before anybody translates an older
 * design file: `raised`, `sheet` and `overlay` appear in the retired vocabulary
 * AND in this one, and two of them mean a different depth. The retired set's
 * `overlay` covered the page while leaving it recognisable, and that job is
 * this ladder's `sheet`. This ladder's `overlay` is chrome that content scrolls
 * beneath, a pinned toolbar or a tab bar. Mapping by ordinal lands a
 * dismissible sheet on the chrome rung and a tab bar on the sheet rung, and
 * both compile.
 *
 * WHAT THIS COMPONENT ACTUALLY OWNS, given that the token layer already does
 * most of the work. `app/tokens.generated.css` emits a
 * `@media (prefers-reduced-transparency: reduce)` block for all six rungs that
 * swaps `-tint` to `-opaque`, forces `-tint-alpha` to 1 and drops `-blur` to 0,
 * deliberately leaving `-border`, `-shadow` and the geometry alone. So the
 * scrim needs no reduced-transparency handling from this file at all: it reads
 * the same two custom properties in both states and gets the right answer.
 *
 * The one thing a stylesheet cannot do is remove an element. A backdrop whose
 * filter has collapsed to `blur(0px) saturate(1)` is still a backdrop root: the
 * browser still snapshots what is behind it and still promotes the layer, on a
 * rung that has asked not to be composited at all. That is the part this
 * component owns, and it is why `Surface.Backdrop` is not rendered on an opaque
 * rung and is removed from the render under reduced transparency, under
 * increased contrast, and where `backdrop-filter` is unavailable.
 *
 * IT IS A SERVER COMPONENT, and that is a requirement rather than an
 * optimisation. Every state it has is a user preference or an engine
 * capability, and each one is answered by a media or support query in CSS.
 * Those states are reduced transparency, increased contrast and the absence of
 * `backdrop-filter`. Reading any of them in JavaScript would mean rendering the
 * wrong material on the server and correcting it after hydration, which is a
 * visible flash of the wrong depth on the surface a health value is sitting on.
 */

import type { CSSProperties, ReactNode } from "react"

import { isDevelopment, type MaterialRung } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * Which rungs composite what is behind them.
 *
 * This is the one structural fact about the ladder that lives in this file
 * rather than in the tokens, and it is here because it decides whether an
 * ELEMENT exists. That is a decision CSS cannot express from a custom
 * property's value. Everything else about a rung (its tint, alpha, blur,
 * saturation, border and shadow) is read through `var()` and is never copied
 * here.
 *
 * `Record<MaterialRung, boolean>` on purpose: adding a rung to the union
 * without answering this question is a compile error rather than a surface that
 * silently renders with no backdrop. The drift this cannot catch is a rung that
 * changes its mind. If `tokens/material.json` flipped `raised` to
 * `translucent: true`, this file would keep it opaque and the rung would render
 * its tint with no blur behind it. That shows up as a flat panel where a
 * frosted one was expected, and the fix is one line here.
 */
const TRANSLUCENT: Record<MaterialRung, boolean> = {
  canvas: false,
  card: false,
  raised: false,
  sheet: true,
  overlay: true,
  scrim: true,
}

/**
 * The three rung names that exist only in the retired vocabulary, and the rung
 * each one meant, matched by JOB rather than by position on the ladder.
 *
 * The job each retired name did, spelled out, because this table is the one
 * place a by-position translation can be introduced silently and it has been
 * once already: retired `base` was the page itself, which is `canvas`; retired
 * `panel` was a layer lifted above the page without covering it, which is
 * `raised`; retired `chrome` was a pinned toolbar or tab bar, which is
 * `overlay`. It must stay in step with the translation table on
 * `content/docs/components/surface.mdx`, and the row to check first is `panel`.
 * The retired vocabulary also had a `raised`, meaning a bounded block of
 * content, and taking that row's answer lands a lifted panel one rung too low
 * on the flat `card` material.
 *
 * Only three of the six can be caught here. `raised`, `sheet` and `overlay` are
 * spelled the same in both vocabularies, so a component cannot tell a caller
 * who meant this ladder from one who meant the other. That is exactly why the
 * page says a search-and-replace is not a safe translation.
 */
const RENAMED_RUNGS: Record<string, MaterialRung> = {
  base: "canvas",
  panel: "raised",
  chrome: "overlay",
}

/**
 * This file ships as source into JavaScript projects, where the union is
 * advice. A rung outside the six resolves no tokens at all, so there is no
 * material to draw and no honest guess to make.
 */
function isMaterialRung(value: unknown): value is MaterialRung {
  return typeof value === "string" && Object.hasOwn(TRANSLUCENT, value)
}

/**
 * The complaints this file has already made, so it makes each of them once.
 *
 * Not `warnOnce`, and the reason is the same one the rung warning gives below:
 * `tokens/errors.json` has no code for either of these mistakes, a component
 * may not mint one, and `warnOnce` is keyed on a code. What can be borrowed
 * from it is the policy. `tokens/errors.json` says a warning fires once per
 * offending call site, because a repeated identical complaint teaches nothing
 * and drowns the next one, and an unrecognised rung inside a mapped list
 * otherwise prints once per row per render pass.
 *
 * Module scope in a server component is shared between requests. For anything
 * that touches a reader's screen that is a disqualifying property, and it is
 * the reason this file refuses to count composited surfaces. Here it is
 * harmless. The only thing this set ever holds is a rung or weight string a
 * developer typed into a prop, nothing is written to it outside a development
 * build, and one request silencing a repeat of the same complaint in the next
 * is the behaviour `warnOnce` already has.
 */
const warnedKeys = new Set<string>()

/**
 * Bounded, because a development server can run for days and this set is never
 * cleared. Reaching sixteen distinct malformed values in one session means the
 * report has already been made several times over; going quiet is better than
 * growing without limit.
 */
const MAX_WARNED_KEYS = 16

function warnOncePerSession(key: string, message: string): void {
  if (!isDevelopment()) return
  if (warnedKeys.has(key) || warnedKeys.size >= MAX_WARNED_KEYS) return
  warnedKeys.add(key)
  try {
    console.warn(`[opsinjs] ${message}`)
  } catch {
    /* A patched console is not a reason to take a health product down. */
  }
}

/**
 * The opacity the scrim has to reach for this rung, as a CSS expression over
 * the rung's own tokens.
 *
 * `max()` rather than either token alone, and the reason is the whole point of
 * the part. `-tint-alpha` is how the rung wants to look; `-scrim` is the
 * minimum opacity `tokens/material.json` publishes for it. That is what "the
 * scrim cannot be removed by any prop" means in code: there is no prop, and
 * there is also no token value, that takes this below the published floor.
 *
 * THE EXPRESSION IS NOT A NO-OP, and an earlier version of this comment said it
 * was. `app/tokens.generated.css` emits `-scrim` in the `:root` block only; the
 * dark block redeclares `-tint`, `-tint-alpha`, `-border` and `-opaque` and
 * never redeclares `-scrim`. So the floor is theme-agnostic while the tint alpha
 * is not, and in dark theme it currently binds on `sheet` and on `overlay`,
 * whose dark `tintAlpha` values sit below the single published floor and are
 * raised to it here. The direction is safe, because more opaque is more
 * readable. A maintainer must nevertheless not read this expression as
 * removable, and whether `minScrimOpacity` should be published per theme the
 * way `tintAlpha` is, is a question for the token owner rather than for this
 * file.
 */
function publishedScrimFloor(rung: MaterialRung): string {
  return `max(var(--opsin-material-${rung}-tint-alpha), var(--opsin-material-${rung}-scrim))`
}

/**
 * The weights a scrim floor is published for.
 *
 * Written out again in `SurfaceProps.contentWeight` rather than referred to by
 * name, deliberately: `lib/generated/props.ts` records a prop's type as the
 * source text of its annotation, so a local alias would publish an API-reference
 * row naming a type a consumer cannot import. This alias is for the record and
 * the guard below, which are internal.
 */
type ContentWeight = "body" | "large"

/**
 * The floor each content weight has to clear.
 *
 * BOTH ENTRIES ARE THE SAME EXPRESSION, and that is the finding rather than an
 * oversight. `tokens/material.json` publishes one `minScrimOpacity` per rung,
 * and the figures published beside it are measured against that rung's OPAQUE
 * FALLBACK. That fallback is the material as it renders once translucency is
 * gone, which is the degraded path rather than the translucent one. There is
 * no second, thinner floor for large text anywhere in the token source, and a
 * component is not allowed to invent one: a number that decides whether
 * somebody can read their own result is measured or it does not exist. So
 * `contentWeight="large"` is accepted, is honoured as a promise about the
 * content, and takes the body floor until a large-text floor is published. A
 * surface that is more readable than it needs to be is not a defect; the other
 * direction is.
 */
const SCRIM_FLOOR: Record<ContentWeight, (rung: MaterialRung) => string> = {
  body: publishedScrimFloor,
  large: publishedScrimFloor,
}

/**
 * The weight to resolve a floor for, defaulting to `body` for anything outside
 * the union.
 *
 * `SCRIM_FLOOR[contentWeight](rung)` on an unchecked value is a TypeError, not a
 * styling mistake: `undefined(rung)` throws during render and takes the nearest
 * error boundary's whole subtree with it. A Surface's subtree is, by design,
 * somebody's readings. That is a strictly worse outcome than the one
 * the `rung` guard exists to prevent, and the default parameter does not cover
 * it, because a default fires on `undefined` alone and not on `null`, `"Body"`
 * or a weight that was renamed upstream.
 *
 * Falling back to `body` changes nothing rendered while both entries resolve to
 * the same expression, and it is the stricter of the two if they ever diverge,
 * so the repair is always in the readable direction. It is a warning rather
 * than a refusal for the same reason the unrecognised rung is: the mistake is
 * in a styling prop, and taking a reader's own data off the screen to report
 * one is the worse of the two outcomes.
 */
function resolveContentWeight(value: unknown): ContentWeight {
  if (value === "body" || value === "large") return value
  warnOncePerSession(
    `contentWeight:${String(value)}`,
    `<Surface> received contentWeight="${String(value)}", which is not "body" ` +
      'or "large". The body floor was used, which is the stricter of the two, ' +
      "so nothing on this surface is less readable than it should be. The " +
      "prop is nevertheless not recording what you meant.",
  )
  return "body"
}

/**
 * The custom properties the root sets and the three decorative layers read.
 *
 * They exist so that every conditional state is a CSS declaration on the layer
 * that needs it rather than a branch in JavaScript. The layers set their
 * regular properties through `style`, and the variants below override these
 * custom properties with a class. A declaration on the element always beats an
 * inherited value, so the two never fight, and an inline `style` never has to
 * lose to a class it cannot see.
 *
 * They are internal plumbing, not a public theming API. Restyle a Surface
 * through its `data-slot` parts or through the `--opsin-material-*` tokens,
 * which are versioned; these names are not.
 */
interface SurfaceStyle extends CSSProperties {
  "--opsinjs-surface-tint": string
  "--opsinjs-surface-opaque": string
  "--opsinjs-surface-alpha": string
  "--opsinjs-surface-blur": string
  "--opsinjs-surface-saturation": string
  "--opsinjs-surface-edge": string
  "--opsinjs-surface-edge-width": string
}

/**
 * The filter, written once and used twice. Safari carried `backdrop-filter`
 * behind the `-webkit-` prefix until version 18, and the tested floor for this
 * system is Safari 16.4. So the prefixed spelling is not legacy politeness but
 * the difference between a blurred sheet and an opaque one for readers on a
 * phone they have not replaced.
 */
const BACKDROP_FILTER =
  "blur(var(--opsinjs-surface-blur)) saturate(var(--opsinjs-surface-saturation))"

export interface SurfaceProps {
  /**
   * Which rung of the material ladder. Required: there is no sensible default
   * depth, and a component that guessed would put a surface at the wrong height
   * silently. The names are the token names: `canvas`, `card`, `raised`,
   * `sheet`, `overlay` and `scrim`.
   */
  rung: MaterialRung
  /**
   * Whether content on this surface has to clear the floor for body text or
   * only for large text. Defaults to `"body"`, which is the stricter of the
   * two. Both take the published floor today, because the token source measures
   * one floor per rung.
   */
  contentWeight?: "body" | "large"
  /**
   * Renders the rung's opaque fallback regardless of engine or preference. This
   * is the path for print and export, where there is no backdrop to see through
   * and a translucent tint composites against paper.
   */
  opaque?: boolean
  /**
   * Merged onto the root. Shape belongs here: Surface sets no corner of its
   * own, and every layer inside it inherits whatever radius the caller applies.
   *
   * It is also unrestricted, so it is the one prop through which a caller can
   * put colour on a Surface, and the two-colour-axes rule applies to it in full:
   * a Surface may take a category tint or sit under a status, never both. A
   * category-tinted Surface renders its status as a StatusPill inside it rather
   * than as a tint on the root. Both axes on one element is OPSIN-0001, and this
   * component cannot detect it. `cn` merges whatever it is handed.
   */
  className?: string
  /** Everything the surface holds. */
  children: ReactNode
}

export function Surface({
  rung,
  contentWeight = "body",
  opaque = false,
  className,
  children,
}: SurfaceProps) {
  if (!isMaterialRung(rung)) {
    /* Not an OPSIN code. `tokens/errors.json` has no entry for a material rung
       outside the six, and a component may not mint one. The table is generated
       from that file and the codes are a versioned contract. A plain
       development warning is the honest channel until OPSIN-0022 exists.

       The content still renders. StatusPill returns null for a status outside
       its four because a pill with no level asserts nothing; a Surface with no
       material is a different case entirely. It is a presentational wrapper,
       and dropping it would take a reader's own readings off the screen to
       report a styling mistake. So the material is omitted, visibly, and the
       content is left where it was. */
    const offending = String(rung)
    const suggestion = RENAMED_RUNGS[offending]
    warnOncePerSession(
      `rung:${offending}`,
      `<Surface> received rung="${offending}", which is not one of ` +
        "canvas, card, raised, sheet, overlay, scrim. " +
        (suggestion === undefined
          ? "No material was applied."
          : `That name is from the retired vocabulary; the rung that does that ` +
            `job is now "${suggestion}". Map the old names by job, never by ` +
            `position: the retired "overlay" is this ladder's "sheet". `) +
        "See /docs/project/decisions/0014-material-rung-names.",
    )
    return (
      <div data-slot="surface" className={cn("relative", className)}>
        <div data-slot="surface-content" className="relative">
          {children}
        </div>
      </div>
    )
  }

  /* Checked, not indexed. `tokens/errors.json` is explicit that a
     documentation-quality complaint must not be allowed to crash a health
     product, and an unchecked `SCRIM_FLOOR[contentWeight](rung)` does exactly
     that by calling `undefined`. */
  const weight = resolveContentWeight(contentWeight)

  const style: SurfaceStyle = {
    "--opsinjs-surface-tint": opaque
      ? `var(--opsin-material-${rung}-opaque)`
      : `var(--opsin-material-${rung}-tint)`,
    "--opsinjs-surface-opaque": `var(--opsin-material-${rung}-opaque)`,
    "--opsinjs-surface-alpha": opaque ? "1" : SCRIM_FLOOR[weight](rung),
    "--opsinjs-surface-blur": `var(--opsin-material-${rung}-blur)`,
    "--opsinjs-surface-saturation": `var(--opsin-material-${rung}-saturation)`,
    "--opsinjs-surface-edge": `var(--opsin-material-${rung}-border)`,
    "--opsinjs-surface-edge-width": "var(--opsin-border-hairline)",
    /* The rung's drop shadow, which is a `<shadow>` or the keyword `none` in
       every rung's token, so it can be handed straight to the property. The
       reduced-transparency block deliberately leaves it alone: once the
       translucency is gone, the shadow and the edge are what is left to say
       which layer is on top. */
    boxShadow: `var(--opsin-material-${rung}-shadow)`,
  }

  return (
    /* `relative` and nothing else. NOT `isolate`, and this is the one line in
       the file most likely to be "tidied up" into a bug: `isolation: isolate`
       creates a backdrop root, and a backdrop root is the boundary a
       `backdrop-filter` is allowed to see behind. Isolate the root and the
       backdrop blurs the inside of the surface instead of the page underneath
       it, which looks like nothing happening at all. Painting order does the
       job on its own. All four layers are positioned with `z-index: auto`, so
       they paint in document order and the content is last. */
    <div data-slot="surface" style={style} className={cn("relative", className)}>
      {opaque || !TRANSLUCENT[rung] ? null : (
        <div
          data-slot="surface-backdrop"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit]",
            /* Absent, not neutralised. The token layer has already collapsed
               the blur to 0 under this query; what it cannot do is stop the
               element being a backdrop root, so this is the component's half of
               the same answer. `display: none` leaves the node in the DOM and
               removes it from the render, which is as close to absent as a
               server component gets without shipping a media-query listener and
               a hydration flash to a reader who asked for less. */
            "[@media(prefers-reduced-transparency:reduce)]:hidden",
            /* accessibility/increased-contrast names four things
               `prefers-contrast: more` will do, and the fourth is "disable
               translucency and blur, by reusing the reduced-transparency
               degradation". This is that, for this component. High contrast and
               frosted glass are incompatible requests. */
            "contrast-more:hidden",
            /* The `@supports` fallback and the reduced-transparency fallback are
               the same fallback on purpose (tokens/material.json), which is what
               makes the degraded path the one that gets exercised by real
               readers rather than only by an old engine nobody has. Both
               spellings are tested because Safari carried only the prefixed one
               until 18 and the tested floor is 16.4. */
            "[@supports_not_((backdrop-filter:blur(1px))_or_(-webkit-backdrop-filter:blur(1px)))]:hidden",
          )}
          style={{
            backdropFilter: BACKDROP_FILTER,
            WebkitBackdropFilter: BACKDROP_FILTER,
          }}
        />
      )}
      {/* The scrim is what makes translucency safe, so it is not conditional on
          anything: every rung has one, at the published floor, and no prop
          reaches it. On an opaque rung it is simply the surface's fill. */}
      <div
        data-slot="surface-scrim"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          /* Where the backdrop is gone, the tint has to stop being a tint. The
             reduced-transparency case needs no class here because the tokens
             already swap `-tint` for `-opaque` and force the alpha to 1; these
             two cases are the ones no stylesheet in the system covers. */
          "contrast-more:[--opsinjs-surface-tint:var(--opsinjs-surface-opaque)] contrast-more:[--opsinjs-surface-alpha:1]",
          "[@supports_not_((backdrop-filter:blur(1px))_or_(-webkit-backdrop-filter:blur(1px)))]:[--opsinjs-surface-tint:var(--opsinjs-surface-opaque)]",
          "[@supports_not_((backdrop-filter:blur(1px))_or_(-webkit-backdrop-filter:blur(1px)))]:[--opsinjs-surface-alpha:1]",
        )}
        style={{
          backgroundColor: "var(--opsinjs-surface-tint)",
          opacity: "var(--opsinjs-surface-alpha)",
        }}
      />
      {/* An inset ring rather than a border, and the reason is a feature of the
          token layer rather than a preference. `--opsin-material-canvas-border`
          and `--opsin-material-scrim-border` are the keyword `none`, because
          those two rungs have no edge. Substituted into `border-color` that is
          invalid at computed-value time and the property falls back to
          `currentColor`, which draws a hairline in the text colour around the
          page background. Substituted into `box-shadow` it is invalid in the
          same way, and `box-shadow` falls back to its initial value, which is
          `none`. That is the right answer, arrived at by the CSS engine,
          with no table of which rungs have an edge for anybody to keep up to
          date. */}
      <div
        data-slot="surface-edge"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          /* WIDTH ONLY, AND THAT IS NOT THE SECOND REQUIREMENT. Increased
             contrast asks for hairline dividers at low alpha to "become solid
             at full token colour"; this line takes the hairline width to the
             emphasis width and leaves `--opsinjs-surface-edge` at
             `--opsin-material-<rung>-border`, which several rungs publish at a
             low alpha. A wider edge at the same alpha is more visible than a
             thinner one and is not the same as an explicit one, and whether the
             result clears the non-text contrast floor has not been measured.

             It stops at the width on purpose. Substituting a solid colour here
             would be this component choosing a border colour the ladder did not
             publish, and it would give `canvas` and `scrim` an edge they are
             specified not to have, because their border token is the keyword
             `none`. The colour half belongs to `tokens/material.json`, and the
             page says so rather than claiming this line answers it. */
          "contrast-more:[--opsinjs-surface-edge-width:var(--opsin-border-emphasis)]",
        )}
        style={{
          boxShadow:
            "inset 0 0 0 var(--opsinjs-surface-edge-width) var(--opsinjs-surface-edge)",
        }}
      />
      {/* `relative` so the content joins the other three in the positioned
          painting step and, being last in document order, paints above them.
          No padding: spacing is the composing component's decision, and a
          Surface that padded itself would make every Card fight it. */}
      <div data-slot="surface-content" className="relative">
        {children}
      </div>
    </div>
  )
}

/**
 * The five content rungs, in ladder order. `scrim` is handled separately below
 * because it is the one rung that is not a place to put anything.
 */
const CONTENT_RUNGS = [
  { rung: "canvas", label: "Canvas", job: "The page itself." },
  { rung: "card", label: "Card", job: "A distinct block of content on the page." },
  { rung: "raised", label: "Raised", job: "Above the page, but not covering it." },
  { rung: "sheet", label: "Sheet", job: "Covering the page, which stays recognisable." },
  { rung: "overlay", label: "Overlay", job: "Chrome that content scrolls beneath." },
] as const

/**
 * A backdrop chosen to be hard on a translucent surface rather than kind to it.
 *
 * Four tones with the page's darkest and lightest among them, so a rung that
 * only holds its floor over a tasteful photograph fails here in review instead
 * of on somebody's phone. It is decorative and carries no meaning, which is why
 * it takes surface roles and never a category or status colour: those two axes
 * say what a reading is about and how urgent it is, and neither is available
 * for wallpaper.
 */
const BACKDROP_TILES = [
  "bg-foreground",
  "bg-background",
  "bg-primary",
  "bg-muted",
  "bg-background",
  "bg-foreground",
  "bg-muted",
  "bg-primary",
  "bg-primary",
  "bg-muted",
  "bg-foreground",
  "bg-background",
] as const

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code. It shows the whole ladder over a deliberately hostile backdrop
 * because the only claim this component makes is that content on it stays
 * readable, and that claim is worth nothing demonstrated over a flat grey.
 *
 * There is not a number anywhere in it. Surface renders no measurement, so
 * there is no reading here for anybody to mistake for their own.
 *
 * Every line of text in it takes the plain foreground role rather than the
 * muted one, deliberately: this page's own guidance says not to put small grey
 * captions on a blurred surface, and a demo that broke its own rule would be
 * the more persuasive of the two documents.
 */
export default function SurfaceDemo() {
  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-opsin-lg">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-4 grid-rows-3"
      >
        {BACKDROP_TILES.map((tone, index) => (
          <div key={`${tone}-${index}`} className={tone} />
        ))}
      </div>

      <div className="relative grid gap-opsin-3 p-opsin-4 sm:grid-cols-2">
        {CONTENT_RUNGS.map((entry) => (
          <Surface
            key={entry.rung}
            rung={entry.rung}
            className="rounded-opsin-md"
          >
            {/* A description list rather than two paragraphs, because that is
                what these are: six name/job pairs. Sibling `<p>`s look the same
                and reach a screen reader as twelve unrelated blocks of text,
                with nothing saying which job belongs to which rung. */}
            <dl className="m-0 p-opsin-3">
              <dt className="m-0 text-opsin-headline">{entry.label}</dt>
              <dd className="m-0 text-opsin-footnote">{entry.job}</dd>
            </dl>
          </Surface>
        ))}

        {/* The scrim doing its actual job. Its use is to take the page out of
            consideration, so the honest way to show it is with something on a
            rung above it. Never show it with text on the scrim itself. */}
        <Surface rung="scrim" className="rounded-opsin-md">
          <div className="p-opsin-3">
            <Surface rung="card" className="rounded-opsin-sm">
              <dl className="m-0 p-opsin-2">
                <dt className="m-0 text-opsin-headline">Scrim</dt>
                <dd className="m-0 text-opsin-footnote">
                  The dimming layer behind a modal. Content sits on a rung above
                  it.
                </dd>
              </dl>
            </Surface>
          </div>
        </Surface>
      </div>
    </div>
  )
}
