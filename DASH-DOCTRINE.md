# The dash doctrine

**Destined for `AGENTS.md` §12.** Repo root: `/Users/taramaa/opsinjs`. Every path below is
repo-relative from `apps/www` unless it starts with a repo-root name (`AGENTS.md`,
`skills/`, `audits/`). This document is written to be executed literally by parallel
workers holding disjoint file sets. Where it says **decided**, there is no second option
and no judgement left to make. Where two sources disagreed, the disagreement was settled
by opening the file; the evidence is quoted in place.

---

## 0. Notation, and why this document contains no dash

The two banned characters are U+2014 EM DASH and U+2013 EN DASH. This document names them
and never prints them. Every BEFORE excerpt below is verbatim from the file cited, with
one alteration: the banned character is written as the ASCII token `U+2014` or `U+2013`.
Open the file at the line given to see the real bytes. Every AFTER is literal and may be
pasted as written.

This is a construction requirement, not a stylistic tic. Because this document, the
`AGENTS.md` section derived from it, and the reader-facing rule pages all name the
characters in words or by code point, **the enforcement gate in §8 needs no allowlist and
no exempt file.** An allowlist is a thing five hundred agents will grow. There is none.

Line numbers are as of 2026-09-12. If a line has moved, find the text.

---

## 1. The rule

**opsinjs prose names its relations. A statement that a dash would have joined is written
as two sentences, as one clause with its connective spelled out, or as two separate
elements. A span between two values is written with the word "to". U+2014 and U+2013 do
not appear anywhere in this repository: not in prose, not in interface copy a patient
reads, not in a heading, not in frontmatter, not in a table cell, not in a code comment,
not in a JSON string, not in a diagram label, not in an SVG comment, not in a commit
message.**

**Removing a dash means rewriting the sentence.** A comma, a colon, a semicolon, a pair of
brackets, a hyphen, a slash or three dots dropped into the hole the dash left is the same
sentence still reaching for a dash. It is a failed edit, not a completed one, and a
reviewer sends it back.

There are exactly two places in the whole repository where a mark rather than a rewrite is
the answer, and both are named and reasoned in §5: the `<Term>` apposition separator, and
the field separator in a browser-tab title template. Nothing else is a candidate. Do not
argue for a third.

### 1.1 The safety invariant: what a reframe may never change

This corpus is a presentation layer for patient-facing health interfaces. A punctuation
edit that changes meaning here is a clinical safety defect, not a typo. Check all seven
before you commit any reframe. **If you cannot keep all seven, leave the sentence alone and
report it in your summary.**

1. **The strength of an obligation.** `must`, `never`, `always`, `may`, `should` and `is
   expected to` keep the exact modal they had. "Never the time it eventually uploaded"
   does not become "usually not the time it eventually uploaded".
2. **The owner of a threshold.** If the BEFORE says a number belongs to the product, the
   clinician, the laboratory or the device maker, the AFTER says the same, in the same
   place. opsinjs never acquires a threshold in an edit. If the BEFORE names no owner, the
   AFTER invents none.
3. **Every hedge, scope limit and exception.** The material inside a paired dash is
   usually the concession, the "not yet measured", the "this is an argument rather than a
   measurement", or the reason a component refuses to act. It is the load-bearing half and
   it is the half an agent under length pressure deletes. **Deleting it is the single worst
   failure mode of this sweep.**
4. **Every negation and correction.** "not X, but Y", "never X", "rather than X" survive
   whole. Count the negations in the BEFORE and count them in the AFTER.
5. **Disclaimers and non-claims.** "this is not advice", "opsinjs does not triage, diagnose
   or advise", "no conformance evaluation has been performed", "nobody who reviewed it is
   recorded on it" keep their full force and their full scope. **A shorter disclaimer is a
   weaker disclaimer.**
6. **What a screen reader hears.** If the dash was inside the accessibility tree, the AFTER
   must be at least as clear when spoken. If the dash was `aria-hidden`, the AFTER must not
   leave the visible text saying something the accessible name no longer matches.
7. **The honesty markers.** `<NotBuiltYet>`, `<StubNotice>`, `<NoDataYet>` and `<Todo>` stay
   exactly where they are, with the same `status`. The open questions inside
   `<StubNotice questions={[...]}>` keep every claim. Edit those strings for the dash and
   for nothing else. A copy edit never promotes a page.

**A reframe is finished when a reader who knows the subject cannot tell which sentence used
to have a dash in it.**

### 1.2 The three house devices, and the rotation cap

`content/docs/health/alarm-fatigue.mdx` is at zero of both characters and reads as writing
rather than as a sweep. Read it before your first edit. Three devices carry almost all of
it:

1. **Full stop plus a new subject.** The default. Where the new sentence would open with a
   bare pronoun, name the thing instead.
2. **"rather than".** The corpus's own contrastive connective, and a genuine reframe rather
   than a substitution, because it carries the correction inside one clause without a beat.
3. **The connective written out as a word**, at the head of the new sentence: *therefore*,
   *because*, *so*, *which is why*, *and*.

