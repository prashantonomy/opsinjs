# @opsinjs/tokens

The opsinjs design tokens: the two colour axes, accent themes, type, space, shape, motion and materials, as CSS custom properties and as data.

[![npm version](https://img.shields.io/npm/v/@opsinjs/tokens)](https://www.npmjs.com/package/@opsinjs/tokens)
[![licence](https://img.shields.io/npm/l/@opsinjs/tokens)](https://github.com/prashantonomy/opsinjs/blob/main/packages/tokens/LICENSE)

Every value here is generated from the token sources in the opsinjs repository, and the
generator refuses to write an accent that falls below its contrast floor. Category
colour (what kind of measurement this is) and status colour (how urgent it is) are
separate token families and never mix on one element.

## Install

```bash
npm install @opsinjs/tokens
```

You do not need this on its own if you use the components: `@opsinjs/react` depends on
it, and its stylesheets already include `tokens.css`. Install it directly to read the
tokens without React, in a stylesheet, a build script or a design tool.

## Use the CSS

```css
@import "@opsinjs/tokens/tokens.css";
```

`tokens.css` declares every custom property. The light values sit on `:root` and
`.opsin-product`, the dark values on `.dark`, and it also carries the accent themes,
the `prefers-contrast` rules, the Display-P3 values and the reduced-motion and
reduced-transparency overrides.

Dark mode is the `.dark` class on an ancestor. An accent theme is
`data-accent-theme="normal" | "vibes" | "stryk"` together with `data-accent`, set on any
element, and it themes everything inside that element.

## Use the data

```ts
import { TOKENS, ACCENTS, DEFAULT_ACCENT } from "@opsinjs/tokens"

const urgentInk = TOKENS.find((token) => token.name === "status-urgent-ink")
console.log(urgentInk?.cssVar) // "--opsin-status-urgent-ink"
console.log(DEFAULT_ACCENT, ACCENTS.length)
```

The JavaScript exports are `TOKENS`, `TOKEN_SOURCE_HASH`, `ACCENT_THEMES`, `ACCENTS`,
`ACCENT_SWATCHES`, `ACCENT_THEME_ATTRIBUTE` (`data-accent-theme`), `ACCENT_ATTRIBUTE`
(`data-accent`), `DEFAULT_ACCENT_THEME` (`normal`) and `DEFAULT_ACCENT` (`cobalt`).
`@opsinjs/tokens/tokens.json` holds the same tokens as plain JSON.

Reference a token rather than copying its value. A hard-coded colour does not follow
dark mode, the accent themes or a reader's request for more contrast.

## Links

- [Documentation](https://opsinjs.pensievelabs.org/docs)
- [Foundations](https://opsinjs.pensievelabs.org/docs/foundations)
- [Source and issues](https://github.com/prashantonomy/opsinjs)
- [Changelog](https://github.com/prashantonomy/opsinjs/blob/main/packages/tokens/CHANGELOG.md)

## Licence

[MIT](https://github.com/prashantonomy/opsinjs/blob/main/packages/tokens/LICENSE).
