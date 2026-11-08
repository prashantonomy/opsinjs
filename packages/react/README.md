# @opsinjs/react

React components for consumer health apps: readings, reference ranges, clinical status and the controls around them, built on Base UI.

[![npm version](https://img.shields.io/npm/v/@opsinjs/react)](https://www.npmjs.com/package/@opsinjs/react)
[![licence](https://img.shields.io/npm/l/@opsinjs/react)](https://github.com/prashantonomy/opsinjs/blob/main/packages/react/LICENSE)

opsinjs is for the screen where somebody who is not a clinician reads their own blood
pressure, HbA1c or symptom log. This package holds its 60 components, the shared
substrate they use (units, error codes, the clinical status vocabulary and `cn`) and
the stylesheets.

> **Review status.** The components are implemented and installable, and the API may
> change in any release. No component has had an independent accessibility review or a
> clinical review, so they are not for a production health surface. Each component's
> page in the documentation lists what has not been measured.

## Install

```bash
npm install @opsinjs/react
```

`@opsinjs/tokens` comes with it. React 19 and React DOM 19 are peer dependencies. The
package is ESM-only and declares Node 20.19 or newer.

## Add the styles

Choose one.

**An app without Tailwind.** Import the precompiled stylesheet once, at the root of the
app:

```ts
import "@opsinjs/react/styles.css"
```

It holds the tokens, the role layer and only the utilities the components use. It has
no preflight, so it never resets the rest of your page, and its utilities sit in
cascade layers, so your own unlayered CSS wins.

**An app on Tailwind CSS v4.** In your stylesheet:

```css
@import "tailwindcss";
@import "@opsinjs/react/tailwind.css";
```

That loads the tokens, the role layer and the theme bridge, and points Tailwind at the
compiled components. The opsinjs utilities, such as `text-opsin-headline`,
`bg-background` and `rounded-opsin-*`, then work in your own code as well.

**Optional, either way.** `@opsinjs/react/base.css` holds the element rules: the html
font, the body background and ink, the border role on every element, the selection
wash, the focus ring, tabular figures on `[data-opsinjs-value]`, and a 2.75rem target
floor on buttons, inputs, selects and textareas. It is opt-in because it reaches every element on the page, not only opsinjs
ones.

## Use a component

```tsx
import { Button, StatusPill, type ClinicalStatus } from "@opsinjs/react"

export function ReadingSummary({ status }: { status: ClinicalStatus }) {
  return (
    <>
      {/* The status comes from your data. opsinjs never decides one. */}
      <StatusPill status={status} describes="Blood pressure" />
      <Button variant="primary">Log a reading</Button>
    </>
  )
}
```

One component on its own is also a subpath, named by its kebab-case id:

```ts
import { RangeBar } from "@opsinjs/react/range-bar"
```

In the Next.js App Router, 27 of the 60 components carry `"use client"`, and every one
of them can be imported from a server component.

## Theme it

- **Dark mode** is the `.dark` class on an ancestor, usually `<html>`.
- **Accent themes** are `data-accent-theme="normal" | "vibes" | "stryk"` with
  `data-accent="cobalt" | "sky" | "jade" | "volt" | "rose" | "orchid" | "violet" | "iris" | "graphite"`
  on any element, and they theme everything inside it.
- **Compact density** is `data-density="compact"`.

Change opsinjs through its tokens and roles, which are CSS custom properties, and by
wrapping or composing components. The source is in the repository under MIT if you
need to fork one, but forking gives up the fixes later releases bring.

## Upgrade

`npm update @opsinjs/react`, then read the
[changelog](https://github.com/prashantonomy/opsinjs/blob/main/packages/react/CHANGELOG.md). opsinjs is at 0.x,
and any release may change the API. A team that has to evidence its dependencies pins an
exact version and reads the changelog before moving it.

## Links

- [Documentation](https://opsinjs.pensievelabs.org/docs)
- [Getting started](https://opsinjs.pensievelabs.org/docs/getting-started)
- [Components](https://opsinjs.pensievelabs.org/docs/components)
- [Source and issues](https://github.com/prashantonomy/opsinjs)
- [Report a safety concern](https://github.com/prashantonomy/opsinjs/issues/new?template=safety-concern.yml)

## Licence

[MIT](https://github.com/prashantonomy/opsinjs/blob/main/packages/react/LICENSE). opsinjs is a presentation layer. It does not diagnose, triage or
decide what a number means; thresholds, reference ranges and clinical wording belong to
the product that uses it.
