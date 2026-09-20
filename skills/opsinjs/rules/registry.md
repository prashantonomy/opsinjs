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
    "@opsinjs": "https://opsinjs.pensievelabs.org/r/{name}.json"
  }
}
```

If it is absent, say so and offer the one-line addition before the install
command - not after it, and not as a footnote. `opsinjs.pensievelabs.org` is the canonical
host and is not registered yet, so point the entry at whichever host is actually
serving `/r` - a local `pnpm dev` on port 4000 while that is all there is - and
say which one you used. The `{name}` placeholder and the `/r/{name}.json` path
are the parts that do not change.

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
- **Nothing in an emitted file records where it came from.** There is no
  lockfile and no stamp. Tell people to run `add` in its own commit naming the
  item and the date, and to put their own changes in the next one. That commit
  is the only answer to "what has changed since the version I copied", which is
  the question every upgrade starts with.
- **The registry is the machine surface.** `https://opsinjs.pensievelabs.org/r/registry.json`
  is the catalogue - it is what the shadcn MCP server reads, and it lists every
  component with status and category. Prefer it over guessing a component name
  from prose.

## Which items carry files

An item for an implemented component carries `meta.opsinjs.implemented: true`
and a populated `files` array whose entries have real `content` - the component
itself plus the shared substrate it needs, `lib/opsinjs.ts` and `lib/status.ts`.
`npx shadcn add` writes those files into the project, resolving composite
dependencies by name rather than inlining them.

Every component in the opsinjs catalogue is built and installable, and all of
them are `shipped`, so every id you resolve today carries files. An id that
resolves to nothing is an id opsinjs does not have, and saying so is the answer.

The marker to read is `meta.opsinjs.implemented` on an item, `implemented` on a
roster row in `/r/index.json`, or the `x-opsinjs-implemented` response header on
either. There is no `meta.notImplemented` field anywhere in opsinjs; do not look
for one, and never read a missing key as a negative answer.

The two payload shapes differ, and the difference matters when you are after
source. `/r/<name>.json` carries each file's `content`. The aggregate
`/r/registry.json` lists each file's `path`, `type` and `target` and omits the
content, because it is the catalogue rather than the delivery. Fetch the item.

So the practical answer to "add ResultCard to my project" is the install
command, with the namespace check above done first, followed by the caveat said
out loud: `result-card` is `shipped`, so it works, its API may change in any
release without a deprecation cycle, and nobody has run an accessibility review
or a clinical review on it.

## The MCP server

`npx shadcn@latest mcp` pointed at `https://opsinjs.pensievelabs.org/r/registry.json` gives an
agent the catalogue directly, including status and category for every item. That
is the right tool for "what components exist" - better than scraping the
documentation, and it stays correct as the catalogue changes.

## Where the detail lives

- `/docs/registry.md` - what shipping as a registry buys and costs
- `/docs/registry/namespaces.md` - registering `@opsinjs`, composing registries
- `/docs/registry/registry-item-json.md` - the item schema, field by field
- `/docs/registry/upgrades-and-diffs.md` - upgrading source you own
- `/docs/agents/mcp-server.md` - client configuration
