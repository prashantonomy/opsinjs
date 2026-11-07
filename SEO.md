# SEO.md: Google Search for opsinjs

`~/pensievelabs/seo/MASTER.md` (GitHub `prashantonomy/pensievelabs`, folder `seo/`) governs how
every Pensieve Labs property appears in Google Search. This file adds only this repo's facts.
Where the two disagree, the master wins and this file is corrected.

## The property

- Registry id `opsinjs`; origin `https://opsinjs.pensievelabs.org`, no basePath.
- Site name `opsinjs`, alternate name `Pensieve opsinjs`.
- Publisher: Pensieve Labs, `https://pensievelabs.org/#organization`.
- Build output `apps/www/.next/server/app` (prerendered HTML); vendored checker in `apps/www/seo/`.

## Queries, in the owner's priority order

1. `opsinjs`: owned by `/`.
2. `pensieve opsinjs`: owned by `/` (the home description names Pensieve Labs).

`pensieve open source` belongs to `https://pensievelabs.org/open-source`. The landing footer links
there and to `https://pensievelabs.org/` ("Pensieve Labs"), which is the company backlink.

## Titles and descriptions

- Home title: `opsinjs: a design system for consumer health apps` (`HOME_TITLE` in `app/_shared/seo.ts`).
- Home description: `opsinjs is the open source React design system from Pensieve Labs for consumer
  health products, built for the person reading their own results.` (`HOME_DESCRIPTION`).
- Every other page: its own title and nothing after it. The group layouts carry the template
  `%s`; the old middot plus site name suffix is gone.
- Never a pipe, an em dash, an en dash or a middot in a title, description, `og:title`,
  `og:description` or `og:site_name`. Titles 60 characters at most, descriptions 70 to 155.
- A component page's description is its frontmatter `description`, so that field obeys the same
  limits. `assert-ia` does not check them; `seo:check` does.

## Structured data

- Every page: the opsinjs Organization (with `parentOrganization` the company `@id`) and the
  WebSite node (url with its trailing slash, publisher the company `@id`), in `app/(chrome)/layout.tsx`.
- Home page only: the full company node, `publisherLd()`, copied from `seo/registry.json`. Never
  type a company value by hand; import the registry.
- Documentation pages: TechArticle and BreadcrumbList, publisher the company `@id`.

## SEO-critical files (each starts with an `SEO-CRITICAL` comment)

All under `apps/www/`: `seo/registry.json`, `app/_shared/seo.ts`, `app/_shared/structured-data.tsx`,
`app/(chrome)/layout.tsx`, `app/(chrome)/(landing)/page.tsx`, the four group layouts
`app/(chrome)/{(home),(playground),(stage),(docs)}/layout.tsx`, `app/(chrome)/(docs)/docs/[[...slug]]/page.tsx`,
`app/(view)/view/[base]/[style]/[kind]/[name]/page.tsx`, `app/not-found.tsx`,
`app/(chrome)/not-found.tsx`, `app/robots.ts`, `app/sitemap.ts`, `proxy.ts`, `next.config.mjs`,
`lib/routes.ts`. Not commentable, so listed here: `vercel.json`, the `description` frontmatter of
every page under `content/docs/`.

## Noindex, on purpose

- `/view/...`: the isolated component previews (`noindex, nofollow`). They duplicate the component
  pages and are not in the sitemap. They stay crawlable so Google can read the `noindex`.
- The two 404 pages.

## Checks

```bash
pnpm --filter @opsinjs/www build
pnpm --filter @opsinjs/www seo:check        # the build output against the registry
pnpm --filter @opsinjs/www seo:check:live   # production, after every deploy
```

`build` runs `seo:check` after `next build`, so a title, description or structured-data error fails
the build, on Vercel as well as locally. The registry lists `/view` under `noindex`, which is why
the previews pass.

After a deploy: run `seo:check:live`. If the home page changed, Search Console
(`sc-domain:pensievelabs.org`), URL Inspection on `https://opsinjs.pensievelabs.org/`, then
Request indexing. Sitemap: `https://opsinjs.pensievelabs.org/sitemap.xml`.

## Decisions and open items

- 2026-11-07: titles lost the middot site name suffix; the home title took the `Site: what it is` form;
  the company node moved to the registry values and the apex host; the footer link reads
  "Pensieve Labs" and a second one goes to the open source hub.
- 2026-11-08: `seo:check` joined `build`; the `/view` page comment now matches `app/robots.ts`,
  which allows `/view` so its `noindex` can be read.
