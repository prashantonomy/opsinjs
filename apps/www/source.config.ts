import { defineConfig, defineDocs } from "fumadocs-mdx/config"
import { metaSchema, pageSchema } from "fumadocs-core/source/schema"
import {
  createFileSystemGeneratorCache,
  createGenerator,
  remarkAutoTypeTable,
} from "fumadocs-typescript"
import { z } from "zod"

/**
 * NOTE: fumadocs-mdx only permits COLLECTION exports from this file. Exporting
 * anything else, such as a shared zod enum, a type or a helper, fails the build
 * with `Unknown export "…", you can only export collections from source
 * configuration file.` The enums below are therefore module-local; anything
 * that needs the vocabulary at runtime gets it from lib/status.ts.
 */
const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
})

/**
 * Release phase. Drives <StatusBadge>, the status gating in <PageTemplate> and
 * the phase column in <StatusMatrix>. The list mirrors `Status` in
 * lib/status.ts; the two are checked against each other by assert-ia.
 *
 * Three words, and they answer one question: is there code, and is it on its
 * way out. The phase says nothing about whether the code has been reviewed.
 */
const statusEnum = z.enum(["planned", "shipped", "deprecated"])

/**
 * Page kind. This is the contract that fixes a page's headings: `kind` fully
 * determines the section outline, and `assert-ia.mts` fails the build when a
 * page invents a heading its kind does not have or omits one it does.
 */
const kindEnum = z.enum([
  "component",
  "foundation",
  "health",
  "accessibility",
  "content",
  "pattern",
  "recipe",
  "screen",
  "handbook",
  "reference",
  "project",
  "guide",
])

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({
      /**
       * OPTIONAL HERE, AND REQUIRED ON A COMPONENT PAGE BY FM014 IN
       * `scripts/assert-ia.mts`. The two halves are deliberately split.
       *
       * This field used to read `.default("planned")`, and a schema-level
       * default is not a convenience: zod writes it into `page.data.status`
       * for every page that omits the field, before any reader runs. So a
       * documentation page that declares no phase would arrive at
       * `app/_machine/corpus.ts`, at `/r/docs.json` and at the `.md` twin
       * carrying `planned`, which reads as "this thing has not been built"
       * about a doctrine page that is finished and real. Deleting the reader's
       * own `?? "planned"` without deleting this default changes nothing and
       * no gate notices. Both went together.
       *
       * The requirement direction cannot live here either, because a zod
       * schema on one field cannot see `kind` without a `.superRefine()` that
       * changes the inferred type of `page.data` at all seventeen read sites.
       * FM014 sees both fields, names the file, and says which way it is
       * wrong. That is the better place for it.
       */
      status: statusEnum.optional(),
      kind: kindEnum,
      since: z.string().optional(),
      category: z.string().optional(),
      /**
       * Search synonyms. Indexed by fumadocs, emitted into llms.txt and
       * /r/index.json. Globally unique across the corpus. The namespace is
       * declared once in registry/catalogue.ts; pages reference it.
       */
      aliases: z.array(z.string()).optional(),
      owner: z.string().optional(),
      reviewed: z.string().optional(),
      reviewer: z
        .enum(["design", "engineering", "clinical", "content"])
        .optional(),
      reviewEvery: z.enum(["3m", "6m", "12m", "never"]).optional(),
      a11yDate: z.string().optional(),
      /** Doctrine page → the catalogue ids that implement it. */
      implements: z.array(z.string()).optional(),
      /** Component page → the doctrine pages that govern it. */
      governedBy: z.array(z.string()).optional(),
      /** Component → the recipes and screens that use it. The reverse index. */
      usedIn: z.array(z.string()).optional(),
      links: z
        .object({ doc: z.string().optional(), api: z.string().optional() })
        .optional(),
      /**
       * Mandatory on kind: health. `cited` requires a real, checkable source.
       * An honest `opinion` is always preferred to an invented reference.
       */
      evidence: z.enum(["cited", "opinion", "mixed"]).optional(),
    }),
    /**
     * includeProcessedMarkdown makes `await page.data.getText('processed')`
     * available. Every .md twin route, the five llms-*.txt shards and
     * /r/docs.json read the corpus through it. `page.data.content` does not
     * exist in fumadocs 16 and fails typecheck (TS2339).
     */
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: { schema: metaSchema },
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    remarkNpmOptions: { persist: { id: "package-manager" } },
  },
})
