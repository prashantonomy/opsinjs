# opsinjs

A React design system for consumer health apps. One install for `@opsinjs/react`, `@opsinjs/tokens` and `@opsinjs/color`.

[![npm version](https://img.shields.io/npm/v/opsinjs)](https://www.npmjs.com/package/opsinjs)
[![licence](https://img.shields.io/npm/l/opsinjs)](https://github.com/prashantonomy/opsinjs/blob/main/packages/opsinjs/LICENSE)

opsinjs is for the screen where somebody who is not a clinician reads their own blood
pressure, HbA1c or symptom log and decides what, if anything, to do next. This package
holds no code of its own. It re-exports the three scoped packages, so it is the same
system under one name.

> **Review status.** The components are implemented and installable, and the API may
> change in any release. No component has had an independent accessibility review or a
> clinical review, so they are not for a production health surface. Each component's
> page in the documentation lists what has not been measured.

## Install

```bash
npm install opsinjs
```

React 19 and React DOM 19 are peer dependencies. Installing `@opsinjs/react` on its own
gives you the same components, and the documentation uses that name throughout.

## What it forwards

| Import | Is the same as |
| --- | --- |
| `opsinjs` | `@opsinjs/react` |
| `opsinjs/tokens` | `@opsinjs/tokens` |
| `opsinjs/color` | `@opsinjs/color` |
| `opsinjs/styles.css` | `@opsinjs/react/styles.css` |
| `opsinjs/tailwind.css` | `@opsinjs/react/tailwind.css` |
| `opsinjs/base.css` | `@opsinjs/react/base.css` |
| `opsinjs/tokens.css` | `@opsinjs/tokens/tokens.css` |

## Use it

```tsx
import "opsinjs/styles.css"
import { Button } from "opsinjs"

export function SaveButton() {
  return <Button variant="primary">Save reading</Button>
}
```

An app on Tailwind CSS v4 imports `opsinjs/tailwind.css` after `tailwindcss` in its
stylesheet instead of `opsinjs/styles.css`. The
[`@opsinjs/react` README](https://github.com/prashantonomy/opsinjs/tree/main/packages/react#readme)
explains both stylesheets, the optional `base.css` and the theming attributes.

## Links

- [Documentation](https://opsinjs.pensievelabs.org/docs)
- [Getting started](https://opsinjs.pensievelabs.org/docs/getting-started)
- [Source and issues](https://github.com/prashantonomy/opsinjs)
- [Report a safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml)

## Licence

[MIT](https://github.com/prashantonomy/opsinjs/blob/main/packages/opsinjs/LICENSE).
opsinjs is a presentation layer. It does not diagnose, triage or decide what a number
means; thresholds, reference ranges and clinical wording belong to the product that uses
it.
