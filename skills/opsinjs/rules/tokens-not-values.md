# Rule 2 - reference a token, never a raw value

Every colour, radius, duration, easing, space and type step in opsinjs has a
name. Use the name.

## The rule

**No raw `oklch()`, `hsl()`, `rgb()` or hex value in product code.** No literal
`8px` where a space token exists. No `cubic-bezier()` where a motion token
exists. No `border-radius: 12px` where the radius ladder exists.

```css
/* WRONG */
.result { background: oklch(0.96 0.03 150); border-radius: 12px; }

/* RIGHT */
.result {
  background: var(--opsin-status-steady-surface);
  border-radius: var(--opsin-radius-md);
}
```

## Why this one is not pedantry

A raw value has four specific costs, and in a health interface the fourth is the
one that matters.

1. **It is unthemeable.** A consuming product that derives its own palette from
   its brand colour gets a system that is consistent everywhere except your
   hardcoded value, which now clashes and looks like a bug in the design system.
2. **It is invisible to dark mode.** Tokens carry both values. A literal carries
   one, and it is the wrong one half the time.
3. **It is invisible to the contrast gate.** Every token pair is measured in CI
   with APCA and WCAG 2.2, and a regression fails the build. A raw value is
   measured by nobody, ever - so the accessibility conformance the docs publish
   quietly stops describing your screen.
4. **It defeats the axes.** The two-colour-axes rule is enforceable because
   tokens are named by axis. `--opsin-status-urgent-surface` and
   `--opsin-category-heart-surface` are checkable by a lint rule, by review and
   by eye. `oklch(0.58 0.196 25)` is checkable by nobody, and a red that means
   "your heart" and a red that means "act now" become indistinguishable in the
   source, which is exactly where they have to stay distinguishable.

## The three tiers

Tokens are layered, and you only ever touch the top one.

- **Primitive** - the raw ramps, addressed by step: `--opsin-category-heart-600`,
  `--opsin-neutral-300`. They may be re-tuned in a minor release. Components
  never reference one, and neither do you.
- **Semantic** - what a thing is FOR: `--opsin-status-attention-ink`,
  `--opsin-material-sheet-opaque`, `--opsin-space-4`, `--opsin-radius-md`. This
  is the layer you use, and the layer semver covers - the versioning policy
  explicitly includes the CSS custom properties.
- **Component** - what one component's part uses. Owned by the component.

If you find yourself wanting a primitive, the semantic layer is missing a name.
That is a real finding worth raising, and it is a better outcome than a literal.

## Where a raw value is legitimate

Three places, and they are narrow.

- **Inside `tokens/*.json`**, which is where values are authored.
- **In a one-off illustration** that is deliberately not part of the system - a
  marketing gradient, a decorative figure with no semantic meaning.
- **In a captured measurement** written by a generator, never by a person.

Everywhere else, a raw value is a bug that renders correctly today.

## Deriving a theme

Do not hand-pick a palette. opsinjs derives one: brand colour to an OKLCH
lightness ramp, a chroma clamp against the sRGB gamut boundary, a Display-P3
escalation for wide-gamut displays, and then APCA validation of every resulting
role pair. The theme playground at `/playground/theme` does this interactively
and emits the CSS; `/theming.md` documents the mechanism.

Two things about the published contrast figures, because both get misread:

- They describe **the shipped presets only**. A theme derived from your own
  brand colour has its own numbers, and you have to measure them - which is what
  `pnpm run contrast` and `/playground/contrast` are for.
- The Display-P3 values are a **chroma escalation only**: same hue, same
  lightness. Measured contrast is unchanged by gamut, so nothing about meaning
  changes on a wide-gamut display.

## Where the detail lives

- `/theming.md` - the three tiers, and extending without forking
- `/reference/generated/tokens.md` - every token, generated
- `/reference/generated/css-variables.md` - every custom property, by selector
- `/styling.md` - styling a component you own, and the lint rule proposed to catch this, which is not built yet
