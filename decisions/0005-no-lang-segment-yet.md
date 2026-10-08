# ADR 0005. No [lang] segment yet

Internationalisation is deferred deliberately, the retrofit is bounded by routing through one module, and unit systems ship now as a correctness feature.

## Status

**Accepted.** 2026-09-02.

## Context

The obvious defensive move when starting a documentation site is to reserve a
`[lang]` route segment so that adding languages later is not a URL migration. It
was proposed, and it was rejected in that form.

Reserving the segment is not free and does not buy what it appears to. The
documentation engine's internationalisation support has its own configuration,
its own routing proxy, its own loader options and its own search behaviour, and
none of it was verified against the pinned versions in this project. A `[lang]`
folder wired up halfway produces a site whose URLs contain a locale that nothing
respects: one page tree, one search index, one `llms.txt`, all monolingual, with a
prefix that implies otherwise. That is worse than no segment, because it is a
promise in the URL.

The overriding constraint on this scaffold is a green build.

## Decision

**No `[lang]` segment. Instead, make the retrofit cheap and enforce that it stays
cheap.**

- All path construction goes through one module, `lib/routes.ts`. Nothing else
  builds a documentation URL.
- `assert-ia.mts` fails the build on a hardcoded `/docs/` path in TypeScript
  outside `lib/routes.ts` and `lib/source.ts`, with a short explicit allowlist for
  the files that genuinely must contain one. Those files are the Next config,
  `robots.ts`, `sitemap.ts` and the shared layout options.
- In MDX, absolute documentation links are banned outright; pages link to each
  other by relative file path and the documentation engine resolves them. That
  rule exists for authoring reasons anyway, and it happens to make the corpus
  locale-agnostic for free.
- **Unit systems are not internationalisation.** mmol/L against mg/dL, kilograms
  against pounds and stones, Celsius against Fahrenheit: these are correctness
  problems that harm an English-speaking reader just as effectively, and they ship
  now at [Unit systems](https://opsinjs.pensievelabs.org/health/numbers).

## Consequences

- **One place to change.** Adding a locale means changing route construction in
  one module, adding the segment, and configuring the engine rather than auditing
  four hundred files for hardcoded paths.
- **The corpus is monolingual and honest about it.** No locale appears in any URL,
  so no reader or crawler is told a translation exists.
- **Some machinery will still be needed later**, and pretending otherwise would be
  the same mistake in a different place: the search index, the `llms.txt` shards,
  the sitemap and the `.md` twins all become per-locale, and the page tree needs a
  locale-aware loader.
- **Translating this corpus is a large content project**, not a routing change.
  Health guidance in particular cannot be machine-translated: the plain-English
  replacements in the glossary are language-specific judgements about what a
  layperson understands, and a translated glossary is a new glossary.

## The retrofit recipe

Recorded so that the next person does not have to rediscover it. This is the
approach the documentation engine documents upstream; **it has not been verified
against the versions pinned here**, so treat it as a starting point rather than
as instructions.

### Declare the locales

The engine's `defineI18n` defines an internationalisation configuration. Give it
the default locale and the list, and pass it to the source loader so that the
page tree and the search index become per-locale.

### Add the routing proxy

The engine ships a proxy that redirects a locale-less URL to the negotiated
locale. It goes in the existing proxy module, which currently handles legacy-URL
redirects only.

### Add the segment

Move the documentation route group under a `[lang]` dynamic segment, and mount the
provider with the locale so that the chrome, the search dialog and the table of
contents follow.

### Update the module that owns paths

`lib/routes.ts` gains a locale parameter. Because nothing else builds a URL, this
is the point at which the whole site becomes locale-aware. That is the entire
purpose of the constraint.

### Update the machine surfaces

Per-locale `llms.txt` shards, per-locale sitemap entries, and `.md` twins under
the localised path. The offline bundle grows one dimension.

## Alternatives considered

**Reserve the folder now, wire it up later.** Rejected: cosmetic. It creates the
URL shape without any of the behaviour, and the URL shape is the part that is
cheap to change once path construction is centralised.

**Full internationalisation now.** Rejected: unverified against the pinned
versions, and it would consume the budget for the health doctrine that is the
actual differentiator. There is also nothing to translate yet.

**Locale as a query parameter.** Rejected: worse for crawlers, worse for caching,
and it would not survive contact with the machine surfaces that must be
addressable.

## Revisiting this

Revisit when there is a committed translator for a specific locale rather than
when somebody asks whether the site could be translated. The trigger is a person,
not a feature request.
