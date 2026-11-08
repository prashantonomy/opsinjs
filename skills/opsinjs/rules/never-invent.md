# Rule 3 - never invent a component, an API, a threshold or a citation

opsinjs documents both what it has built and what it has only specified, at
addresses you can guess. That is useful precisely as long as nobody confuses the
two, and as long as nobody reads "built" as "reviewed".

## Components: check the status before you generate

A built component is `shipped`, and every component in the opsinjs catalogue is
shipped today. `shipped` means implemented: the code exists, it renders, and it
installs with `npm install @opsinjs/react`. It does not mean reviewed. The API may
change in any release without a deprecation cycle, and no opsinjs component has had
an accessibility review or a clinical review, so none of them belongs on a
production health surface.

Read the status; do not infer it from prose. The page's frontmatter carries
`status` and `implemented`, and the roster at `/r/index.json` carries the same
answer for every id. A built page carries a
`<StubNotice status="shipped">` saying the component is implemented and
installable and listing what has not been measured. That notice is where the
review gap is written down, so read it rather than assuming the absence of a
warning means somebody checked. Do not substring-search a page for the words
"not implemented": they turn up in sentences about unsupported media queries and
tell you nothing about the component.

```tsx
// WRONG. opsinjs is not a shadcn registry any more, so this command fails,
// and the props below are guesses taken from the component's name.
//   npx shadcn@latest add @opsinjs/range-bar
import { RangeBar } from "@/components/ui/range-bar"
<RangeBar value={51} min={20} max={42} unit="mmol/mol" status="attention" />
```

```tsx
// RIGHT. The package is real (npm install @opsinjs/react), and every prop here
// is on the RangeBar page's props table. The value, the range and the status
// all come from the product's data; none of them is decided in the UI.
import { RangeBar } from "@opsinjs/react"
<RangeBar
  label="HbA1c"
  value={result.value}
  unit={result.unit}
  precision={result.precision}
  range={result.range}
  status={result.status}
/>
```

What to do instead:

1. **For a built id, install it, and say what `shipped` means.** The component
   is real. The caveat is that its API will change without a deprecation cycle,
   that nobody has run an accessibility review or a clinical review on it, and
   that its own page lists what has not been measured. Say the caveat every
   time. An agent that presents a shipped health component as settled has made
   the newer of the two mistakes. The install is `npm install @opsinjs/react`
   and the import is from `@opsinjs/react`, and `rules/install.md` says why
   nothing else is.
2. **For an id opsinjs does not have, say so and stop.** "opsinjs does not have
   one" is a complete answer. The roster at `/r/index.json` and the
   generated page at `/components.md` are authoritative
   for what exists, and neither is a gap you should fill by inventing X.
3. **If you write one anyway**, build it from a primitive the project already
   has, styled with opsinjs tokens, and do not call it opsinjs.

A `shipped` API is real rather than a proposal, but it is narrow and it is
unstable. Take it from the component page's generated props table or from the
type declarations `@opsinjs/react` installs. Do not extend it by guessing, and do
not quote it as though it were released or as though it were reviewed.

## Thresholds belong to whoever supplies the data

This is the one that does real damage.

opsinjs is a presentation layer. It never decides what counts as high, low, or
urgent, for any measurement, ever. Whoever supplies the data owns
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
// Shape, not an API: ResultSurface is not an opsinjs component. Read the real
// props off the component page or the package's types before you write this.
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
it. `llms.txt` is the index and it is complete; a path that is not in it does not
exist. A confidently cited page that 404s costs the reader more than "I could not
find guidance on this" - and the second answer is often itself the useful
finding. That includes not being able to reach the site at all: `opsinjs.pensievelabs.org` does
not resolve yet, and "the documentation is not reachable from here" is a
better answer than a page reconstructed from memory.

## Where the detail lives

- `/health.md` - what opsinjs is not
- `/reading-the-docs.md` - what each status promises
- `/health/reference-ranges.md` - showing a range without implying a diagnosis
- `/health/safety-review.md` - the evidence discipline
- `/health/trends.md` - rendering "we do not know"
- `/components.md` - every component opsinjs has
