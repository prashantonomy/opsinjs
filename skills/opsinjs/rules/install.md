# Rule 4. Install the package; never copy source or invent an import path

opsinjs ships as npm packages. A component is something a project depends on and
upgrades, not source it copies and then owns. This rule is about the two ways an agent
gets that wrong: reaching for the old copy-in route, and guessing at an import.

## The rule

**Install `@opsinjs/react` and import from it. Never copy a component's source into a
project, never emit `npx shadcn add`, and never write an import path you have not read
on a documentation page.**

```bash
npm install @opsinjs/react
```

```tsx
import { ResultCard } from "@opsinjs/react"
```

`@opsinjs/tokens` comes with it. One component can also be imported on its own from a
subpath named by its kebab-case id, `@opsinjs/react/result-card`. Those two forms are
the whole of it. `@/components/ui/<id>`, `@opsinjs/<id>` as a package name, and
`opsinjs/components/...` do not exist.

The styles are a separate step, and a component without them renders unstyled. Choose
one, once per app:

- An app without Tailwind: `import "@opsinjs/react/styles.css"` at the root.
- An app on Tailwind CSS v4: `@import "tailwindcss";` then
  `@import "@opsinjs/react/tailwind.css";` in the app's stylesheet.

`@opsinjs/react/base.css` is optional on top of either, and it is opt-in because it
styles every element on the page, not only opsinjs ones.

## The old route is gone

opsinjs used to be a shadcn registry. It is not any more, so all of these are wrong
today and will fail:

- `npx shadcn@latest add @opsinjs/<id>`, in any form.
- An `"@opsinjs"` entry under `registries` in `components.json`. opsinjs needs no
  `components.json` at all.
- `https://opsinjs.pensievelabs.org/r/<id>.json` or `/r/registry.json`. Every `/r` URL
  except `/r/index.json` and `/r/docs.json` answers HTTP 410.
- The shadcn MCP server pointed at opsinjs. It has nothing to read.

If a project already holds opsinjs source copied the old way, say so, and suggest
replacing those files with the package import rather than editing them further. A copy
never receives a fix; the package does, on upgrade.

## Ask before you assume

Before generating an install command, establish two things. If you cannot, ask.

1. **Which package manager.** Check for a lockfile rather than guessing from habit,
   and write the command for the one the project uses.
2. **Whether this is a monorepo.** Install into the workspace that renders the screen.
   A dependency added to the wrong workspace is worse than one not added at all.

## Changing a component

A consumer changes opsinjs through its tokens and roles, which are CSS custom
properties, and by wrapping or composing a component. Never tell someone to edit a file
inside `node_modules`, and never copy a component out of the package to change it.
Forking is possible, because the source is public under MIT, but a fork gives up every
fix a later release brings, and in a health product that includes safety fixes. Say
that out loud if someone asks for one.

## Upgrading

`npm update @opsinjs/react`, then read the changelog. opsinjs is at 0.x, and any release
may change the API. A team that has to evidence its dependencies pins an exact version
and moves it deliberately.

## What to say alongside the install

The practical answer to "add ResultCard to my project" is the install command, the
import, the stylesheet line, and the caveat said out loud: `result-card` is `shipped`,
so it works, its API may change in any release, and nobody has run an independent
accessibility review or a clinical review on it, so it belongs in a prototype rather
than on a production health surface.

## Where the detail lives

- `/docs/getting-started.md` covers the install, the stylesheet and the first component.
- `/docs/packages.md` lists the four packages and what each one holds.
- `/docs/agents.md` describes the machine surface.
