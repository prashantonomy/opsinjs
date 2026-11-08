# ADR 0028. Ink and paper, one light, and sheets with depth

The product and the documentation take one visual language from the Pensieve Labs house style, bent to the health doctrine: ink for action, one brand light spent only as light, opaque sheets with depth for anything that reports a value, and capsules for anything a reader presses.

## Status

**Accepted.** 2026-11-08. Amended by [ADR 0029](./0029-accent-themes.md) the same day: ink for action now holds in the normal accent theme, the one light became the accent a product chooses, and a `quiet` Button is set in the accent ink rather than underlined. Supersedes the lyra half of [ADR 0004](./0004-lyra-docs-chrome.md): the documentation chrome no longer wears shadcn's `lyra` values. The rest of 0004 stands, so the two stylesheets stay separate and every preview is still an iframe onto `/view`. Answers the question the September visual audit (decision D5) left for a human, that the primary action and the focus ring were as chromatic as the category axis. Proposed in issue #37. Held by `tokens/color.json` (the chrome roles), `tokens/shape.json`, `tokens/material.json`, `tokens/type.json`, `apps/www/app/product.css`, `apps/www/app/globals.css` and the landing page's own stylesheet.

## Context

The owner judged the system low fidelity: a product screen read as a stack of grey boxes, and the documentation looked like an unstyled template. Three causes sat in the tokens rather than in any one component.

1. Every card, button, field and pill was outlined in `neutral-500`, the 3:1 boundary of a control. The card rung was shadowless on the argument that a grid of shadowed cards reads as clutter, so the line was its only elevation cue and the contrast gate held it at 3:1.
2. `--opsin-corner-shape` read `superellipse(4)`, meant as an Apple-style squircle. The argument of `superellipse()` is a power of two, so it drew an exponent of 16, a nearly square corner, whatever the radius said. `superellipse(2)` is the squircle, and the same curve as the CSS keyword `squircle`. Measured in Chrome 156.
3. The primary action was a mid blue at chroma 0.135, as chromatic as the category axis, and the documentation chrome was unmodified `lyra`, so the site that documents the system showed none of it.

The owner named Pensievology, the Pensieve Labs community site, as the reference. Its system is monochrome and lit by one neon, sets Inter heavy and tracked in, makes every container a sheet of frosted glass with a soft drop, makes every control a capsule, and puts a bloom of the neon and a fine grain behind the page. Its reader is a doctor with a stake in their own words. The opsinjs reader is a patient reading their own number, often anxious, often on a phone. So part of the reference transfers, part has to be bent, and part is refused.

## Decision

- **Ink for action.** `--primary` is `neutral-950` by day and `neutral-50` by night, and its hover and press states step to the neighbouring neutrals. A filled control carries no hue, so status and category are the only chromatic colour on a product screen.
- **One brand light.** `--opsin-chrome-brand` sits at hue 250, between `labs` (210) and `sleep` (275), and `--ring` carries the same value. It is spent as light: the focus ring, a link's underline in the documentation, the mark beside an eyebrow, the bar beside the current page and the bloom behind the documentation and the landing page. It never fills anything that reports a result and never colours a word a reader has to read.
- **Sheets with depth, glass for chrome.** The `card` rung stays opaque. It takes a decorative edge, `--opsin-chrome-edge`, a line of light along its top, and a two-layer drop declared per theme. `raised`, `sheet` and `overlay` take matching drops. `--border` and `--input` stay at `neutral-500`, the 3:1 boundary of a control. Translucency stays where content scrolls beneath it: the `overlay` rung, and the documentation's sidebar and bars.
- **Shape.** The radius base is 20px, up from 14, and the squircle token is `superellipse(2)`. Buttons, chips, the segmented control and the tab bar's current mark are capsules, and a `quiet` Button, which has neither a fill nor a boundary, is underlined so it still reads as a control.
- **Type.** The product keeps the platform face. Its title steps are set at 800 and 700 and tracked in, and body text sits on a 24px line. The documentation sets Inter with its optical size axis, titles at 800 and tracked in, under an eyebrow carrying the brand mark.
- **RangeBar draws the reading as the mark does,** a ringed disc on a groove, while the band stays neutral and outlined.

## Consequences

- The contrast gate still holds `--opsin-chrome-border` at the non-text floor on the page and on a card, because controls keep that line. The decorative edge is not measured, by design: WCAG 1.4.11 asks a boundary to clear 3:1 where it identifies a component, and a card is identified by its content. A reader who used the line to find a card in greyscale now has the drop and the fill step, which are weaker cues. That cost is accepted and stated here.
- No pair the gate measures changed its verdict. The focus ring is more chromatic and more visible: in dark it went from Lc 47 to Lc 58.6, against a floor of 45.
- A drop is a static `box-shadow`, so it adds paint but no backdrop filter, and the product's budget of three translucent surfaces is unchanged.
- An underlined `quiet` Button looks like a link while it behaves as a button. The card action recipe already drew a handler with no fill and no boundary that way, so one rule now covers both.
- The brand light sits 25 degrees from `sleep`. It never marks data, so the two cannot meet on a chart, but a reader may still associate blue with a category.
- Every consumer who reinstalls a component receives the new look; nothing in the API changed, and a copied file keeps the old look until it is copied again.
- The documentation no longer looks unlike the product. Previews stay isolated in an iframe, so they cannot inherit the chrome, and the frame around a preview is what tells a reader where the example ends.
- None of this has had an accessibility review or a clinical review.

## Alternatives considered

- **A neon fill on the primary action, as Pensievology lights its own.** Rejected: its signature green is the colour of `steady` and of `activity`, and any filled hue on the primary action competes with an urgent status for the reader's attention.
- **Translucent glass cards, as in the reference.** Rejected: a health value never sits over a moving backdrop, so the card stays opaque and takes the reference's edge, sheen and drop without its blur.
- **Capitals on buttons, as in the reference.** Rejected: capitals slow reading for the readers this system serves, and a status word in a heavier weight spends the urgency budget StatusPill keeps scarce.
- **Inter in the product.** Rejected for now: `tokens/type.json` records why the product has no brand face, the platform face honours the reader's own settings, and Inter carries the documentation's voice only.
- **Keep the 3:1 line round every card and add the drop.** Rejected: the line is what made a screen a stack of boxes, and a drop under it is heavier still.