**Rotation cap, per page.** At most one emphatic fragment run ("Not a palette. Not a set of
overrides."). At most two consecutive sentences opening with the same demonstrative. Never
two "rather than" clauses in one paragraph. Never three consecutive sentences built with
the same device. Four thousand mechanical full stops is a new tic, and a reviewer reads a
tic as a sweep.

### 1.3 Classify, then apply. The recognition table.

Classify by the token immediately **after** the dash:

| What follows the dash | Playbook entry |
|---|---|
| a second dash later in the same sentence, wrapping an insertion | R2, or R3 if the insertion is a list |
| `see`, `see [`, a bare link | R7 |
| `it is`, `that is`, `this is`, `they are`, a demonstrative noun phrase | R5 |
| `not`, `never`, `rather than`, `and not` | R6 |
| `and`, `so`, `but`, `which`, `because` | R4 |
| two or more comma-separated items | R8 |
| a noun phrase or clause, and the sentence ends after it | R1 |
| end of line, clause resumes on the next line | R1, **after joining the lines** |

Then override by **where** the dash sits. Where always wins over what:

| Where it sits | Playbook entry |
|---|---|
| a `- [Link](path.mdx)` or `- **Bold**` list item | R17, and §4.1 for the template |
| frontmatter `description:` | R12 |
| frontmatter `title:` | R13 |
| a markdown heading line | R11 |
| a numbered record label, or a numbered stage heading | R10 |
| a table row, whole cell is the dash | R15 |
| a table row, dash inside prose | R14 |
| a JSX prop string (`describes:`, `note:`, `action:`, `case:`, `questions={[...]}`) | R16 |
| a mermaid node label inside `<FlowDiagram>` | R18 |
| an ASCII diagram or a comment inside a fenced code sample | R19 |
| a string literal that renders to a screen or a console, or a `<DoDont>` specimen | R20 |
| a `//`, `/* */` or `/** */` comment in `.ts`, `.tsx`, `.mts`, or an SVG comment | R21 |
| a title template, panel label, sidebar separator, CSS `content:`, machine index row | R22 |
| the first line of a docblock, glossing a name | R9 |

---

## 2. Scope

### 2.1 In scope, and swept

Everything authored in this repository. By path, from the repo root:

- `apps/www/content/**` including `content/_templates/**`
- `apps/www/app/**` including `app/icon.svg`, whose SVG comment holds one em dash
- `apps/www/components/**`
- `apps/www/lib/**` (sources only; see §2.3)
- `apps/www/registry/**` (sources only; see §2.3)
- `apps/www/tokens/*.json`
- `apps/www/scripts/**`
- `apps/www/hooks/**`
- `apps/www/next.config.mjs`, `apps/www/.gitignore`, `apps/www/.prettierignore`
- `apps/www/package.json`, `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `turbo.json`
- `AGENTS.md` (13), `CLAUDE.md` (8), `README.md` (5),
  `BUILD-THE-COMPONENT-LAYER.md` (113 em dashes and 5 en dashes), `LICENSE-DOCS` (4)
- `skills/**`

`LICENSE-DOCS` is in scope because its four dashes are at lines 3, 4, 12 and 29, all inside
opsinjs's own preamble prose. None of them is CC BY licence text, which is quoted by
reference rather than reproduced. If a future edit brings actual licence text into that
file, the licence text is a verbatim external quotation and §8.5 applies.

**`skills/**` holds zero banned characters today** and is therefore zero work for this
sweep. It is listed in scope so that no worker adds one, and because §2.4 requires a new
rule file there.

**Repository totals as of this writing: 7,907 em dashes and 121 en dashes, across 566
files.**

### 2.2 Out of scope, never scanned, never edited

Path rules. See §8 for the reasoning.

- `node_modules/**`, `.git/**`, `.next/**`, `.turbo/**`, `.source/**`,
  `apps/www/.source/**`
- `pnpm-lock.yaml` and any other lockfile, and any vendored dependency
- `audits/**`, `.playwright-mcp/**`, `.rawres/**`
- Existing git history and commit messages already written. New commit messages are in
  scope.

### 2.3 Generated, and fixed at source

Never hand-edit these. `pnpm check:generated` (see `apps/www/package.json:21`) diffs exactly
nine paths and is the authority:

`lib/generated` · `lib/opsinjs.ts` · `registry/__index__.ts` · `registry/generated` ·
`app/tokens.generated.css` · `content/docs/reference/generated` ·
`content/docs/reference/api` · `content/docs/handbook/error-codes.mdx` · `public/r`

Three of those nine are only **partly** generated, and the hand-written halves **must** be
hand-edited. §9 gives the full source map. The three are:

1. **`content/docs/reference/api/*.mdx` and `content/docs/reference/generated/*.mdx`:**
   everything above the `{/* opsinjs:generated:begin` line, frontmatter included, is
   hand-written. `assemble()` at `scripts/build-reference.mts:232` slices at
   `indexOf("{/* opsinjs:generated:begin")` and returns the head verbatim, so editing it
   produces zero drift.
2. **`lib/opsinjs.ts`:** everything outside the spliced region markers, notably
   `EXAMPLE_SOURCE` at `lib/opsinjs.ts:111`.
3. **`content/docs/handbook/error-codes.mdx`:** everything outside the markers.

**Correction to a claim you may have been given.** The begin-marker line does **not** self-
heal on the next `generate`. `scripts/build-reference.mts:239-243` reads:

```
  /* Reuse the page's own marker line when it has one. */
  const beginLine =
    current !== undefined && beginAt !== -1
      ? (current.slice(beginAt, current.indexOf("\n", beginAt)) || BEGIN)
      : BEGIN
```

It preserves whatever marker line the page already has, forever. Eight committed pages
still carry a banned character in that line. **They must be hand-edited**, and hand-editing
them produces zero drift for exactly the reason above. The eight are
`content/docs/reference/generated/` `contrast.mdx:66`, `keyboard.mdx:46`,
`css-variables.mdx:48`, `glossary.mdx:43`, `tokens.mdx:46`, `data-attributes.mdx:61`,
`catalogue.mdx:47` and `types.mdx:74`. `contrast.mdx:66` names `scripts/check-contrast.mts`
as its writer; that script does not splice the file at all, so the line is hand-maintained
outright.

**Decided marker text.** `BEGIN` at `scripts/build-reference.mts:93` currently uses a spaced
ASCII hyphen. Change it, and write the same shape into all eight pages:

```
{/* opsinjs:generated:begin. Everything below is replaced by scripts/build-reference.mts */}
```

and, in `contrast.mdx` only, `... by scripts/check-contrast.mts */}`. The splice keys on the
prefix `{/* opsinjs:generated:begin` only, so changing the tail is safe.

### 2.4 Where the rule is written down

Four places, and all four land with the sweep:

1. `AGENTS.md` §12, the full doctrine.
2. `CLAUDE.md`, one line under "Prose bar" pointing at §12.
3. `content/docs/content/grammar-and-mechanics.mdx`, the reader-facing form (§7).
4. A fifth rule file, `skills/opsinjs/rules/no-dashes.md`, listed in
   `skills/opsinjs/SKILL.md` beside the four that exist (`never-invent.md`, `registry.md`,
   `status-and-colour.md`, `tokens-not-values.md`). An agent generating opsinjs copy reads
   the skill and not `AGENTS.md`, so a rule that is not there will be broken by every
   component it writes.

### 2.5 Ownership, and the four named pairs

File sets are disjoint. Touching a file outside your set corrupts a worker running at the
same time. If a file outside your set is wrong, report it in your summary; do not fix it.

**Four pairs of files must move in one commit, and are therefore assigned to one worker as a
unit. This is a named exception to disjoint ownership.**

| Pair | Why |
|---|---|
| `registry/catalogue.ts:85-88` and `content/docs/components/meta.json:8,15,21,24` | The four sidebar separator strings are duplicated and nothing gates them against each other. Assigned to whoever owns `registry/catalogue.ts`. |
| `scripts/assert-ia.mts:1065` and `components/docs/page-template.tsx:80` | Identical heading-alias tables. Assigned to whoever owns `scripts/assert-ia.mts`. |
| `registry/bases/base/value.tsx` and `content/docs/components/value.mdx` and `content/docs/health/numbers-units-precision.mdx` | §5.1. A page describing a component it no longer matches is worse than either error alone. |
| `registry/bases/base/term.tsx` and `content/docs/components/term.mdx` | §5.3. |

---

## 3. The reframing playbook

Every entry: recognition cue, the move, at least two real BEFORE/AFTER pairs.

### R1. Terminal elaboration

**Recognise.** One dash in the back half of the sentence. What follows restates, justifies
or expands what precedes, and the sentence ends there. **Includes the line-final dash whose
clause resumes on the next line: there are 239 of those in `content/docs`. Join the lines
first, then treat it as one instance.** The largest easy role.

**Move.** Full stop. New sentence whose subject is the thing the trailing phrase was about.
Where the trailing phrase opens with `and`, delete the `and` rather than relocating it.
**A full stop is a reframe only when what follows is a real sentence. A trailing fragment is
a dash wearing a hat.**

**BEFORE** `content/docs/patterns/offline-and-stale-data.mdx:21-22`
> The number stays on screen U+2014 hiding it helps nobody, and a reader who wanted to see
> their last reading is entitled to it.

**AFTER**
> The number stays on screen. Hiding it helps nobody, and a reader who wanted to see their
> last reading is entitled to it.

**BEFORE** `content/docs/foundations/token-architecture.mdx:68`
> ...quietly opts itself out of every theme, every preset and every contrast measurement
> U+2014 and nothing tells you until somebody derives a theme from their brand colour and
> one component stays the old hue.

**AFTER**
> ...quietly opts itself out of every theme, every preset and every contrast measurement.
> Nothing tells you until somebody derives a theme from their brand colour and one
> component stays the old hue.

The `and` is dropped, not relocated. "Nothing tells you" as an opener lands the punch the
dash was reaching for. **This is the most useful single instruction in R1.**

**BEFORE** `content/docs/components/relative-time.mdx:49`
> It has no npm dependency and pulls in no other registry item U+2014 the phrase and the
> date come from `Intl`, which every runtime this system supports already has.

**AFTER**
> It has no npm dependency and pulls in no other registry item. The phrase and the date come
> from `Intl`, which every runtime this system supports already has.

---

### R2. Paired parenthetical carrying a hedge or a scope limit

**Recognise.** Two dashes wrapping an insertion inside one clause. The largest role and the
only one needing a structural rewrite rather than a split. Under §1.1.3 it is also the most
dangerous, because the insertion is usually the concession.

**Move, in this order. Take the first that works.**

1. **Invert.** Make the insertion the main clause and the frame a trailing relative clause.
2. **Name the relation.** Subordinate the insertion with a word that says what it is doing:
   `because`, `and that is deliberate`, `which`, `rather than`.
3. **Rule first, instances second.** State the rule as a complete sentence, then the
   instances as a second sentence. (See R3 when the insertion is a list.)
4. **Dissolve.** Fold the insertion into the noun phrase it modifies.

**Never brackets.** In this corpus the insertion is usually the load-bearing half, and
brackets demote it.

**BEFORE** `content/docs/components/score-dial.mdx:590`
> mounts no live region, deliberately U+2014 it is not entitled to speak on the caller's
> behalf U+2014 and what a caller should do instead is an open question on this page.

**AFTER** (move 2)
> mounts no live region, and that is deliberate, because it is not entitled to speak on the
> caller's behalf. What a caller should do instead is an open question on this page.

**BEFORE** `content/docs/health/emergency-and-escalation.mdx:198`
> Its suppression behaviour U+2014 hiding every other alert on the screen U+2014 is part of
> that specification.

**AFTER** (move 1)
> That specification includes its suppression behaviour, which hides every other alert on
> the screen.

**BEFORE** `content/docs/accessibility/colour-independence.mdx:37`
> The canonical definition of the four levels U+2014 what each one asserts, who is allowed
> to assign it, and what it must never be read as U+2014 lives on
> [Clinical status semantics](../health/clinical-status-semantics.mdx).

**AFTER** (move 1, destination first)
> [Clinical status semantics](../health/clinical-status-semantics.mdx) is where the four
> levels are defined. It says what each one asserts, who is allowed to assign it, and what
> it must never be read as.

**BEFORE** `content/docs/components/score-dial.mdx:585`
> The argument U+2014 not the measurement U+2014 is that the words are what survive a
> printer dropping backgrounds:

**AFTER** (move 2)
> This is an argument rather than a measurement. The words are what survive a printer
> dropping backgrounds:

---

### R3. Paired parenthetical wrapping a list of instances

**Recognise.** A special case of R2 where the material between the dashes is two or more
comma-separated items, and the dashed version buries the rule behind its own examples.

**Move.** Rule first, as a complete sentence. Instances second, in a sentence of their own.
**Do not let the second sentence merely restate the verb the first sentence just defined.**
If it would, invert instead (R2 move 1).

**BEFORE** `content/docs/accessibility/target-size-and-motor.mdx:82`
> **Timing.** A target that disappears U+2014 a toast with an action, an auto-advancing
> carousel, a confirmation that dismisses itself U+2014 is a target with an effective size
> of zero for a slow reader.

**AFTER** (inverted, because the rule-first split produces the tautology "...all disappear")
> **Timing.** A toast with an action, an auto-advancing carousel and a confirmation that
> dismisses itself all take themselves away before a slow reader arrives, which gives each
> of them an effective target size of zero.

**BEFORE** `content/docs/theming/tailwind-v4.mdx:18`
> In v4, the three most common mistakes U+2014 the wrong `@theme` keyword, a missing
> `@source`, and an import in the wrong position U+2014 all produce valid CSS that silently
> does not do what you meant.

**AFTER**
> In v4, the three most common mistakes all produce valid CSS that silently does not do what
> you meant. They are the wrong `@theme` keyword, a missing `@source`, and an import in the
> wrong position.

---

### R4. The connective already written out

**Recognise.** The first word after the dash is `and`, `so`, `but`, `because`, `which`. The
connective is doing the joining; the dash is adding a pause it does not need.

**Move.** Either delete the dash and let the connective join the clause, or split and
rewrite the connective into the new sentence's opening: `which is` becomes `That ... is`;
`so` becomes `therefore` inside the new sentence; `because` becomes a plain sentence of
reason. **`but` is the one word you may not simply delete**: it carries an adversative, and
dropping it loses a contrast. Keep it, or rebuild the contrast explicitly.

**BEFORE** `content/docs/start/installation/next.mdx:60-61`
> ...until you add it every custom property these components read resolves to nothing
> U+2014 which is the failure the next section is about.

**AFTER**
> ...until you add it every custom property these components read resolves to nothing. That
> failure is what the next section is about.

**BEFORE** `content/docs/components/button.mdx:297`
> It sets `aria-busy` and `aria-disabled` and blocks activation, but never the native
> `disabled` attribute U+2014 so the control keeps its tab stop and its name, and the reader
> keeps their place.

**AFTER**
> It sets `aria-busy` and `aria-disabled` and blocks activation, but never the native
> `disabled` attribute. The control therefore keeps its tab stop and its name, and the
> reader keeps their place.

**BEFORE** `content/docs/components/range-bar.mdx:21`
> The component says so in development and changes nothing, because adding a decimal place
> would be a claim about accuracy nobody made U+2014 but a reader still sees two identical
> numbers.

**AFTER** (the adversative is kept, not dropped)
> The component says so in development and changes nothing, because adding a decimal place
> would be a claim about accuracy nobody made. A reader nevertheless still sees two
> identical numbers.

---

### R5. Restatement with a demonstrative

**Recognise.** The clause after the dash opens by pointing back: `it is`, `that is`, `this
is`, `they are`, or a demonstrative noun phrase.

**Move.** Full stop, then the demonstrative as the subject of its own sentence. This is the
one place the beat the dash was buying survives intact, because a full stop is a longer
pause than a dash, not a shorter one.

**BEFORE** `content/docs/foundations/typography/dynamic-type.mdx:22`
> An interface that clips, truncates or overlaps at their setting is not "slightly off" for
> them U+2014 it is the version of the product they have, permanently.

**AFTER**
> An interface that clips, truncates or overlaps at their setting is not "slightly off" for
> them. It is the version of the product they have, permanently.

**BEFORE** `content/docs/agents/index.mdx:137`
> You should get a definite "considered, not implemented" answer rather than a 404 U+2014
> that behaviour is the point of the whole design.

**AFTER**
> You should get a definite "considered, not implemented" answer rather than a 404. That
> behaviour is the point of the whole design.

**BEFORE** `content/docs/foundations/colour/deriving-a-theme.mdx:68`
> This is not a pass/fail U+2014 it is a judgement you have to make about your own
> product...

**AFTER** (the slash goes too, since you are in the sentence anyway)
> This is not a pass or a fail. It is a judgement you have to make about your own
> product...

---

### R6. Contrastive negation

**Recognise.** The first word after the dash is `not`, `never`, `rather` or `and not`. These
are the highest-value sentences in the health pillar and they are where a careless edit
loses a prohibition. **Count the negations before and after.**

**Move.** Prefer "rather than" folded into the same clause where the two halves share a
verb. Where the correction has two or more limbs, split and give each limb an explicit
subject and the repeated verb. **Never leave a bare "Not on the back control." fragment**,
and never weaken a `never` into a `usually not`.

**BEFORE** `content/docs/index.mdx:36`
> The rules in [Health](./health/index.mdx) are written as prohibitions a reviewer can check
> on a screenshot U+2014 not as principles.

**AFTER**
> The rules in [Health](./health/index.mdx) are written as prohibitions a reviewer can check
> on a screenshot rather than as principles.

**BEFORE** `content/docs/screens/results-screen.mdx:123-124`
> Focus lands at the start of the main content, on the heading that names the test U+2014
> not on the back control, and not on the first interactive element inside the card.

**AFTER** (two limbs, so the verb repeats)
> Focus lands at the start of the main content, on the heading that names the test. It does
> not land on the back control, and it does not land on the first interactive element inside
> the card.

**BEFORE** `content/docs/components/relative-time.mdx:129`
> The stale treatment is a muted, non-status typographic change carried by explicit words
> U+2014 never an amber tint, which would put a clinical status onto a fact about the clock

**AFTER**
> The stale treatment is a muted, non-status typographic change carried by explicit words.
> It is never an amber tint, which would put a clinical status onto a fact about the clock

**BEFORE** `content/docs/components/range-bar.mdx:23`
> Group J of the safety review checklist asks for a reviewer name and a date, and there is
> neither here U+2014 not because the component was not reviewed, but because nobody who
> reviewed it is recorded on it.

**AFTER**
> Group J of the safety review checklist asks for a reviewer name and a date, and there is
> neither here. That is not because the component was not reviewed, but because nobody who
> reviewed it is recorded on it.

---

### R7. Cross-reference tail

**Recognise.** The word after the dash is `see`, followed by a link, at the end of a rule.

**Move.** Full stop, then **either** `See [Page](path.mdx).` as its own sentence, **or** a
sentence whose subject is the destination page. Both are house forms; the corpus already
writes both, and `content/docs/health/uncertainty-and-staleness.mdx:120` is the precedent
for the bare imperative.

**Decided, resolving a live disagreement:** the bare `See [X](path.mdx).` is a completed
edit and needs no invented predicate. Use the subject form where you have something real to
say about the destination, and the bare form otherwise. **Do not manufacture a predicate
just to avoid repeating "See", and do not use "See" more than three times on one page.**
An invented predicate at several hundred sites is its own tic.

**BEFORE** `content/docs/patterns/result-disclosure.mdx:163`
> Motion must not be the signal U+2014 see
> [Motion in health UI](../health/motion-in-health-ui.mdx).

**AFTER**
> Motion must not be the signal. See
> [Motion in health UI](../health/motion-in-health-ui.mdx).

**BEFORE** `content/docs/patterns/empty-and-first-use.mdx:84`
> This is the most common way the status axis leaks U+2014 see
> [The two colour axes](../health/two-colour-axes.mdx).

**AFTER** (subject form, because there is something to say)
> This is the most common way the status axis leaks.
> [The two colour axes](../health/two-colour-axes.mdx) is the rule it breaks.

---

### R8. Enumeration folded into a sentence

**Recognise.** The dash introduces two or more comma-separated items, without a closing
dash.

**Move.** Make the list the subject or the predicate of its own sentence, or dissolve it
into the sentence with `such as`, `whether`, `and`, `or`. **A colon is permitted here and
only here**, when what precedes it is a complete independent clause and what follows is a
genuine list of two or more items. **The list may not change what the sentence claims:** an
asyndetic list of instances is not a disjunction, and a statement that a consequence exists
is not a statement about what changes.

**BEFORE** `content/docs/patterns/forms/question-pages.mdx:30`
> - Getting it wrong has a consequence U+2014 a dose, a date, a unit.

**AFTER** (the stakes claim survives; "changes a dose, a date or a unit" would delete it)
> - Getting it wrong has a consequence: a dose, a date, a unit.

**BEFORE** `content/docs/components/status-pill.mdx:253`
> The four glyphs are four distinct *shapes* U+2014 check, eye, triangle, octagon U+2014 not
> one glyph in four colours, which is what the measured CVD audit in `tokens/color.json`
> requires:

**AFTER**
> The four glyphs are four distinct *shapes*: check, eye, triangle and octagon. They are not
> one glyph in four colours, which is what the measured CVD audit in `tokens/color.json`
> requires:

**BEFORE** `content/docs/health/two-colour-axes.mdx:58`
> Each category exposes four roles U+2014 `-surface`, `-line`, `-ink` and `-accent` U+2014
> and no others,

**AFTER**
> The four roles a category exposes are `-surface`, `-line`, `-ink` and `-accent`, and there
> are no others,

---

### R9. Title gloss in a docblock or a label

**Recognise.** A proper noun, an identifier or a path, then the dash, then a definition.
The dash is a copula that has not been typed. Almost always the first line of a `/** */`
block.

**Move.** Type the copula, or use the verb the relationship actually wants.

**BEFORE** `registry/bases/base/button.tsx:2`
> ` * Button U+2014 the control you press to make something happen.`

**AFTER**
> ` * Button is the control you press to make something happen.`

**BEFORE** `registry/bases/base/alert-banner.tsx:2`
> ` * AlertBanner U+2014 a message at the top of a surface, at one of the four levels,`

**AFTER**
> ` * AlertBanner puts a message at the top of a surface, at one of the four levels,`

**BEFORE** `app/_machine/registry-payload.ts:2`
> ` * app/_machine/registry-payload.ts U+2014 the shadcn-spec registry, built from the`

**AFTER**
> ` * app/_machine/registry-payload.ts builds the shadcn-spec registry from the`

---

### R10. Numbered record and stage labels

**Recognise.** `0008 U+2014 Considered components resolve, never 404`, or
`### 1 U+2014 Parse and normalise to OKLCH`. The dash is a numbering convention, not
punctuation.

**Move, decided.** Name what the number is, then a full stop, then the label. The number
stays first, so the title and the filename read the same way in a sidebar and in a search
result.

| Before | After |
|---|---|
| `content/docs/project/decisions/0001-base-ui-not-radix.mdx:2` `title: "0001 U+2014 Base UI, not Radix"` | `title: "ADR 0001. Base UI, not Radix"` |
| `content/docs/project/decisions/0008-considered-components-resolve.mdx:2` | `title: "ADR 0008. Considered components resolve, never 404"` |
| `content/docs/project/changelog/2026-09-scaffold.mdx:2` `title: "0.0.0 U+2014 The scaffold"` | `title: "0.0.0. The scaffold"` |
| `content/docs/foundations/colour/how-the-engine-works.mdx:33,47` `### 1 U+2014 Parse and normalise to OKLCH` | `### Step 1. Parse and normalise to OKLCH`, `### Step 2. Fix the lightness ladder` |
| `content/docs/accessibility/for-compliance-reviewers.mdx:75` `### Minutes 0U+20133 U+2014 the scope claim` | `### The scope claim (minutes 0 to 3)` |

**There are 18 decision records**, `0001` through `0021` with gaps, and **all 18 titles carry
a dash**. `content/docs/project/decisions/meta.json` controls sidebar order, `assert-ia.mts`
never reads a decision title, and `check-llms.mts` reads no title at all, so nothing sorts
differently. **Inbound link texts that quote an ADR title change in the same commit.**

The `for-compliance-reviewers.mdx` cluster (lines 75, 83, 90, 97, 104) carries both banned
characters in each heading and sits inside `<Steps>`, which already numbers them. One edit
per heading kills both. The bracketed timing is a trailing qualifier on a noun phrase and is
permitted; see §6.4.

---

### R11. Headings

**Recognise.** A dash on a `#` through `######` line. About 30 lines.

**What the gate reads, so you know what is safe.** `collectHeadings()` at
`scripts/assert-ia.mts:681` matches `/^##\s+(.+?)\s*$/` over `stripCode(body)`: **H2 only**.
H3 and below are free text. H1 comes from frontmatter `title` and is R13. **No frozen H2
name in `lib/status.ts` `SECTION_OUTLINES` or `COMPONENT_SECTIONS_BY_STATUS` contains either
character**, so no required heading changes, and the rule is that none may acquire one.

**Exactly one dashed H2 exists**, `content/docs/start/quick-start.mdx:59`, on a `kind: guide`
page whose `OUTLINE_POLICY` is `fixed`, which means extra H2s between the required ones
belong to the author. Rewriting its text is safe.

**Move.** Delete the dash and join with a preposition or a conjunction. For a numbered stage
heading, R10.

**BEFORE** `content/docs/start/quick-start.mdx:59`
> ## Decide what the number means U+2014 before you render it

**AFTER**
> ## Decide what the number means before you render it

**BEFORE** `content/docs/theming/index.mdx:39,58,76`
> ### Tier 1 U+2014 ramps

**AFTER**
> ### Tier 1 ramps, and likewise `### Tier 2 roles` and `### Tier 3 component variables`

**BEFORE** `content/docs/start/browser-support.mdx:68,80,88,98`
> ### Backdrop blur U+2014 the material ladder

**AFTER**
> `### Backdrop blur and the material ladder`, `### Squircle geometry with \`corner-shape\``,
> `### Wide-gamut colour in Display P3`, `### Spring easing as \`linear()\``

**Anchor check, currently clean.** No in-repo link targets any dashed heading. After
changing a heading, grep for `.mdx#` and `](#` and confirm you broke nothing.

---

### R12. Frontmatter `description:`

**Recognise.** A dash in the `description:` value. About 143 lines. Not private metadata: it
renders as the page subtitle, the OG card, the search snippet, the `.md` twin and the
`llms.txt` entry, so it is reader-facing in five places.

**Move.** Two sentences, in the shape the swept health pages already use
(`content/docs/health/alarm-fatigue.mdx:3`,
`content/docs/health/emergency-and-escalation.mdx:3`). Where the two halves are one
statement rather than two, restructure so the first half becomes the grammatical subject.
**A comma dropped into the dash's seat is not permitted here either**, and that decision
overrides any draft that said otherwise.

**Length budget.** `scripts/assert-ia.mts:1012` calls `warn`, not `fail`, above 240
characters. **Treat 240 as a hard budget anyway:** a reframe may not push a description over
240, and a description already over 240 may not grow.

**BEFORE** `content/docs/patterns/alert-escalation.mdx:3`
> description: Moving from ambient to interruptive without spending attention you will need
> later U+2014 the four rungs, the per-session budget, and the rule that de-escalation must
> be as visible as escalation.

**AFTER**
> description: Moving from ambient to interruptive without spending attention you will need
> later. The four rungs, the per-session budget, and the rule that de-escalation must be as
> visible as escalation.

**BEFORE** `content/docs/accessibility/cognitive-accessibility.mdx:3`
> description: Reducing load, removing time limits and making every error recoverable
> U+2014 the accessibility work that matters most in health and is measured least.

**AFTER** (restructured, not split: the gerund phrase becomes the subject)
> description: Reducing load, removing time limits and making every error recoverable is the
> accessibility work that matters most in health and is measured least.

**BEFORE** `content/docs/accessibility/this-site.mdx:3`
> description: The documentation site held to the standard it publishes U+2014 including the
> places where it currently fails.

**AFTER** (a comma here would be a substitution, so the modifier gets a verb)
> description: The documentation site held to the standard it publishes. It records the
> places where it currently fails.

**BEFORE** `content/docs/accessibility/for-content.mdx:3`
> description: Accessible writing U+2014 headings, link text, alternative text and plain
> language U+2014 checked while you write rather than at audit.

**AFTER**
> description: Headings, link text, alternative text and plain language, checked while you
> write rather than at audit.

**BEFORE** `content/docs/content/plain-english-a-z.mdx:3`
> description: The canonical clinical-to-plain vocabulary U+2014 the rule for choosing a
> replacement word, and the machine-readable list every product and Term instance shares.

**AFTER**
> description: The canonical clinical-to-plain vocabulary. It carries the rule for choosing
> a replacement word, and the machine-readable list every product and Term instance shares.

---

### R13. Frontmatter `title:`

**Recognise.** A dash in a `title:` value. 18 ADR titles, one changelog title, one glossary
title.

**Move.** R10 for the numbered ones. §4.3 for `Plain-English A to Z`. Quotes may be dropped
only when the value contains no colon and no bracket.

---

### R14. Table cell prose

**Recognise.** A dash inside a `|` cell that is doing an ordinary prose job. Distinct from
R15, which is a cell whose whole content is a dash. **Do not confuse the two.**

**Move.** The prose moves above, but prefer a subordinate clause with its connective written
out over a second sentence, because a cell is read as one unit. A cell has no width budget
the build enforces, so two short sentences are fine when the claim needs them.

**BEFORE** `content/docs/foundations/shape/radius-scale.mdx:39`
> `| `full` | Pills and circles U+2014 a different object, not a bigger rung |`

**AFTER**
> `| `full` | Pills and circles, which are a different object rather than a bigger rung |`

**BEFORE** `content/docs/registry/registry-json.mdx:63`
> `| `name` | Yes | The registry's own name. Not a namespace U+2014 the namespace is chosen
> by the consumer in `components.json` |`

**AFTER**
> `| `name` | Yes | The registry's own name, not a namespace. The namespace is chosen by the
> consumer in `components.json` |`

**BEFORE** `content/docs/patterns/onboarding-and-first-run.mdx:94`
> `| Declined everything | The product still shows something honest U+2014 never a locked
> screen with no exit |`

**AFTER**
> `| Declined everything | The product still shows something honest, and never a locked
> screen with no exit |`

---

### R15. The lone placeholder cell

**Recognise.** A cell whose entire content is a dash. 15 rows. There is no sentence, so
there is no reframe; there is a decision.

**Move, decided. Write the word the column is asking for. Never an empty cell, never `N/A`,
never `0`, never two hyphens.** An empty cell reads as an oversight, and
`content/docs/health/numbers-units-precision.mdx` rule 13 already forbids exactly this
construction in product UI. The documentation has been breaking its own doctrine.

**The word is chosen by the column heading, which was checked against the real tables:**

| File and rows | Column heading | Write |
|---|---|---|
| `content/docs/theming/css-variables.mdx:59-63` | **Example** | `No single example` |
| `content/docs/foundations/materials/the-ladder.mdx:36-38` | blur | `None` |
| `content/docs/handbook/migrating-from-shadcn.mdx:47,48` | the opsinjs component | `No equivalent` |
| `content/docs/handbook/migrating-from-shadcn.mdx:75,76` | the shadcn variable | `No shadcn equivalent` |
| `content/docs/project/proposals.mdx:39` | a state label | `Not yet triaged` |
| `content/docs/project/state-of-the-system.mdx:46`, `content/docs/theming/index.mdx:104` | use it? | `Not applicable` |

**The `css-variables.mdx` row is a correction.** Two of the three source drafts said that
column means "opsinjs equivalent" and prescribed `None`. The header at
`content/docs/theming/css-variables.mdx:57` is `| Pattern | Example | Meaning |`. `None`
does not answer "Example". Write `No single example`.

**BEFORE** `content/docs/theming/css-variables.mdx:59`
> `| `--background` / `--foreground` | U+2014 | The page surface and its default text |`

**AFTER**
> `| `--background` / `--foreground` | No single example | The page surface and its default text |`

**BEFORE** `content/docs/handbook/migrating-from-shadcn.mdx:47`
> `| `Progress` | U+2014 | `considered`; a `RangeBar` is not a progress bar |`

**AFTER**
> `| `Progress` | No equivalent | `considered`; a `RangeBar` is not a progress bar |`

---

### R16. JSX prop strings

**Recognise.** A dash inside `describes:`, `note:`, `notes:`, `action:`, `case:`,
`derivation:`, `use={[...]}`, `avoid={[...]}` or `questions={[...]}`, inside `<Anatomy>`,
`<CompositionTree>`, `<KeyboardTable>`, `<DataAttributesTable>`, `<WhenToUse>`, `<Steps>` or
`<StubNotice>`. Roughly a quarter of all the dashes in `content/docs`, concentrated in
`content/docs/components/`.

**Move.** The prose roles above apply unchanged. Four hazards specific to this container:

1. **The string is JavaScript.** `\"` escapes are live. A reframe that changes quoting breaks
   the MDX build. Do not assume markdown rules, and do not convert a double-quoted string to
   single quotes to dodge an escape.
2. **Some of these dashes are field separators**, not punctuation: an attribute list, then
   the dash, then what it is. **Decided: do not swap in a semicolon.** Make the slot the
   subject and give it a verb. `content/docs/components/care-card.mdx:292` was offered as a
   semicolon precedent and is not one: it uses a semicolon **and** still carries a banned
   character later in the same string. Its existing semicolon stays, because it was already
   there; its dash reframes.
3. **`<StubNotice questions={[...]}>` strings are the honesty surface.** They are the open
   safety questions and they survive promotion to `alpha`. Edit for the dash. Never edit the
   claim.
4. **HTML entities.** Where the real file holds `&lt;` and `&gt;`, keep them. Where it holds
   real angle brackets, keep those.

**BEFORE** `content/docs/components/log-sheet.mdx:226`
> `note: "data-slot=\"sheet-content\" U+2014 the scrolling region, Sheet's",`

**AFTER**
> `note: "data-slot=\"sheet-content\" is Sheet's own scrolling region",`

**BEFORE** `content/docs/components/consent-sheet.mdx:241`
> `note: "Sheet's container U+2014 data-slot=\"sheet-container\"",`

**AFTER**
> `note: "Sheet's container is data-slot=\"sheet-container\"",`

**BEFORE** `content/docs/components/empty-state.mdx:108`
> `describes: "The root. Takes colour from neither axis U+2014 an empty state is not a
> clinical level and not a category U+2014 and establishes a container so the parts below
> can respond to the space they were given rather than to the viewport.",`

**AFTER**
> `describes: "The root. It takes colour from neither axis, because an empty state is not a
> clinical level and not a category. It establishes a container so the parts below can
> respond to the space they were given rather than to the viewport.",`

---

### R17. Related-links and bold-label list items

**Recognise.** `- [Link](path.mdx) U+2014 gloss` or `- **Term** U+2014 gloss`. **594 link
bullets across 167 files, and 202 bold-label bullets.** The single largest mechanical
cluster, and the one place a wrong decision costs hundreds of re-edits.

**Move.** §4.1, which is one template, one closed verb table and one escape hatch. No
per-instance deliberation.

**BEFORE** `content/docs/patterns/onboarding-and-first-run.mdx:138`
> - **Skip is a real, focusable control** with a real label U+2014 not grey text positioned
>   to be missed.

**AFTER**
> - **Skip is a real, focusable control** with a real label. It is not grey text positioned
>   to be missed.

**BEFORE** `content/docs/health/uncertainty-and-staleness.mdx:203`
> - **Measurement uncertainty as an interval** U+2014 showing a value plus or minus a
>   confidence bound, which is worth doing wherever the source supports it and is not
>   specified here yet.

**AFTER**
> - **Measurement uncertainty as an interval.** Showing a value plus or minus a confidence
>   bound is worth doing wherever the source supports it, and it is not specified here yet.

---

### R18. Mermaid node labels inside `<FlowDiagram>`

**Recognise.** A dash inside a `["..."]` node label in a mermaid block. Five instances, in
two files: `content/docs/patterns/alert-escalation.mdx:59,61,63,64` and
`content/docs/patterns/ask-users-for/medications.mdx:59`.

**Move.** A caption in a width-constrained box is not a sentence, so no sentence reframe
fits. Use a two-line label with `<br/>`, which is diagram markup rather than MDX and so does
not touch the closed JSX vocabulary. `content/docs/health/emergency-and-escalation.mdx:52-65`
already uses this idiom and is already clean. Copy it, and look at the rendered diagram
after the change.

**BEFORE** `content/docs/patterns/alert-escalation.mdx:59,61`
> `  B -->|"no"| C["Rung 1 U+2014 Ambient: a StatusPill on the metric"]`
> `  D -->|"no"| E["Rung 2 U+2014 In-context: an AlertBanner in the relevant section"]`

**AFTER**
> `  B -->|"no"| C["Rung 1, ambient<br/>a StatusPill on the metric"]`
> `  D -->|"no"| E["Rung 2, in-context<br/>an AlertBanner in the relevant section"]`

**Mermaid arrow syntax is not a dash.** `-->`, `--`, `---`, `-.->` and `==>` are the
diagram's grammar. The §6.6 ban on `--` covers `--` used as a text separator in prose, and
nothing else. Do not touch an edge.

---

### R19. ASCII diagrams and comments inside fenced code samples

**Recognise.** A dash inside a fenced block: a comment in a CSS or TS sample a reader copies,
or an annotation column in a ```text composition tree.

**Decided: fenced code is in scope.** A comment in a sample is prose the reader will paste
into their own project, which makes it the furthest-travelling prose on the page.

**Move for a sample comment.** The prose roles above.

**BEFORE** `content/docs/foundations/colour/gamut-and-p3.mdx:73`
> `/* Wrong U+2014 `color-gamut` is a media feature, not a CSS property, so this`

**AFTER**
> `/* Wrong. `color-gamut` is a media feature, not a CSS property, so this`

**BEFORE** `content/docs/handbook/server-and-client-components.mdx:44`
> `  // page.tsx U+2014 server`

**AFTER**
> `  // page.tsx, running on the server`

**Move for an ASCII composition tree.** Reframe the annotation, then **re-pad so the
annotation column stays aligned.** A tree whose columns no longer line up is a worse defect
than the dash was. The affected files are `content/docs/screens/consent-flow.mdx:66,77,84`,
`daily-log-screen.mdx:69`, `onboarding-screen.mdx:53,59` and `trends-screen.mdx:73`.

**BEFORE** `content/docs/screens/consent-flow.mdx:65-66`
> `├── 1. Ask                             ConsentSheet, one rung above the surface`
> `│   │                                  that triggered it U+2014 context stays visible`

**AFTER**
> `├── 1. Ask                             ConsentSheet, one rung above the surface`
> `│   │                                  that triggered it, so context stays visible`

---

### R20. Rendered strings, dev warnings, screen-reader text and `<DoDont>` specimens

**Recognise.** A string literal that reaches a screen or a console, any `sr-only` text, and
any quoted copy specimen inside `<DoDont.Do>` or `<DoDont.Dont>`.

**Move.** Full prose reframe. A console warning is read under stress and benefits from a
full stop more than any other copy in the tree. **Treat every string in
`registry/bases/base/*.tsx` as patient-facing until you have proved otherwise:** several
are `aria-describedby` targets, not console output.

**Screen-reader-only text is the purest form of the defect**, because the whole string
exists to be spoken and a dash is either skipped or read out as "dash". Use a full stop,
which gives speech synthesis the pause the dash was reaching for and is announced
correctly.

**BEFORE** `components/docs/health.tsx:83`
> `        <span className="sr-only"> U+2014 in plain English: {plain}</span>`

**AFTER**
> `        <span className="sr-only">. In plain English: {plain}</span>`

**BEFORE** `components/docs/health.tsx:326-328`
> `            <span className="sr-only">`
> `              {HEALTH_CATEGORY_LABELS[category]} U+2014{" "}`
> `            </span>`

**AFTER**
> `            <span className="sr-only">`
> `              {HEALTH_CATEGORY_LABELS[category]}.{" "}`
> `            </span>`

**BEFORE** `registry/bases/base/reading-input.tsx:895` (this is `<p
data-slot="reading-input-effect">` text, reached by `aria-describedby` and read aloud to a
patient, not a console string)
> `          : `Cleared U+2014 enter the reading again in ${effect.to}.`}`

**AFTER**
> `          : `Cleared. Enter the reading again in ${effect.to}.`}`

**BEFORE** `registry/bases/base/sheet.tsx:667`
> `"and KNOWN_REASONS in sheet.tsx are the two places to fix U+2014 see "`

**AFTER**
> `"and KNOWN_REASONS in sheet.tsx are the two places to fix. See "`

**`<DoDont.Do>`: rewrite the specimen to the copy you are now telling people to write.**

**BEFORE** `content/docs/patterns/daily-logging.mdx:132`
> `    After saving: "Saved U+2014 128/82 at 07:41." The reader can verify what was`

**AFTER**
> `    After saving: "Saved. 128/82 at 07:41." The reader can verify what was`

**`<DoDont.Dont>`: decided. Remove the banned character and change nothing else.** Do not
repair the specimen's grammar while you are in there; it is deliberately bad. Then check the
fault count the page states.

**BEFORE** `content/docs/recipes/value-against-a-range.mdx:173`
> `    "Glucose: 6.1 U+2014 HIGH (warning) (Normal: 3.9U+20135.6). Your result is abnormal." Four`

**AFTER** (no inserted "is": the telegraphic caps form is part of fault three, "shouting")
> `    "Glucose: 6.1 HIGH (warning) (Normal: 3.9 to 5.6). Your result is abnormal." Four`

The following line names "four faults: a banned word, a verdict the data does not support,
shouting, and no statement of what happens next." The dash was not one of the four, so the
count stays four. **Never add a fault to the list unless the page is actually teaching about
punctuation, and never remove one to make the sentence flow.**

---

### R21. Comments and JSDoc in `.ts`, `.tsx`, `.mts`, and SVG comments

**Recognise.** A dash inside `/** */`, `/* */`, `//` or `<!-- -->` anywhere under
`registry/`, `lib/`, `app/`, `components/` or `scripts/`. About 1,654 occurrences. This
includes `app/icon.svg`, which holds one em dash in an SVG comment.

**This is not private text.** `scripts/build-registry.mts:347` copies
`registry/bases/base/*.tsx` byte for byte into `registry/__index__.ts`, which
`<ComponentSource>` renders on every component page and which `shadcn add` writes onto a
stranger's disk. Treat a comment in these paths as published prose.

**Move.** The prose roles above, plus two publication rules that constrain the split.

**Publication rule 1: props JSDoc publishes in full.** `parseDoc()` at
`scripts/build-reference.mts:1099` strips only `@tag` lines and joins **every remaining
line** of the block. A JSDoc inside `export interface ...Props` in
`registry/bases/base/*.tsx` therefore reaches `lib/generated/props.ts` and the props table
entire, both paragraphs. **Replace the whole block. Do not drop a paragraph.**

**Publication rule 2: `lib/**` export JSDoc publishes its FIRST SENTENCE ONLY.**
`scripts/build-reference.mts:865-867` computes `joined.indexOf(". ")` and slices there. The
first sentence becomes `symbol.summary`, which is what renders in
`content/docs/reference/generated/types.mdx` and in each
`content/docs/reference/api/<Symbol>.mdx`. **A split that moves the claim into sentence two
silently deletes it from the reference pages. The first sentence must carry the whole
claim,** which usually means a relative clause with its copula written out rather than a
full stop.

**BEFORE** `lib/status.ts:209`
> ` * The absence of an assertion U+2014 no reading, a stale reading, or a reading whose`
> ` * reference range the product does not own.`

**AFTER** (one sentence, whole claim published; "a reading never taken" is the wording
`value.tsx` already uses for the same state)
> ` * The absence of an assertion, which covers a reading never taken, a stale reading, or a`
> ` * reading whose reference range the product does not own.`

**BEFORE** `lib/registry.ts:136`
> ` * True only when there is a real renderable behind this name U+2014 a base component on`
> ` * disk, not a catalogue row.`

**AFTER** (the "not a catalogue row" distinction stays inside sentence one)
> ` * True only when a base component for this name is on disk, which a catalogue row alone`
> ` * is not.`

**BEFORE** `registry/bases/base/term.tsx:604-606`
> `  /* Expansion first, then definition, then stop U+2014 `term.mdx:166-168`. The`
> `     em dash is a separator between two different kinds of statement, and it is`
> `     the only punctuation this component owns. */`

**AFTER** (and see §5.3; the stale `term.mdx:166-168` citation is corrected to the lines
where the content rule actually lives, which is a permitted in-place repair because leaving
a knowingly false citation is worse)
> `  /* Expansion first, then definition, then stop. See `term.mdx:277` and `:296` onwards.`
> `     The expansion and the gloss are one apposition and are joined as one, because a`
> `     separator glyph here is punctuation a screen reader either skips or reads out, on a`
> `     component whose entire job is to be heard correctly. The comma is the only`
> `     punctuation this component owns. */`

---

### R22. Machine-facing delimiters, title templates and label strings

**Recognise.** A dash joining two fields rather than two thoughts: a template literal
building a page title, a panel label, a sidebar separator, a CSS `content:` string, or a
row in a machine-readable index.

**Move.** Name the relation with a word, or use a structure with no delimiter at all. One
exception, §5.4.

| Family | Sites | Decided form |
|---|---|---|
| Panel and device labels | `components/docs/source.tsx:313`, `preview.tsx:238`, `guidance.tsx:176` | a preposition: `Source of ${path}`, `${label} at ${width}px`, `Safety note for ${word}` |
| Sidebar separators | `content/docs/components/meta.json:8,15,21,24` and `registry/catalogue.ts:85-88` | delete the dash: `Health data display`, `Health communication`, `Health input`, `Health formatting`. One worker, one commit (§2.5) |
| CSS `content:` | `app/globals.css:893` | brackets, matching the sibling at `:870`: `content: " (printed from " attr(data-page-url) ")";` |
| llms.txt page row | `app/_machine/corpus.ts:707` | a markdown link, which is what the surrounding format already is |
| llms.txt file header | `app/_machine/corpus.ts:727` | `` `# ${title} on ${SITE_NAME}` `` |
| registry payload row | `app/_machine/registry-payload.ts:177` | `` `${row.title} is documented at ${url}` `` |
| Browser-tab title templates | §5.4 | the middle dot, which is already this repository's delimiter in that exact position |

**BEFORE** `app/_machine/corpus.ts:707`
> ``              `- ${metaOf(page).title} U+2014 ${pageMarkdownUrl(page)} (status: ${metaOf(page).status})` ``

**AFTER**
> ``              `- [${metaOf(page).title}](${pageMarkdownUrl(page)}) (status: ${metaOf(page).status})` ``

**BEFORE** `app/_machine/registry-payload.ts:177`
> ``  return `${row.title} U+2014 ${url}` ``

**AFTER**
> ``  return `${row.title} is documented at ${url}` ``

**BEFORE** `app/globals.css:893`
> `    content: " U+2014 printed from " attr(data-page-url);`

**AFTER**
> `    content: " (printed from " attr(data-page-url) ")";`

---

## 4. Canonical shapes

### 4.1 The related-links list item. Decided.

**A related-page bullet is a sentence whose subject is the linked page or the bold term.**
One shape, 796 items (594 links plus 202 bold labels), no options.

```
- [Page title](relative/path.mdx) VERB the rest of the gloss, ending in a full stop.
- **`Term`** VERB the rest of the gloss, ending in a full stop.
```

**Seven mandatory rules.**

1. **Link text stays the page title.** `content/docs/accessibility/for-content.mdx` requires
   it, and this edit must not weaken it.
2. **VERB comes from the closed table in §4.2.** There is no eighth row and no invention.
3. **The gloss keeps its wording and its lower-case first letter**, unless that word is a
   proper noun or a code span, or the table's verb absorbs it (see the `where` row).
4. **One sentence joins the link.** A gloss that already carries a second sentence keeps it
   as its own sentence after the first full stop.
5. **The item ends in a full stop.**
6. **Rewrap to 80 columns**, continuation lines indented two spaces.
7. **Both variants take the same treatment.** The link form and the `- **Bold**` form are
   one construction and must not end up with two conventions.

**Never** drop the gloss to avoid the problem, and **never** use a colon here: at 796 sites
it reads as exactly what it is, and it leaves the gloss a fragment terminated by a full
stop, which `content/docs/content/grammar-and-mechanics.mdx` already calls a defect.

### 4.2 The verb table. Closed, with one escape hatch.

| The gloss's first word | VERB | Note |
|---|---|---|
| already a finite verb or a modal | *(none: delete the dash and nothing else)* | the lede was always the subject |
| `the`, `a`, `an` | `is`, `has` or `covers` | see the three-way test below |
| `what`, `which`, `whether`, `when` | `says` | the gloss keeps its first word |
| `where` | `is where` | **the verb absorbs the word: delete `where` from the gloss** |
| `why` | `explains` | the gloss keeps its first word |
| `how` | `shows` | the gloss keeps its first word |
| any other bare noun phrase | `covers` | |

**The three-way test for `the` / `a` / `an`.** Read the gloss as a predicate of the link and
ask what the relationship is.

- The page or component **is** the thing the gloss names: `is`.
  `- [Value](./value.mdx) is the formatting primitive inside the tile.`
- The page **holds** the thing: `has`.
  `- [Principles](principles.mdx) has the five rules the rest of the pillar is derived from.`
- Neither reads true: `covers`.

**The escape hatch, and it is required.** Where the gloss is not a predicate of the link at
all, **do not force the verb.** Give the link a short predicate of its own and put the gloss
in a second sentence. Without this rule the table emits ungrammatical text at every
bold-label bullet whose gloss is already an independent clause, of which there are roughly
92.

**BEFORE** `content/docs/components/metric-tile.mdx:526`
> `- [Card](./card.mdx) U+2014 a tile is not a small Card; it has a fixed internal contract.`

**AFTER** (escape hatch: "a tile is not a small Card" is not a predicate of Card)
> `- [Card](./card.mdx) is a different component. A tile is not a small Card, and it has a`
> `  fixed internal contract of its own.`

**BEFORE** `content/docs/components/metric-tile.mdx:527`
> `- [StatusPill](./status-pill.mdx) U+2014 appears inside a tile, never as its background.`

**AFTER** (already a finite verb: delete the dash, nothing else)
> `- [StatusPill](./status-pill.mdx) appears inside a tile, never as its background.`

**BEFORE** `content/docs/foundations/index.mdx:127-128`
> `- [Principles](principles.mdx) U+2014 the five rules the rest of the pillar is derived`
> `  from; read this first.`

**AFTER** (`the`, and the page holds the rules rather than being them, so `has`)
> `- [Principles](principles.mdx) has the five rules the rest of the pillar is derived from.`
> `  Read this first.`

**BEFORE** `content/docs/content/health-literacy.mdx:148`
> `- **\`ResultCard\`** U+2014 the three-part answer above is its content contract.`

**AFTER** (escape hatch: the bold term is the possessor, so invert)
> `- **\`ResultCard\`** takes the three-part answer above as its content contract.`

**BEFORE** `content/docs/components/range-bar.mdx:676-677`
> `- [Reference ranges and normal](../health/reference-ranges.mdx) U+2014 the banned word and`
> `  the argument behind it.`

**AFTER**
> `- [Reference ranges and normal](../health/reference-ranges.mdx) has the banned word and`
> `  the argument behind it.`

### 4.3 Numeric ranges. Decided: the word "to", everywhere.

One vocabulary, and it is the one `registry/bases/base/range-bar.tsx:377-385` already ships:
`" to "` for a two-ended range, `"up to "` for an upper bound, `" and upwards"` for a lower
bound.

| Shape | Write |
|---|---|
| two-ended | `90 to 120`, `90 to 120 mmHg`, `3.9 to 5.6 mmol/L`, `0 to 255`, `hue 75 to 130`, `lines 175 to 264`, `3 May to 2 June 2026` |
| upper bound only | `up to 5.6 mmol/L` |
| lower bound only | `5.6 mmol/L and upwards` |
| two adjacent items, not a span | `lines 100 and 101` |
| a bounded integer property | `a titleLevel of 2, 3, 4, 5 or 6`, `any level from h2 to h6` |

**The unit is written once, after the second number**, when both ends share it.

**There is no shorter compact form.** The surfaces where a range is most compressed are the
ones a reader scans fastest and hears read aloud. Where a layout genuinely cannot hold the
word, the answer is two labelled elements rather than one joined string.

**A hyphen is never permitted between two numbers.** That has no exception.

**This reverses published doctrine in four files.** §7 carries the exact replacement text,
and it lands in the same commit as the sweep or the corpus contradicts itself.

### 4.4 The A to Z glossary name. Decided.

**The page is titled `Plain-English A to Z`.** Every inbound link text is
`Plain-English A to Z`, with the hyphen in "Plain-English", which also settles the existing
split between that spelling and "Plain English". Mid-sentence lowercase ("the plain-English
A to Z") stays lowercase where it already is. "the NHS A to Z" is what the NHS itself calls
its own product.

This is not an invention. The page's own `aliases:` line at
`content/docs/content/plain-english-a-z.mdx:7` already declares `a to z`;
`registry/catalogue.ts:1264` reserves the same string;
`content/docs/components/term.mdx:113` already writes "A-to-Z"; and
`scripts/build-reference.mts:603,609,629` already write "A-Z". The spelling the repository
uses for search is being promoted to the spelling it uses for reading.

**The slug `plain-english-a-z` does not change.** It is ASCII, every piece of machinery keys
on it, and a hyphen in a URL is not a dash. No redirect, no `meta.json` change, no
`RESERVED_ALIASES` change, no script route change, no anchor breakage.

**Sites that move in one commit:** the `title:`, roughly 29 inbound link texts, the prose
mentions of "the NHS A to Z", `app/_machine/corpus.ts:126`,
`components/docs/health.tsx:63,113,115,139`, the three hand-written lines above the marker in
`content/docs/reference/generated/glossary.mdx` (lines 3, 23 and 38, all above the marker at
line 43, so zero drift), and `scripts/build-reference.mts:603,609,629`, which then needs a
regenerate. Headings on the page itself become `### The list`
(`content/docs/content/plain-english-a-z.mdx:112`) and `### The rendered list`
(`content/docs/content/glossary.mdx:125`), which read better directly above `<Glossary />`
than a repeated title does.

### 4.5 Coordinate compounds. A closed list of five.

An ASCII hyphen is correct **only** when both hold: the two words form a single compound
modifier standing before a noun, **and** the hyphenated spelling is the one in ordinary use
outside this repository.

**The list is closed at five and adding to it is a human decision, not an agent's:**

`red-green` · `blue-yellow` · `blue-violet` · `long-wavelength` · `short-wavelength`

Sites: `content/docs/foundations/colour/colour-blindness.mdx:18,42,59,206` and
`content/docs/foundations/colour/index.mdx:170`. These are the spellings the OED, the NHS
and every ophthalmology text use, and
`content/docs/foundations/colour/colour-blindness.mdx:201-202` already reaches for the same
shape twenty lines away. This is a reframe to the ordinary spelling, not a glyph swap.

**Everything else reframes**, including `blue-orange`, which one source draft wanted to add
to the list. It is not added: blue and orange are not a standard named axis, and the same
page writes "a blue-to-orange one" four lines from the dashed form.

| Before | After |
|---|---|
| `colour-blindness.mdx:210` `a blueU+2013orange status axis` | `a status axis running from blue to orange` |
| `foundations/typography/tokens.mdx:79`, `typography/index.mdx:141` `Every roleU+2013surface pair is measured` | `Every pairing of a role with a surface is measured` |
| `components/score-dial.mdx:432` `anything on the poorU+2013fairU+2013good ladder` | `any ladder that runs from poor through fair to good` |

The `RolePair` type at `content/docs/reference/api/RolePair.mdx` carries no dash, which is
corroboration that "pairing of a role with a surface" is already the system's own word.

### 4.6 Proper names. The ASCII hyphen, one closed list of one.

**`Flesch-Kincaid`**, with an ASCII hyphen. Two sites: `components/docs/guidance.tsx:535`
(JSDoc) and `:590` (rendered UI). They move together.

The en dash between two surnames is one house convention for joint authorship and is not the
common spelling; ASTM, Microsoft's own readability panel and most of the education
literature write it with a hyphen, so the hyphen **is the name** rather than a substituted
glyph.

**Renaming it is forbidden.** `AGENTS.md` §9 bars degrading a citation,
`components/docs/guidance.tsx:554-557` implements the specific Flesch-Kincaid coefficients,
and a page that says "a standard reading-grade formula" cannot name what it computed.
Naming a different thing than you computed is a small lie in a corpus with a rule against
lies.

**The eponym exception list is closed and has one member.**

### 4.7 Table cells

R14 for prose in a cell. R15 for a cell whose whole content is a dash, with the word chosen
by the column heading. Two further points:

- **A row may carry both kinds.** `content/docs/project/state-of-the-system.mdx:46` and
  `content/docs/theming/index.mdx:104` each hold in-cell prose **and** a lone placeholder
  cell on the same line. Both moves land in one edit, by the worker who owns the file.
- **The markdown delimiter row `| --- |` is structure, not punctuation.** Untouched.

### 4.8 Frontmatter descriptions

R12. Two sentences or a restructure, never a comma in the dash's seat, 240 characters hard.

### 4.9 Headings frozen by `scripts/assert-ia.mts`

`collectHeadings()` at `scripts/assert-ia.mts:681` reads **`##` only**. The frozen names live
in `lib/status.ts` `SECTION_OUTLINES` and `COMPONENT_SECTIONS_BY_STATUS`, and **not one of
them contains either banned character**, so no required heading needs to change.

**Never reword an H2 that appears in `SECTION_OUTLINES` or `COMPONENT_SECTIONS_BY_STATUS`,
never add one, never drop one, and never give any heading a dash.** H3 and below are free
text.

**One dead alias to delete rather than respell.** `scripts/assert-ia.mts:1065` and
`components/docs/page-template.tsx:80` both hold

```
  "why (evidence)": ["why", "why U+2014 evidence"],
```

No page in the corpus spells the heading that way; all of them are `## Why (evidence)`.
**Delete the alias string from both files in one commit** (§2.5). Respelling it would keep
dead code alive; changing one file without the other makes the two enforcers disagree.

---

## 5. The rendered glyph decision

Five rendered families. All five are decided here, with the exact code.

### 5.1 `<Value>`'s absence form. The glyph goes.

`content/docs/health/numbers-units-precision.mdx:75` rule 13 **forbids a bare dash with no
explanation; it does not mandate a dash.** The component's own comment concedes the case:
the glyph is `aria-hidden`, so by construction it carries no part of the message for anybody
listening, and the comment says outright that the words beside it are the message. Removing
it satisfies rule 13 more completely than keeping it, and it makes the visible string and
the accessible string the same string, which is one fewer thing that can drift.

Nothing is gated on it: `apps/www` has no test directory, and `scripts/check-a11y.mts`
asserts nothing about it.

**BEFORE** `registry/bases/base/value.tsx:395-405`

```jsx
      {reading === null ? (
        <span data-slot="value-absence">
          {/* Decorative, and hidden for the reason the specification gives: a
              punctuation mark is either skipped by speech synthesis or read out
              as "dash", and neither of those is the message. The words beside it
              are the message, and they are visible as well as spoken U+2014
              `numbers-units-precision` rule 13 bans an em dash with no
              explanation, not an em dash. */}
          <span aria-hidden="true">U+2014</span>{" "}
          {broken ? "not available" : absenceWords}
        </span>
      ) : (
```

**AFTER**, exactly:

```jsx
      {reading === null ? (
        <span data-slot="value-absence">
          {/* Words, and nothing but words. An absence has to be SAID:
              `numbers-units-precision` rule 13 requires the explanation, and a
              punctuation mark in a value slot is either skipped by speech
              synthesis or read out as punctuation, so it never carried any part
              of the message and was always hidden from the accessibility tree.
              With it gone, the visible string and the accessible string are the
              same string. The slot is never empty and never a glyph:
              `absenceWords` falls back to the default wording precisely so that
              it cannot be. */}
          {broken ? "not available" : absenceWords}
        </span>
      ) : (
```

**The `absenceLabel=""` guard at `registry/bases/base/value.tsx:266-279` stays and becomes
MORE necessary**, because an empty label would now leave a genuinely blank element, which is
the failure `content/docs/foundations/data-states.mdx` names. The `absenceWords` fallback at
`:281-282` is unchanged. Only the comment and the warning string move:

```jsx
  /* An empty `absenceLabel` is the only way this component can be made to
     render nothing at all where an absence belongs, and `numbers-units-
     precision` rule 13 requires an absence to be said in words. Falling back to
     the default wording is the honest repair: a blank slot is
     indistinguishable from a component that failed to render. */
  const emptyLabel = absenceLabel !== undefined && absenceLabel.trim() === ""
  if (emptyLabel && isDevelopment()) {
    warnDevOnce(
      "empty-absence-label",
      '[opsinjs] <Value> received absenceLabel="", which would leave the absence ' +
        "slot empty. The default wording was used instead. An absence is said in " +
        "words, and a blank is indistinguishable from a component that failed to " +
        "render.",
    )
  }
```

**The `absenceLabel` JSDoc at `registry/bases/base/value.tsx:167-175` is replaced ENTIRE,
both paragraphs.** `parseDoc()` publishes the whole block into `lib/generated/props.ts` and
the props table, so dropping the second paragraph would delete the documented fallback from
the published API.

```jsx
  /**
   * What the absence form says when there is no reading. The default is "no
   * reading yet". It is not used for a number that arrived broken, which is a
   * different thing and says so in different words.
   *
   * An empty string falls back to the default and reports itself. The absence
   * form is words and nothing else, so an empty label would leave an empty
   * element where a reader expects to be told something.
   */
```

**Five things move in the same commit**, or a page will describe a component that no longer
exists:

- `content/docs/components/value.mdx:203` becomes
  `describes: "Renders instead of all three when there is no reading, and contains words and nothing else: 'no reading yet' for a reading never taken, 'not available' for a number that arrived broken. No glyph sits in front of the words, because a character in a value slot is either skipped by speech synthesis or read out as punctuation, and either way a reader who is listening is told nothing.",`
- `content/docs/components/value.mdx:341` becomes
  `**"No reading yet"** where a measurement is missing, in words, with nothing in front of them.`
- `content/docs/components/value.mdx:389-391` becomes
  `- **Absence is announced as absence**, in words, and the words are the whole of what is rendered. Nothing decorative sits in front of them, so there is nothing for speech synthesis to skip and nothing for it to read out as punctuation.`
- `content/docs/health/numbers-units-precision.mdx:75` rule 13, rewritten in §7.
- `registry/examples/value-zero-is-not-absence.tsx:12-14`, whose header comment teaches the
  old doctrine, and `ValueDemo` at `registry/bases/base/value.tsx:428`, whose preview
  screenshot regenerates.

**No alignment is lost, and nothing replaces the glyph.** `tabular-nums` aligns digit
glyphs; the em dash is not a digit and never sat on the decimal grid, and in a right-aligned
column it sat at the far end from where the eye scans.
`registry/examples/value-aligned-in-a-column.tsx` never renders the absence form at all. Do
**not** compensate with a middle dot, an ellipsis, `N/A`, `--`, `0`, a CSS `::before` rule
(`app/product.css` does not travel with `shadcn add`), muted colour (`<Value>` paints no
colour at all, and `pnpm check:a11y` fails the build on a colour literal in `registry/`), or
italics.

### 5.2 The live range in `components/docs/health.tsx`. Decided: "to".

The visible text is currently the only place in the system that joins a range with a glyph,
and it disagrees with the `aria-label` eighteen lines above it at
`components/docs/health.tsx:344`, which already says
``a reference range of ${low} to ${high}``, and with the shipped component it imitates at
`registry/bases/base/range-bar.tsx:380`, which returns `" to "`. This is not a glyph swap; it
brings one outlier into line with a house form that already exists twice in the same render.

**BEFORE** `components/docs/health.tsx:361-363`

```jsx
              <p className="m-0 mt-1 text-xs opacity-80">
                Your range: {low}U+2013{high} {unit}
              </p>
```

**AFTER**, exactly:

```jsx
              <p className="m-0 mt-1 text-xs opacity-80">
                Your range: {low} to {high} {unit}
              </p>
```

**And the status line at `components/docs/health.tsx:375-378`**, where the dash joins a
status word to a sentence. Two assertions, two sentences:

```jsx
            <p className="m-0 mt-2 text-sm font-medium">
              {CLINICAL_STATUS_META[verdict].word}.{" "}
              {CLINICAL_STATUS_META[verdict].sentence}
            </p>
```

The two `sr-only` strings in the same file, at `:83` and `:327`, are in R20.

### 5.3 `<Term>`'s separator. A comma, and a named exception.

The glyph at `registry/bases/base/term.tsx:612` is `{" U+2014 "}`, a plain text node inside
`definition`. **It is not `aria-hidden`.** It is in the accessibility tree and is spoken on
every `<Term>` that has an expansion, twice once the disclosure is open. It must go.

**Decided: a comma, and this is one of the two named exceptions in this document.** Three
reasons, and all three have to hold for an exception to be granted anywhere:

1. The expansion and the gloss are an **apposition**, rendered inline inside brackets, and a
   comma is the ordinary English mark for an apposition. It is the sentence a careful writer
   writes there.
2. A full stop inside the inline `(...)` wrapper produces
   `eGFR (estimated glomerular filtration rate. an estimate of how well your kidneys are
   filtering)`, which is worse prose.
3. **opsinjs may not insert a connective word here.** Both halves are supplied by the
   product's own glossary. Writing "which is" into them would be opsinjs authoring clinical
   copy it does not own. The alternative, rewriting every `expansion` field into a clause,
   breaks the content contract at `content/docs/components/term.mdx:278` that an expansion is
   "the full form and nothing else".

**AFTER**, exactly, replacing `registry/bases/base/term.tsx:604-617`:

```jsx
  /* Expansion first, then definition, then stop. See `term.mdx:277` and `:296`
     onwards. The expansion and the gloss are one apposition and are joined as
     one, because a separator glyph here is punctuation a screen reader either
     skips or reads out, on a component whose entire job is to be heard
     correctly. The comma is the only punctuation this component owns. */
  const definition = (
    <>
      {expansion === undefined ? null : (
        <>
          <span data-slot="term-expansion">{expansion}</span>
          {", "}
        </>
      )}
      {plain}
    </>
  )
```

Renders: `eGFR (estimated glomerular filtration rate, an estimate of how well your kidneys
are filtering)`. `data-slot="term-expansion"` is unchanged, so the anatomy and composition
tree on `content/docs/components/term.mdx` stay valid. That page carries prescriptive
specimens of the old form at `:156`, `:278`, `:288`, `:297`, `:301`, `:302`, `:308` and
`:313`; they move in the same commit, and `:302` becomes
`Every word in it needs its own definition, and the reader is exactly where they started.`

### 5.4 Browser-tab title templates. The middle dot, and a named exception.

**U+00B7 MIDDLE DOT is not a banned character.** The mandate bans two characters. The 173
middle dots already in this tree are out of scope and stay, including the ones in
`content/docs/health/*.mdx` pages another worker owns, in `content/_templates/component.mdx`,
and in the llms.txt row format documented at `content/docs/agents/llms-txt.mdx:66`.

**Decided: the middle dot is the form for a browser-tab title template, and for nothing
else.** A `<title>` is a two-field label with no sentence to reframe; this repository already
has a house delimiter in exactly that position at
`app/(view)/view/[base]/[style]/[kind]/[name]/page.tsx:148`; and the same character is
already the documented field separator in the machine index rows. Using it here is
convergence on an existing form, not a glyph swap.

**It is forbidden everywhere else, and in particular in body copy, in a heading, in a table
cell, and in any string a patient reads.** Do not introduce a new one outside this list.

| Site | AFTER |
|---|---|
| `app/(chrome)/(docs)/layout.tsx:22`, `app/(chrome)/(home)/layout.tsx:25`, `app/(chrome)/(playground)/layout.tsx:17` | `` template: `%s · ${site.name}` `` |
| the `default:` on the line below each of those three | `` default: `Documentation · ${site.name}` `` and its siblings, same shape |
| `app/(chrome)/not-found.tsx:29` | `<title>Page not found · opsinjs</title>` |
| `app/not-found.tsx:47` | `<title>Page not found · opsinjs</title>` |

**Two sites in this family are sentences, not labels, and reframe instead.**

**BEFORE** `app/(chrome)/(home)/page.tsx:19-21`
> ``  /* `absolute` because the group layout appends " U+2014 opsinjs" to every title``
> ``     below it, and this one already opens with the name. */``
> ``  title: { absolute: "opsinjs U+2014 a design system for consumer health apps" },``

**AFTER**
> ``  /* `absolute` because the group layout appends " · opsinjs" to every title``
> ``     below it, and this one already opens with the name. */``
> ``  title: { absolute: "opsinjs is a design system for consumer health apps" },``

**BEFORE** `app/(view)/view/[base]/[style]/[kind]/[name]/page.tsx:148` (this line already
holds a middle dot, so substituting one for the dash would give it two)
> ``    title: `${name} U+2014 ${kind} at ${base}/${style} · opsinjs product theme`,``

**AFTER** (the kind becomes a modifier of the name, which is what it always was)
> ``    title: `${kind} ${name} at ${base}/${style} · opsinjs product theme`,``

### 5.5 The remaining rendered glyphs

| Site | AFTER |
|---|---|
| `registry/bases/base/score-dial.tsx:965`, the band legend | `{plain(entry.from, locale)} up to {plain(entry.to, locale)} is {entry.name}` |
| 18 lone-glyph placeholder cells in tooling UI: `components/docs/a11y.tsx:215,218,512,530,533`, `components/docs/guidance.tsx:575,581`, `components/docs/status.tsx:512`, `app/(chrome)/(home)/colors/ramp-browser.tsx:287-289`, `app/(chrome)/(home)/tokens/token-browser.tsx:342`, both playground tools, `app/_shared/contrast-client.ts:132,139`, `app/api/feedback/route.ts:143`, `scripts/build-tokens.mts:2593` | the word the column means, never an empty string: `not measured` for a contrast reading, `not resolved` for a token value, `not scored` for a readability grade, `none` for an empty alias list, `not given` for a missing field, `None` for the generated docs cell |
| `content/docs/reference/generated/data-attributes.mdx:33` (hand-written, above the marker at `:61`) | the documented convention becomes the words `presence only`, and `scripts/build-reference.mts` must emit `presence only` when it learns to fill that table |
| `lib/opsinjs.ts:111` `EXAMPLE_SOURCE` | `"Example data rather than a reference range"` |

**On `score-dial.tsx:965`: the existing "up to" stays.** These are band edges, not a
reference range, and `up to` is a half-open boundary claim. Changing it to "X to Y" would
change what the legend asserts. This is not a contradiction of §4.3, which governs a span
between two values.

**On `EXAMPLE_SOURCE`: decided against the two-sentence form.** `"Example data. Not a
reference range."` is a trailing fragment, which R1 itself calls a dash wearing a hat and
§6.10 calls the fragment tic. `rather than` is a negation, it is the corpus's own contrastive
device, and it fits a caption slot as one string. It sits outside the spliced region in
`lib/opsinjs.ts` and is hand-edited. It is quoted verbatim at
`content/docs/components/range-bar.mdx:78`, `content/docs/components/score-dial.mdx:82` and
`content/docs/project/decisions/0012-synthetic-example-data.mdx:50`; all four move in one
commit or the pages misquote the constant.

### 5.6 `tokens/glossary.json`: patient-facing definitions

Six dashes, at lines 2, 167, 187, 267, 275 and 346. Four of them are `terms[].plain` strings
rendered inline by `<Term>` and read aloud. They are the highest-stakes strings in the
sweep.

**Decided: they are swept, and the only permitted move is to write out the copula as a
relative clause.** The head noun does not change, the order does not change, and an
indefinite article does not become a definite one. A draft that rewrote these as
`"the lower of the two blood pressure numbers, measured between heartbeats"` is **rejected**:
it stops defining diastolic as a pressure and defines it as a position in a pair, and it
adds a claim about measurement technique the original never made. A draft that wrote
`"the unit used for many blood test results"` is **rejected**: it would have the corpus call
both mmol/L and mg/dL "the unit", which contradicts that entry's own `reason` field.

| Line | BEFORE | AFTER |
|---|---|---|
| 187 | `"the pressure between heartbeats U+2014 the lower of the two blood pressure numbers"` | `"the pressure between heartbeats, which is the lower of the two blood pressure numbers"` |
| 346 | `"the pressure while your heart beats U+2014 the higher of the two blood pressure numbers"` | `"the pressure while your heart beats, which is the higher of the two blood pressure numbers"` |
| 267 | `"millimoles per litre U+2014 a unit used for blood test results"` | `"millimoles per litre, which is a unit used for blood test results"` |
| 275 | `"milligrams per decilitre U+2014 a unit used for blood test results"` | `"milligrams per decilitre, which is a unit used for blood test results"` |

Lines 2 (`$comment`) and 167 (`reason`) are ordinary prose and take R1. Line 2 also contains
"NHS A-Z", which becomes "NHS A to Z" per §4.4.

---

## 6. Forbidden moves

Every one of these will be reverted. They are listed because they are what a hurried agent
reaches for. Each has a real bad AFTER.

**6.1 The comma splice.** Ungrammatical, and the commonest failure.
- Bad: `The number stays on screen, hiding it helps nobody, and a reader who wanted to see their last reading is entitled to it.`
- Correct: R1.

**6.2 The comma in the dash's seat.** Even when it is grammatical, it is a substitution.
- Bad: `Its suppression behaviour, hiding every other alert on the screen, is part of that specification.` The participle now hangs off the wrong noun.
- Bad: `description: The documentation site held to the standard it publishes, including the places where it currently fails.`
- Correct: R2 and R12.

**6.3 The colon tic.** A colon is right where what precedes it is a complete independent
clause and what follows is a genuine list of two or more items, or a quoted specimen. It is
not right 4,000 times, and it is never right in a related-links bullet or a `description:`.
Colons already in the text stay.
- Bad: `The number stays on screen: hiding it helps nobody.`
- Bad: `- [Principles](principles.mdx): the five rules the rest of the pillar is derived from.`

**6.4 Brackets around the load-bearing half.** Brackets demote, and in this corpus the
insertion is usually the most important part of the sentence.
- Bad: `The rest (equal visual weight for both options, withdrawal at the same depth as agreement, recording the wording version) is opinion.`
- **Permitted use, and the only one:** a trailing qualifier on a noun phrase, where nothing
  was interrupted, as in `### The scope claim (minutes 0 to 3)`.

**6.5 The semicolon.** The dash in a slightly stiffer hat. It joins two independent clauses,
which is what the dash was doing, so nothing has been reframed. **No new semicolon anywhere
in this sweep, including in a `note:` field separator.** Semicolons already in the text stay.
- Bad: `It has no npm dependency and pulls in no other registry item; the phrase and the date come from Intl.`
- Bad: `note: "Sheet's container; data-slot=\"sheet-container\""`

**6.6 Any other dash-shaped character.** U+2010, U+2011, U+2012, U+2015, U+2E3A, U+FE58,
U+FF0D, and the double hyphen `--` used as a text separator. Substituting one of these is a
worse offence than leaving the em dash, because it hides from a search for the two banned
characters.
- Bad: `Tier 1 (U+2012) ramps`, `90(U+2011)120`, `Saved -- 128/82 at 07:41.`
- **Not covered:** `--` as a CSS custom-property prefix, a CLI flag, a mermaid edge, or a
  quoted specimen of the defect a page is condemning.

**6.7 The spaced hyphen ` - `.** Specifically forbidden as a replacement, because it passes a
glyph search while reading exactly like dashed prose.
- Bad: `Button - the control you press to make something happen.`
- **Note:** 86 spaced hyphens already exist in `skills/**` and more in
  `scripts/build-registry.mts`. Those are pre-existing prose quality, not this sweep. See
  §8.7.

**6.8 The ellipsis.** Never. It signals omitted text, which is a lie about the sentence.
- Bad: `The number stays on screen ... hiding it helps nobody.`

**6.9 The minus sign as a joiner.** U+2212 is arithmetic notation and is untouched (§8.1).
Never introduce it as a range separator.
- Bad: `90(U+2212)120`

**6.10 The fragment tic.** `Not a palette. Not a set of overrides. One colour.` is genuinely
better than the dashed original once. Used on every emphatic dash in the corpus it becomes
the new mannerism. At most one fragment run per page, and never a bare noun-phrase fragment
where a sentence was owed.
- Bad: `Focus lands on the heading that names the test. Not on the back control.`

**6.11 The relative-clause chain.** Turning every dash into "which" produces sentences that
never land.
- Bad: `every custom property resolves to nothing, which is the failure the next section is about, which is where presets are introduced.`

**6.12 Deleting the aside.** The concession, the reason and the open question are the
content, not decoration. §1.1.3.
- Bad AFTER of `content/docs/components/score-dial.mdx:590`: `The component mounts no live region.`

**6.13 Softening a prohibition.** §1.1.1 and §1.1.4.
- Bad AFTER of `content/docs/components/relative-time.mdx:129`: `It should usually not be an amber tint.`
- Bad AFTER of `content/docs/components/metric-tile.mdx:132`: `opsinjs holds no such number, generally.`

**6.14 Inventing a bridge.** Adding a cause, a number, a threshold, a reassurance or an
example that was not in the BEFORE, in order to make two halves join. The corpus's rule
against invented evidence applies to connective tissue as well as to citations.
- Bad AFTER of `content/docs/patterns/forms/question-pages.mdx:30`: `Getting it wrong changes a dose, a date or a unit.` That deletes the stakes claim and turns an asyndetic list of instances into a disjunction.

**6.15 Dropping the gloss.** Deleting information to avoid rewriting it is the opposite of
the prose bar.
- Bad: `- [Principles](principles.mdx)`

**6.16 Changing the claim while changing the punctuation.** A dash sweep does not change a
`status`, a clinical word, a threshold, a number, a citation, a `reviewed` date, a
`<StubNotice questions>` entry, or anything inside `<NotBuiltYet>`, `<NoDataYet>` or
`<Todo>`. **One named exception, §7.5.** If a sentence cannot be reframed without changing
what it asserts, leave it and report it.

**6.17 Repairing a `<DoDont.Dont>` specimen.** Remove the character; leave the specimen as
broken as it was, and check the page's stated fault count.
- Bad: `"Glucose: 6.1 is HIGH ..."` where the original was telegraphic. The telegraphic caps
  form is part of fault three.

**6.18 Editing what the page CALLS the character.** Prose that names an em dash in words,
such as `content/docs/foundations/data-states.mdx:100` ("an em-dash reads as 'fine'"),
contains no banned character and stays. Do not "fix" it. If the claim has changed because
the component changed (§5.1), rewrite the claim on its merits, not because it contains the
letters.

**6.19 Touching a frozen heading.** §4.9.

**6.20 Inventing an MDX tag to carry the separation.** The vocabulary is closed at
`scripts/assert-ia.mts:204-303` and `assert-ia` fails the build on any other capitalised JSX
tag. There is no `<Card>` and content work never defines one.

**6.21 Hand-editing generated output.** §2.3 and §9.

**6.22 A global replace.** No `sed` over the tree, no editor-wide find-and-replace, no regex
that deletes the character. Every one of these instances is a sentence that has to be read. A
replace pass will also destroy the 25 U+2212 minus signs and corrupt the published Fahrenheit
identity at `tokens/units.json:66`, along with the arrows in `lib/color/*.ts`, the `--`
specimens quoted as defects, and every ordinary hyphen in a compound modifier or a kebab-case
id.

**6.23 Running the wrong command.** During a parallel authoring phase: no `git`, no
`pnpm install`, no `turbo`, no build, no `pnpm run generate`. Those belong to the sequential
phase.

**6.24 Sweeping a file outside your set.** File sets are disjoint (§2.5). Report it; do not
fix it.

---

## 7. Rules in the corpus that now contradict the ban

Four files currently mandate a banned character. **They land in the same commit as the
sweep, or the corpus contradicts itself.** Note that two of them already disagree with each
other about spacing, which is independent evidence that the glyph was never the real rule:
`grammar-and-mechanics.mdx:114` says *no spaces*, `numbers-units-precision.mdx:74` says *with
spaces*.

**All replacement text below names the characters in words and never prints one**, so the
gate in §8.6 needs no allowlist for these pages.

### 7.1 `content/docs/content/grammar-and-mechanics.mdx:64-66`

**Currently:**
> `- **Use a real en dash for ranges** and a real minus sign for negative numbers.`
> `  A hyphen in "90-120" is a typographic error; a hyphen in "-2 kg" is worse,`
> `  because it can be misread.`

**Replacement, exactly, as two bullets:**
```
- **Never an em dash and never an en dash.** Not in interface copy, not in a
  heading, not in a code comment, not in a data file. A sentence that seems to
  want one is carrying two statements, so write the two. Dropping a comma, a
  colon, a semicolon, a bracket, a hyphen or three dots into the gap is the same
  sentence still reaching for a dash.
- **Use a real minus sign for a negative number.** A hyphen in "-2 kg" can be
  misread. The minus sign is arithmetic notation rather than punctuation, and
  this rule does not touch it.
```

### 7.2 `content/docs/content/grammar-and-mechanics.mdx:114-115`

**Currently:**
> `- **Ranges use an en dash with no spaces** for pure numbers (`90U+2013120`) and the`
> `  word "to" when a unit or a direction is involved ("90 to 120 mmHg").`

**Replacement, exactly:**
```
- **Ranges use the word "to", never a dash and never a hyphen.** "90 to 120",
  "90 to 120 mmHg", "3.9 to 5.6 mmol/L". The unit is written once, after the
  second number. This holds in a table cell and an axis label as well as in a
  sentence, because a range is two numbers and a relation, and the relation has
  a word.
```

### 7.3 `content/docs/content/grammar-and-mechanics.mdx:193`

**Currently:**
> `| 90-120 | Hyphen where an en dash or "to" belongs. | 90U+2013120, or 90 to 120 |`

**Replacement: one row rewritten, two rows added:**
```
| 90-120 | A hyphen joins words. It does not span numbers, and it is read as a minus sign as often as not. | 90 to 120 |
| An em dash or an en dash, anywhere | Two statements wedged into one sentence, and a character a reader cannot say out loud. | Two sentences, or two elements |
| A dashed range of any kind | A glyph standing where the relation between two numbers should be. | 3.9 to 5.6 mmol/L |
```

### 7.4 `content/docs/content/numbers-dates-and-time.mdx:88-89`

**Currently:**
> `- **A range in prose uses "to"**: "90 to 120 mmHg". A range in a compact display`
> `  uses an en dash: `90U+2013120`.`

**Replacement, exactly:**
```
- **A range always uses the word "to"**: "90 to 120 mmHg" in prose, "90 to 120"
  in a compact display. The compact form loses the unit, never the relation.
```

### 7.5 `content/docs/health/numbers-units-precision.mdx`, rules 12 and 13

This page is `status: stable`, `kind: health`, `evidence: mixed`, `reviewed: 2026-09-02`,
`reviewer: design`. It is canonical for numeric formatting and wins where the four pages
disagree.

**Rule 12, currently at `:74`:**
> `| 12 | Ranges use an en dash with spaces and repeat the unit only once: `3.9 U+2013 5.6 mmol/L`. | Any two-ended span a component renders, including one the product supplies. | Two ends read as two separate values, or a unit read as applying only to the number it sits beside. |`

**Replacement, exactly:**
```
| 12 | A two-ended span is joined by the word "to" and carries its unit once, after the second number: `3.9 to 5.6 mmol/L`. A one-sided span is written "up to 5.6 mmol/L" or "5.6 mmol/L and upwards". No dash of any kind joins two numbers. | Any two-ended span a component renders, including one the product supplies. | Two ends read as two separate values; a unit read as applying only to the number it sits beside; and a character between the two ends that speech synthesis either skips or announces as punctuation. |
```

**Rule 13, currently at `:75`, whose last clause is what `<Value>` was built against:**

**Replacement, exactly:**
```
| 13 | Zero, none and unknown are three different things. `0 steps` is a measurement, "No readings yet" is an absence, and "Not available" is a failure. An absence renders as words and nothing else: no glyph precedes the words, no glyph stands in for them, and the slot is never left blank or filled with `0`. | Every empty, missing and error state on a surface that displays a value. | An absence read as a measurement of zero, a failure read as an absence, or a slot a reader cannot tell apart from a component that failed to render. |
```

**The one named exception to §6.16.** Rewriting rules 12 and 13 is a doctrine change on a
`kind: health`, `status: stable` page, not punctuation tidying. **This page's `reviewed` date
moves to the date of that commit and `reviewer` stays `design`.** Everywhere else in this
sweep, `reviewed` is untouched. Do not generalise this exception to any other page.

### 7.6 Where the new rule is stated for readers

`content/docs/content/grammar-and-mechanics.mdx` is the reader-facing home, per 7.1 to 7.3.
The house form for a related-links bullet (§4.1) is written down once in
`content/docs/handbook/contributing/documentation-templates.mdx` and
`content/docs/components/anatomy-of-a-component-page.mdx`, and the template at
`content/_templates/foundation.mdx:66` is updated so new pages are born correct.

---

## 8. Carve-outs, as path rules

**There are no content carve-outs.** No page, string or comment in this repository is
permitted to contain either character. What follows is the complete list of things that are
either not those characters, or not ours to rewrite.

### 8.1 Characters that are not banned and must survive untouched

- **U+2212 MINUS SIGN. 25 occurrences. Never touched, never matched by the gate, never
  introduced as a range joiner.** It is arithmetic notation and house style requires it for
  negative numbers. It appears in `tokens/units.json:66` (the Fahrenheit identity), its two
  mirrors at `lib/opsinjs.ts:426,435`, `app/_shared/contrast-client.ts:134`,
  `content/docs/content/health-literacy.mdx:97`,
  `content/docs/foundations/shape/radius-scale.mdx:49`,
  `content/docs/foundations/shape/tokens.mdx:51`,
  `content/docs/foundations/materials/the-contrast-floor.mdx:45,57`,
  `content/docs/foundations/motion/springs-as-tokens.mdx:50` and elsewhere.
- **U+2192 RIGHT ARROW**, throughout `lib/color/oklch.ts` and `lib/color/apca.ts`. Notation,
  not punctuation.
- **U+00B7 MIDDLE DOT. 173 occurrences. Not banned, not swept, and not introduced anywhere
  new except the title templates in §5.4.**
- **The ASCII hyphen**, in slugs, filenames, kebab-case ids, CSS custom properties, package
  names, the five compound modifiers in §4.5, and `Flesch-Kincaid`.
- **The two-hyphen sequence `--`**, wherever it is a CSS custom-property prefix, a CLI flag,
  a mermaid edge, or a quoted specimen of the defect a page is banning
  (`content/docs/foundations/data-states.mdx:98`,
  `content/docs/health/uncertainty-and-staleness.mdx:177,179`).
- **Markdown structure built from hyphens:** YAML frontmatter fences, horizontal rules, table
  delimiter rows `| --- |`, and the fumadocs sidebar separator wrapper `"---Label---"` in a
  `meta.json`. **Only the text between the wrappers is in scope.**
- **The word "dash" meaning an SVG stroke pattern** (`registry/bases/base/score-dial.tsx:304,307`,
  `content/docs/components/score-dial.mdx:215`). A line style, and it stays.

### 8.2 Not our bytes. Never scanned, never edited.

`node_modules/**` · `.git/**` · `.next/**` · `.turbo/**` · `.source/**` ·
`apps/www/.source/**` · `pnpm-lock.yaml` and any other lockfile · any vendored dependency.

### 8.3 Captured evidence. Never edited.

`audits/**` · `.playwright-mcp/**` · `.rawres/**`. These are dated records of what the site
did at a moment in time. Rewriting a record falsifies it. Excluded from the sweep and from
the gate.

**One consequence.** `audits/2026-09-05-visual-ux-audit/report.md:3666-3668` files a P3
asking for a non-breaking space so the absence phrase cannot break between the glyph and its
words. **That recommendation is withdrawn by §5.1 rather than implemented**, and the audit
file still says what it said.

### 8.4 Generated output. Fixed at source, never in place.

§2.3 for the nine paths and the three partly-generated exceptions. §9 for the source map.
The gate still scans these: a hit there means a source dash slipped through, and the error
message should point at the source.

### 8.5 A verbatim quotation from an external source

Anywhere, but only inside quotation marks, with the source named on the same page, and only
where the quoted text is genuinely somebody else's published words. **None exists in this
corpus today.** opsinjs does not copy NHS or other Crown-copyright text; it cites and writes
its own words.

If you believe you have found one, you are almost certainly looking at opsinjs's own prose,
and a `<DoDont.Dont>` specimen that opsinjs wrote is opsinjs's prose. **Do not alter a
genuine quotation and do not add an exception.** Leave it, and report it in your summary.
Altering a quotation is inventing evidence, which `AGENTS.md` §9 forbids outright.

### 8.6 The gate, and the rule page

**Construction requirement, not an exemption.** `apps/www/scripts/**` names the banned
characters only as the escapes `\u2013` and `\u2014` inside a regex or a string literal, so the
gate file stays ASCII and cannot trip its own check. `AGENTS.md`, `CLAUDE.md`,
`content/docs/content/grammar-and-mechanics.mdx` and
`content/docs/health/numbers-units-precision.mdx` name the characters in words and never
print one. **Written this way, no file needs an exemption, and the gate therefore has no
allowlist for any agent to grow.**

**The gate itself, added only after the sweep lands.** Natural home is
`scripts/assert-ia.mts`, which already owns the literal-`/docs/` ban at `:1540`. Code
`CPY001`.

- Pattern: a character class holding the two escapes `\u2013` and `\u2014`, with the `u` flag. Written as escapes, never as literals.
- Scope: `content/**` (including `content/_templates/**`), `app/**`, `components/**`,
  `lib/**`, `registry/**`, `tokens/**`, `scripts/**`, `hooks/**`, `skills/**`, and the five
  root markdown files. Excluded: §8.2 and §8.3 only.
- **Unlike the `/docs/` gate, do not restrict the scan to string literals.** Comments are
  published prose here (R21), so the whole file text is scanned.
- `.mts` is erasable-syntax-only and runs under plain node: a regex literal and a loop are
  fine, an `enum` is not.
- On today's tree it would report 7,907 em dashes and 121 en dashes. **Add it last.**

### 8.7 Test fixtures, and the spaced-hyphen backlog

**Test fixtures.** There is no test directory in `apps/www` today, and nothing anywhere is
gated on either character. If a fixture for the new gate is added later, it lives at a path
the gate excludes **by name** and builds the character with `String.fromCharCode(0x2014)`
rather than a literal.

**The spaced-hyphen backlog is explicitly NOT part of this sweep.** `skills/**` holds zero
banned characters and 86 spaced hyphens; `scripts/build-registry.mts` and
`scripts/assert-ia.mts` hold more. The mandate bans two characters, and §6.7 bans the spaced
hyphen **as a replacement for one of them**. Pre-existing spaced hyphens are a separate
prose-quality matter. **Do not rewrite a file that contains no banned character.** List what
you noticed in your summary and let a human schedule it.

### 8.8 Flagged for a human, not fixed

Every worker appends to this list in their summary. Three entries are already open:

- **`content/docs/health/alarm-fatigue.mdx:222`** leaves the "Where it is covered" cell
  genuinely empty for the Clinical monitoring row. Under R15 that cell should carry words.
  The `health/` pillar is owned by another worker; reported, not edited.
- **`content/docs/agents/llms-txt.mdx:66`** is a hand-written specimen of what the llms.txt
  route emits, and its dash arrives from `content/docs/components/card.mdx`'s `description`.
  **Decided:** fix the `description` first, then hand-edit the specimen to match the new
  output exactly, in the same commit. The specimen is documentation of machine output, not
  machine output, so it is hand-edited; the middle dots in it stay.
- **`content/docs/reference/generated/contrast.mdx:66`** carries a banned character in a
  marker line naming `scripts/check-contrast.mts`, and that script does not splice the file
  at all. **Decided:** hand-edit it per §2.3. It produces no drift.

---

## 9. Order of operations for generated artefacts

**Never hand-edit the right column. Edit the left, then run
`pnpm --filter @opsinjs/www run generate` in the SEQUENTIAL phase.**

| Edit this source | Regenerates |
|---|---|
| `registry/bases/base/*.tsx`, any byte including comments | `registry/__index__.ts` (`source`, `files[].content`, `REGISTRY_META.sourceHash`); and, if the byte is inside a `...Props` interface, `lib/generated/props.ts` (1,268 lines of published prop prose) |
| `lib/opsinjs.ts` and `lib/status.ts`, any byte | `registry/__index__.ts` `SHARED_FILES` plus its hash. Both ship verbatim into every consumer project |
| The **first sentence** of the JSDoc above each `export` under `lib/**` | `content/docs/reference/generated/types.mdx` and the body of `content/docs/reference/api/<Symbol>.mdx`. Chiefly `lib/color/oklch.ts:18,19,26,31,43,193,198,203,210,316,325,340`, `lib/color/apca.ts:34,220`, `lib/preset.ts:118,122`, `lib/registry.ts:136`, `lib/routes.ts:93,123,254,315`, `lib/status.ts:209`, `lib/opsinjs.ts:180`. **First sentence only: see R21 publication rule 2** |
| `content/docs/reference/api/<Symbol>.mdx` frontmatter and everything above the marker | **that file, by hand**, matching the new JSDoc first sentence exactly, in the same commit. Three descriptions are affected: `Oklch.mdx:3`, `Rgb.mdx:3`, `Rgb255.mdx:3` |
| The eight begin-marker lines listed in §2.3 | **those files, by hand.** `assemble()` preserves an existing marker line forever, so they never self-heal, and hand-editing them produces zero drift |
| `registry/catalogue.ts` string fields | `lib/generated/catalogue.json`, `public/r/**`, `content/docs/reference/generated/catalogue.mdx`, and every `considered` stub. Guarded by `node scripts/build-registry.mts --check`, which CI runs **before** `generate` |
| `registry/catalogue.ts:85-88` | **also `content/docs/components/meta.json:8,15,21,24`, which is hand-maintained and NOT gated against it.** Same worker, same commit (§2.5) |
| `scripts/build-registry.mts:789` | the identical sentence spliced into every `considered` stub. Editing the MDX alone fails `--check` |
| `tokens/glossary.json` (§5.6) | `lib/generated/glossary.json` and the generated half of `content/docs/reference/generated/glossary.mdx`. The three hand-written lines at `:3,23,38` sit above the marker at `:43` and are hand-edited |
| `tokens/errors.json:7,42` | the errors region of `lib/opsinjs.ts`, the generated region of `content/docs/handbook/error-codes.mdx`, and the runtime warning printed in a consumer's console |
| `tokens/{color,material,motion,shape,space,type,units}.json` | `lib/generated/tokens.ts`, `lib/generated/units.json`, `app/tokens.generated.css`, `content/docs/reference/generated/{tokens,css-variables}.mdx` |
| `scripts/build-tokens.mts:2293` | the region-marker line inside `lib/opsinjs.ts` |
| `scripts/build-tokens.mts:2593` | the placeholder cell in `content/docs/handbook/error-codes.mdx`, which becomes `None` |
| `scripts/build-reference.mts:93` | the `BEGIN` constant, per §2.3 |
| `scripts/build-reference.mts:603,609,629` | the glossary page's title prose and its `## A-Z` heading, which becomes `## A to Z` (§4.4) |
| `lib/opsinjs.ts:111` `EXAMPLE_SOURCE` | **hand-edited at source.** It sits outside the spliced region |

### 9.1 Phase order

1. **`content/_templates/**` first.** Thirteen files, about thirty dashes, including the
   `TEMPLATE U+2014 kind: x` header comment every new page is copied from, and
   `content/_templates/frontmatter.schema.json:68,117`, which surface in editor tooltips.
   Left last, the rule regenerates itself on every page anybody writes.
2. **The doctrine commit.** §7's four files plus rule 13, `registry/bases/base/value.tsx` and
   its four MDX sites (§5.1), and `registry/bases/base/term.tsx` with
   `content/docs/components/term.mdx` (§5.3). Five pages and two shipped `alpha` components
   have to agree, and every other edit in `content/` depends on the answer.
3. **The 796-item related-links cluster** (§4.1), as one pass, with the verb table handed to
   every worker as the rule.
4. **Frontmatter**, as one mechanical pass, checked against the 240-character budget.
5. **Prose**, by directory, disjoint file sets per worker. `health/` is partly swept already
   and is owned.
6. **Tables** (placeholders and in-cell prose as two jobs), **headings**, **diagrams**, **JSX
   props**, **delimiters**. Small, per-file, no cross-file coupling.
7. **Code comments and strings**, in published-reach order: `registry/bases/base/*.tsx`
   first (published three ways, one of which writes to a stranger's disk), then
   `lib/opsinjs.ts` and `lib/status.ts`, then the `lib/**` JSDoc summaries that reach
   published pages, then `app/_machine/**`, then everything internal.
8. **Generated sources last**, followed by one
   `pnpm --filter @opsinjs/www run generate` in a sequential phase, then `pnpm typecheck`,
   `pnpm lint` and `pnpm check`.
9. **The gate** (§8.6), last.

**A component page's `status` and its `registry/catalogue.ts` row still move together, in one
commit. A copy edit never promotes a page.** `value`, `term` and `score-dial` are `alpha`, so
CLAUDE.md requires each to still render at `/view/base/base-lyra/component/<id>` after the
JSX edits in §5. **That check belongs to the sequential phase**, run by whoever runs
`generate`, not by the parallel worker who made the edit. The parallel worker lands the edit
and says so in their summary.

---

## 10. The self-check, run on your own file before you declare done

Run all fourteen. Any failure means the file is not finished.

1. **Zero U+2014 and zero U+2013 in the file.** Search for the literal characters.
2. **No spaced hyphen ` - ` introduced**, and no U+2010, U+2011, U+2012, U+2015, U+2E3A,
   U+FE58, U+FF0D, `--` or U+00B7 introduced where a banned character used to be. §5.4 is the
   only exception, and only in the sites it names.
3. **No comma, colon, semicolon, bracket pair, slash or ellipsis standing in the dash's old
   position.** Read each AFTER aloud. **If you can hear where the dash was, the edit failed.**
4. **All seven safety invariants hold** (§1.1). Count the negations. Count the hedges. Check
   the modal. Check that no threshold acquired an owner it did not have.
5. **No comma splice**, anywhere you edited.
6. **The rotation cap holds** (§1.2): at most one fragment run, no three consecutive
   sentences on the same device, no two "rather than" clauses in one paragraph.
7. **Line-final dashes were joined before they were reframed** (R1), and **every paragraph
   and list item you touched is rewrapped to 80 columns with a two-space continuation
   indent.** `.prettierrc` sets `printWidth: 80` and no `proseWrap` key, so Prettier's default
   is `preserve` and **it will not rewrap MDX for you.**
8. **Frontmatter `description` is at or under 240 characters** and did not grow if it was
   already over.
9. **Every related-links bullet matches §4.1**: link text is the page title, the verb comes
   from the closed table or the escape hatch, one shape across both the link form and the
   bold form, full stop at the end, no colon, no dropped gloss.
10. **Every range reads "to"**, the unit is written once after the second number, and no
    hyphen joins two numbers.
11. **Frozen H2s untouched** (§4.9), and no heading acquired a dash. If you changed a
    heading, grep `.mdx#` and `](#` and confirm no anchor broke.
12. **Nothing generated was hand-edited** except the three partly-generated cases named in
    §2.3, and every source you edited is matched to its regenerate in §9.
13. **No file outside your set was touched**, and everything you noticed elsewhere is in your
    summary, together with anything you left alone under §1.1's exit clause and anything from
    §8.7's spaced-hyphen backlog.
14. **The page still reads like something a person wrote.** This is the only test that
    matters and the only one a script cannot run. A reader who knows the subject should not
    be able to tell which sentence used to have a dash in it.
