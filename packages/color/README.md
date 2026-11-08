# @opsinjs/color

The opsinjs colour engine: OKLCH conversion and gamut mapping, WCAG 2 and APCA contrast, ramp derivation and colour-vision-deficiency simulation, with no dependencies.

[![npm version](https://img.shields.io/npm/v/@opsinjs/color)](https://www.npmjs.com/package/@opsinjs/color)
[![licence](https://img.shields.io/npm/l/@opsinjs/color)](https://github.com/prashantonomy/opsinjs/blob/main/packages/color/LICENSE)

opsinjs uses this code to measure the contrast of its own tokens and to derive a theme
from a brand colour. It is plain TypeScript compiled to ESM, so it runs in a browser, in
Node and in a build script.

## Install

```bash
npm install @opsinjs/color
```

## Use it

```ts
import {
  apcaContrast,
  contrastRatio,
  formatRatio,
  parseColor,
  wcagVerdict,
} from "@opsinjs/color"

formatRatio(contrastRatio("#1f2937", "#ffffff")) // WCAG 2 ratio, rounded down
apcaContrast("#1f2937", "#ffffff") // APCA Lc, text first and background second
wcagVerdict("#1f2937", "#ffffff", "body").passesAA

const seed = parseColor("oklch(0.55 0.15 255)") // an Oklch, or null if it cannot parse
```

A colour argument is an `oklch(...)` string, a `#rrggbb` string, an `rgb(...)` string, an
`Oklch` object or an sRGB triple. A string that cannot be parsed gives `NaN` rather than
a guess, so a failed parse shows up in the result instead of passing as black.

| Area | Exports, among others |
| --- | --- |
| OKLCH | `parseColor`, `formatOklch`, `formatHex`, `oklchToSrgb`, `srgbToOklch`, `inGamut`, `clampToGamut`, `maxChroma` |
| WCAG 2 | `contrastRatio`, `relativeLuminance`, `wcagVerdict`, `formatRatio`, `WCAG_FLOOR` |
| APCA | `apcaContrast`, `apcaVerdict`, `passesApca`, `minimumFontSize`, `APCA_FLOOR` |
| Ramps and themes | `deriveRamp`, `deriveTheme`, `themeToCssVariables`, `RAMP_STEPS` |
| Colour-vision deficiency | `simulate`, `simulateRgb255`, `simulateOklch`, `findCollisions`, `CVD_TYPES` |

APCA and WCAG 2 measure different things and can disagree about the same pair. opsinjs
reports both, and the documentation says which floor applies where.

## Links

- [Documentation](https://opsinjs.pensievelabs.org/docs)
- [Colour foundations](https://opsinjs.pensievelabs.org/docs/foundations/colour)
- [Source and issues](https://github.com/prashantonomy/opsinjs)
- [Changelog](https://github.com/prashantonomy/opsinjs/blob/main/packages/color/CHANGELOG.md)

## Licence

[MIT](https://github.com/prashantonomy/opsinjs/blob/main/packages/color/LICENSE).
