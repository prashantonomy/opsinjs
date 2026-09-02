# Rule 4 - ask which registry; never assume `@opsinjs` is configured

opsinjs ships as a shadcn-spec registry: source you copy into a project and then
own, not a package you depend on. That distribution model has one sharp edge,
and this rule is about that edge.

## The rule

**Never emit `npx shadcn@latest add @opsinjs/<name>` without first checking that
the namespace is registered in the project's `components.json`.** If it is not,
the command fails with a resolution error that reads like a network problem, and
the next thing that usually happens is that somebody hand-writes a component and
calls it opsinjs.

Check for this, in `components.json`:

```json
{
  "registries": {
    "@opsinjs": "https://opsinjs.dev/r/{name}.json"
  }
}
```

If it is absent, say so and offer the one-line addition before the install
command - not after it, and not as a footnote.

## Ask before you assume

Before generating any install command, establish three things. If you cannot,
ask; each has a wrong default that is expensive to undo.

1. **Which registry.** A project may compose several. `@opsinjs`, `@shadcn` and
   a private one can all be configured at once, and the same component name can
   exist in two of them. Namespace every reference.
2. **Which package manager.** The documentation emits npm, pnpm, yarn and bun
   tabs for exactly this reason. Do not guess from habit - check for a lockfile.
3. **Whether this is a monorepo.** Aliases, the `@source` lines Tailwind needs,
   and the target directory all differ, and a component installed into the wrong
   workspace is worse than one not installed at all.

## The three things about copied source

Because the component ends up as source in someone's repository rather than as a
dependency, three consequences follow that a package would not have.

- **They own it now.** Their edits are theirs. Never rewrite an installed
  component wholesale to "bring it up to date" - that is how someone's
  accessibility fix from three months ago silently disappears. Use the diff path.
- **Every emitted file carries a version stamp**, a comment naming the item and
  the version it came from. Do not strip it. It is the only way to answer "what
  has changed since the version I copied", which is the question every upgrade
  starts with.
- **The registry is the machine surface.** `https://opsinjs.dev/r/registry.json`
  is the catalogue - it is what the shadcn MCP server reads, and it lists every
  component including the considered ones, with status and category. Prefer it
  over guessing a component name from prose.

## Right now, every item is empty

Nothing is built. Every registry item at `/r/<name>.json` currently carries an
empty `files` array and a `meta.notImplemented: true` marker. `npx shadcn add`
against one succeeds in resolving and installs nothing, which is the honest
outcome.

So today the practical answer to "add ResultCard to my project" is: the component
is specified and not implemented, here is the specification, and here is an
implementation written against it. See `rules/never-invent.md`.

## The MCP server

`npx shadcn@latest mcp` pointed at `https://opsinjs.dev/r/registry.json` gives an
agent the catalogue directly, including status and category for every item. That
is the right tool for "what components exist" - better than scraping the
documentation, and it stays correct as the catalogue changes.

## Where the detail lives

- `/docs/registry/index.md` - what shipping as a registry buys and costs
- `/docs/registry/namespaces.md` - registering `@opsinjs`, composing registries
- `/docs/registry/registry-item.md` - the item schema, field by field
- `/docs/registry/upgrades-and-diffs.md` - upgrading source you own
- `/docs/registry/version-stamps.md` - the fork problem and the stamp that solves it
- `/docs/agents/mcp-server.md` - client configuration
