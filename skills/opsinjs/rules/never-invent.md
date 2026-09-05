# Rule 3 - never invent a component, an API, a threshold or a citation

opsinjs documents things that do not exist yet, on purpose, at addresses you can
guess, alongside the things that do. That is useful precisely as long as nobody
confuses the two - in either direction.

## Components: check the status before you generate

A component sits at one of two statuses. `alpha` means implemented: the code
exists, it renders, and it installs as source. `considered` means a reserved
name with no code and no specification page. There is no published npm package
at any status - distribution is registry copy-in - so no bare `@opsinjs/*`
import resolves.

Read the status; do not infer it from prose. The page's frontmatter carries
`status`, and `/r/<id>.json` carries `meta.opsinjs.implemented` with the same
answer in an `x-opsinjs-implemented` response header. An `alpha` page carries a
`<StubNotice status="alpha">` saying the component is implemented and
installable and listing what has not been measured. A `considered` page carries
a `<StubNotice status="considered">` saying the component is not built, and its
`.md` twin opens with a "NOT IMPLEMENTED" line. Do not substring-search a page
for the words "not implemented": they turn up in sentences about unsupported
media queries and tell you nothing about the component.

```tsx
// WRONG - there is no npm package, so this import cannot resolve, and these
// props are guesses. RangeBar is installed as source:
//   npx shadcn@latest add @opsinjs/range-bar
import { RangeBar } from "@opsinjs/react"
<RangeBar value={51} min={20} max={42} unit="mmol/mol" status="attention" />
```

What to do instead:

1. **Say so.** "opsinjs specifies RangeBar but has not implemented it. Here is
   what the specification requires, and here is an implementation against it."
2. **Build it from the specification.** The page states the intent, the cases
   where the component is the wrong answer, the proposed anatomy, the proposed
   API and the accessibility bar. That is enough to write a correct component,
   and it is far better than inventing one.
3. **Use a primitive the project already has**, styled with opsinjs tokens.

The proposed API on a planned page is a **proposal**. It is marked as one and it
will change without a deprecation cycle. Quote it as a design intent; do not
generate against it as though it were released.

## Considered is a real answer

The catalogue also lists components at `status: considered` - things opsinjs has
thought about and is deliberately not shipping. `toast`, `tooltip`, `combobox`,
`table` and about thirty others are in that list.

"Considered, not implemented" is a **complete** answer to "does opsinjs have
X?". It is not a gap you should fill by inventing X. The catalogue at
`/r/registry.json` and the generated page at
`/docs/reference/generated/catalogue.md` are authoritative for what exists.

## Thresholds belong to whoever supplies the data

This is the one that does real damage.

opsinjs is a presentation layer. It never decides what counts as high, low,
elevated or urgent, for any measurement, ever. Whoever supplies the data owns
the thresholds and the reference ranges, because those depend on the assay, the
laboratory, the population, the person's age and sex, and often on their
clinical history.

```tsx
// WRONG - this is a clinical decision, invented, hardcoded, and now in a UI.
const status = hba1c > 48 ? "urgent" : hba1c > 42 ? "watch" : "steady"
```

Take the status from the data. If it is not there, render "we do not know" -
that is a supported, designed state with its own token family
(`--opsin-status-unknown-*`), not a fallback:

```tsx
<ResultSurface status={result.status ?? undefined}>
  {result.status === undefined && <p>Your clinic has not added a range for this test.</p>}
</ResultSurface>
```

Do not describe a value as normal, abnormal, good, bad, healthy, poor or failed.
Do not imply diagnosis, triage or advice. Do not tell someone what a result
means for them - say what the number is, what range it was compared against, and
where to ask.

## Never invent evidence

Every `kind: health` page in the documentation declares `evidence: cited`,
`opinion` or `mixed`, and means it.

- **Never invent a study, a statistic, a DOI, an author or a date.** Not as a
  placeholder, not as an illustration, not "for now". A fabricated citation in a
  health document is the single most damaging thing this project could contain,
  and it is more damaging than the gap it was filling because it survives review.
- An **honest opinion, labelled as opinion, is always the better answer.** "We
  think this, here is the reasoning, here is what would change our mind" is
  genuinely useful. A plausible-looking reference to a paper that does not exist
  is not.
- **Cite; do not copy.** The NHS Digital Service Manual and the NHS A-Z are
  Crown copyright and are not reusable. Link to them, write your own words.
- The same applies to measured numbers. Every contrast figure, token value and
  prop table on the site is generated in CI. If a number is not on a generated
  page, do not state it.

## Never invent a page

If you cannot find something in the documentation, say that you could not find
it. `https://opsinjs.dev/llms.txt` is the index and it is complete; a URL that
is not in it does not exist. A confidently cited page that 404s costs the reader
more than "I could not find guidance on this" - and the second answer is often
itself the useful finding.

## Where the detail lives

- `/docs/start/safety-scope-and-limitations.md` - what opsinjs is not
- `/docs/project/release-phases.md` - what each status promises
- `/docs/health/reference-ranges.md` - showing a range without implying a diagnosis
- `/docs/health/evidence-and-references.md` - the evidence discipline
- `/docs/health/uncertainty-and-staleness.md` - rendering "we do not know"
- `/docs/reference/generated/catalogue.md` - what exists and what is only considered
