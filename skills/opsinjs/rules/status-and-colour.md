# Rule 1 - the two colour axes never mix, and status is never colour alone

This is the invariant the whole system is built around. If you break one rule in
this directory, break a different one.

## The two axes

opsinjs has two independent colour axes, and they answer different questions.

**Category** answers *what kind of measurement is this*: `sleep`, `heart`,
`activity`, `nutrition`, `mind`, `labs`. Category colour is **identity**. It
carries no verdict. A heart-rate card is not more alarming than a sleep card.
Category ramps are deliberately low-chroma so they cannot be misread as urgency,
and they are used for chart lines, small glyphs and section identity.

**Status** answers *how urgent is this*, on four ordinal levels: `steady`,
`watch`, `attention`, `urgent`. Status colour is a **verdict**. It is
high-chroma, it is scarce, and it is always accompanied by a word.

Each ramp has eleven primitive steps and four semantic roles. Use the roles:

```
--opsin-category-<name>-{surface,line,ink,accent}
--opsin-status-<level>-{surface,line,ink,accent}
```

`surface` is the tinted background. `ink` is text on it. `line` is the boundary
or the chart stroke. `accent` is the identity fill - a bar fill, a dial track, a
legend dot - and it is chosen for recognition rather than for contrast, so it
must always be bounded by `line` or labelled in `ink`. It is never the only
thing carrying the meaning.

There is a fifth status-shaped token family, `--opsin-status-unknown-*`, and it
is **not** a fifth level. It is the absence of an assertion: no reading, a stale
reading, or a reading whose reference range the product does not own. It is
nearly achromatic on purpose, so that it can never read as a mild `watch`.

## The rule

**One element takes its colour from exactly one axis.**

A tile that is both "heart" and "urgent" does not get two reds. It takes its
status from the surface, and its category from a glyph, a label or its position.
Or it takes its category from the accent and shows its status as a pill with a
word in it. Never both on the same painted area.

The failure this prevents is specific and it is not hypothetical: a red that
means "this is your heart" sitting next to a red that means "act now" trains a
reader to ignore both. Once the reader has learned that red is decorative, the
one urgent thing on the screen stops working, and it stops working silently.

```tsx
// WRONG - the surface carries the category and the border carries the status.
// Two colour systems on one box; a reader cannot tell which red is which.
<div style={{ background: "var(--opsin-category-heart-surface)",
              borderColor: "var(--opsin-status-urgent-line)" }} />

// RIGHT - the surface is the verdict, the category is a label.
<div style={{ background: "var(--opsin-status-urgent-surface)",
              color: "var(--opsin-status-urgent-ink)" }}>
  <span>Heart rate</span>
  <strong>Act now</strong>
</div>
```

## Status is never carried by colour alone

Every status has a **word**. Where the layout allows one, it also has an icon.
Colour is the third carrier, never the first.

This is not only about colour blindness, though roughly one in twelve men has
some form of it. It is also about sunlight on a phone screen, greyscale
printing, a screenshot pasted into a message, a person reading through a cracked
display, a screen reader, and anyone who has not yet learned what your palette
means - which is every reader, the first time.

```tsx
// WRONG - the only difference between "fine" and "call your doctor" is a hue.
<span className="dot" style={{ background: statusColor }} />

// RIGHT - the word is the signal; colour reinforces it.
<StatusPill status="attention">Above your usual range</StatusPill>
```

This is not a stylistic preference, and the palette has been measured. The
colour-vision audit in `lib/generated/contrast.json` records which status
accents collapse into each other under protanopia, deuteranopia, tritanopia and
grayscale, and several of them do. That is not a defect a different hue would
fix: four ordered levels cannot be made mutually distinguishable by hue alone
for every form of colour vision, because two of the four sit at nearly the same
lightness. The word and the icon are what carry the meaning; the colour is the
third carrier, and it is the one that fails first.

A quick test that catches almost every violation: **take a screenshot and
desaturate it.** If you can no longer tell which item needs attention, the
interface was never conveying that - it was hoping.

## Urgency has a budget

Status is scarce by design, because attention is. At most **one** `urgent`
surface on a screen. If two things are urgent, either one of them is not, or the
screen is trying to do two jobs and should be two screens.

The four levels are ordinal, and each has a tone as well as a colour:

| Level | Means | Tone |
| --- | --- | --- |
| `steady` | Where this reading is expected to be | Neutral. Do not congratulate. |
| `watch` | Worth noticing, nothing to do today | Calm, specific, no urgency verbs |
| `attention` | There is something to do, and it is nameable | Direct, one action, no hedging |
| `urgent` | Stop and act now | Short, plain, unambiguous, never alarming for effect |

Never invent a fifth level, never rename these, and never map them onto a
traffic-light metaphor - "green means healthy" is a clinical claim the interface
is not entitled to make.

## Motion is not a status carrier either

Urgency must never be conveyed by motion. A pulsing element says "urgent" to
someone who can see it and nothing at all to someone with reduced motion enabled,
which is exactly the population most likely to need the message. Motion may
support a transition; it may never be the reason a reader knows something is
wrong.

## Where the detail lives

- `/docs/health/two-colour-axes.md` - the rule and its reasoning
- `/docs/health/clinical-status-semantics.md` - what each level means and who assigns it
- `/docs/health/category-identity.md` - what a category colour may never carry
- `/docs/health/alarm-fatigue.md` - the escalation budget
- `/docs/accessibility/colour-independence.md` - the grayscale and CVD audit
- `/docs/content/writing-status-and-alerts.md` - the sentence pattern per level
