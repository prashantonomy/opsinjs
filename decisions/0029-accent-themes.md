# ADR 0029. Accent themes: normal, vibes and stryk, with nine accents each

A product chooses how loudly its own colour is spent, from three accent themes, and which hue it is, from nine accents every theme defines; the accent paints action, selection, focus and accent text, and never a result.

## Status

**Accepted.** 2026-11-08. Amends [ADR 0028](./0028-ink-paper-and-one-light.md) in two places and keeps the rest. "Ink for action" now holds in the normal theme, which is the default, rather than everywhere. "One brand light" becomes the accent, which a product chooses, and a `quiet` Button is set in the accent ink and is no longer underlined. Builds the higher-contrast preset `theming.mdx` listed as specified and not built. Requested by the owner on 2026-11-08. Held by `tokens/accent.json`, `apps/www/scripts/accent-plan.mts`, `apps/www/scripts/build-tokens.mts`, `apps/www/scripts/check-contrast.mts` and `apps/www/app/product.css`.

## Context

ADR 0028 made the action ink and spent one blue as light. It answered the question the September audit left open, and the owner liked the result, then asked for more: a real colouring system for the accent, built in, with three characters. A calm one that is the current look. A vibrant one with the energy of a running brand. A high-contrast one. Nine colours in each.

A health system cannot take a brand colour the way a marketing site does. Status and category already own colour on a product screen, a red or an amber action reads as a warning before it reads as a brand, and a vivid fill under a label usually fails the APCA body floor whatever colour the label is. The system also had no answer for a reader whose operating system asks for more contrast: `prefers-contrast: more` reached two components and nothing else.

## Decision

- **Three accent themes.** `normal` keeps ink for the filled action and spends the accent on what is selected, what has focus and a quiet action. `vibes` makes the accent the action at full chroma and lets it cast a glow. `stryk` is high contrast: white and black grounds, full-ink boundaries and edges, no shadows or translucency, a 3px focus ring, and accents deep by day and light by night.
- **Nine accents, the same nine in every theme.** Cobalt, sky, jade, volt, rose, orchid, violet, iris and graphite. A product can change its theme without losing its accent, and a reader moved into `stryk` keeps the accent they chose.
- **Hues stay clear of status.** Every accent hue keeps at least 25 degrees from the four status hues, 27, 45, 82 and 178, so red, orange, amber and the steady teal remain status colours. Graphite has no hue.
- **Roles, not colours.** Eleven `--opsin-accent-*` tokens back the product roles `--primary`, its foreground, hover, press and edge, `--brand`, its foreground and edge, `--brand-ink`, `--ring` and `--brand-glow`. Components read roles. The default theme's default accent is declared as tokens; the rest are attribute blocks under `data-accent-theme` and `data-accent`, and every element carrying either re-declares the roles so it can start a scope.
- **Measured before it is written.** `scripts/build-tokens.mts` measures every pair an accent has to clear and refuses to write one below its floor, so a failing accent fails `pnpm check`. `normal` and `vibes` are held to the system floors. `stryk` is held to WCAG 2.2 AAA and APCA Lc 85 for text, and 4.5:1 and Lc 60 for boundaries and rings. A bright fill that cannot separate from the page carries a rim, and the rim is measured in its place.
- **The reader's contrast request wins.** `stryk` is emitted a second time under `prefers-contrast: more`, after everything else, with selectors that match any theme.
- **A control drawn as words is not underlined.** The quiet Button and a card's quiet action are set in the accent ink. On a status surface, where an accent may not go, a quiet action draws a hairline capsule in the level's ink instead. Only a link inside running text keeps its underline.
- **Installable.** Each theme and accent is a `registry:theme` item, `opsinjs-<theme>-<accent>`, which layers on `opsinjs-default`.

## Consequences

- Selection controls change in the default theme: a switch that is on, a ticked box, a chosen radio, a slider's range, a progress fill and a chosen scale point are cobalt rather than ink. The filled action is still ink.
- In dark mode a normal accent fill is pastel, because a fill that carries a tick or a label has to clear the body floor against a dark label.
- `stryk` changes border colour, not border width. A product that wants thicker boundaries in high contrast still has to set them.
- `tokens.generated.css` roughly triples in length. The attribute blocks are generated and gated, so the size costs review time, not correctness.
- A theme item sets `:root` and `.dark` only, so an installed item fixes one pairing. Switching at runtime needs the attribute blocks, which no registry item serves yet.
- No accent theme has had an accessibility review. `stryk` has not been used by a reader with low vision, and no theme has been checked by eye under forced colours.

## Alternatives considered

**A brand colour per product, derived by the theme generator.** Rejected as the default: it would put an unmeasured hue on every product screen. The generator remains for a fork, and a fork measures its own values.

**Separate accent names per theme.** Rejected, because a reader moved into `stryk` by their system would lose the accent the product chose.

**Applying `stryk` only when the product opts in.** Rejected. The reader's request for contrast is an accessibility need, and the product's choice of look should not outrank it.

**Warm accents.** Rejected. Every hue between 2 and 52 degrees, and between 57 and 107, is within reach of a status hue, and an amber or a red action would read as a level.
