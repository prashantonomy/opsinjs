# ADR 0017. precision means decimal places, everywhere

One name, one meaning, taken from the measurement rather than the unit. It is never significant figures, which would make one metric change shape as it moves.

## Status

**Accepted.** 2026-09-03. Implemented in `Value` and inherited by `RangeBar`; the losing
sentence on the RangeBar page is corrected in the same commit.

## Context

Two specifications gave one prop two meanings. [Value](https://opsinjs.pensievelabs.org/components/value) says
`precision` is "decimal places". [RangeBar](https://opsinjs.pensievelabs.org/components/range-bar) said
"significant figures for display". They are not a matter of taste, because RangeBar's own
part tree nests a `RangeBar.Value` inside a `RangeBar.Tick`. A tick label and the reading
it sits under are therefore the same component, resolving both readings of the same word,
on the same bar, at the same time.

A third source settles it and neither page cited it.
[Numbers, units and precision](https://opsinjs.pensievelabs.org/health/numbers) declares itself
canonical and its rule 2 reads: *the same metric is shown to the same number of decimal
places every time*. Significant figures cannot satisfy that. A metric shown to three
significant figures is one decimal place at 99.5 and none at 100, so a reading that crosses
a power of ten changes shape while the person is watching it. That is exactly the
comparison the rule exists to protect.

## Decision

**`precision` is decimal places, in every component, and there is no second prop for
significant figures.** A component that wants significant figures does not get one: the
rule forbids the behaviour, not just the name.

**Precision is a property of the MEASUREMENT, not of the unit, and there is no default.**
A scale reads to a fixed resolution whatever is standing on it; a laboratory reports a
fixed number of places whatever the result. So the number travels with the reading, from
the product. Omitted, `Value` rounds nothing and pads nothing. It does not guess from the
float it was handed, and it does not fall back to a per-unit default.

**There is no per-unit default because a unit is not a metric.** Blood glucose and
cholesterol are both reported in mmol/L and do not share a number of decimal places, so any
default in the unit table would be wrong for one of them on every screen. `tokens/units.json`
therefore carries no precision at all, and its build gate refuses the keys `precision` and
`decimals` by name so that it cannot acquire one in a later edit that looks harmless.

**In `RangeBar`, the same precision applies to the reading and to both boundary labels**,
because a value and the bound it is being compared against are the same metric. A bar whose
tick says 5.5 against a bound that says 6 is inviting a comparison the reader cannot make.

## Consequences

- **A caller who omits `precision` sees the full expansion of a double**, and `Value` warns
  once in development when it is about to print a fraction the caller never asked for. The
  warning names the digit count and the string. It is a warning and not a default, because
  a default would be the guess this record exists to refuse.
- **`RangeBar`'s page needed a one-word edit** and got it. The rest of that specification is
  unchanged.
- **A metric whose useful precision changes with magnitude has no answer here**, and that is
  the real cost. The alternative is letting it change, which buys that case at the price of
  every metric being comparable with itself, and the canonical page has already made that
  trade.
- **Ticks on a wide range may round to the same label.** That is a legibility problem for
  the component to solve by choosing fewer ticks, not by rounding them differently from each
  other.

## Alternatives considered

**Keep both, with `precision` and `significantFigures` as separate props.** Rejected. It
makes the forbidden behaviour available under a clearer name, and the first product to use
it will do so on the one metric where it looks best. That is the metric a reader is
watching most closely.

**Let the unit table carry a default and let the metric override it.** Rejected, and it was
the tempting one because it makes the common case shorter. Two metrics in one unit do not
share a precision, so the default is wrong for at least one of them and correct-looking for
both. A default that is usually right is worse here than no default, because nobody checks
the ones that were right.

**Infer precision from the float.** Rejected outright. `7.1` and `7.10` are the same double
and mean different things about the instrument, and the difference is exactly the
information this prop carries.

## Revisiting this

Revisit if [Numbers, units and precision](https://opsinjs.pensievelabs.org/health/numbers) changes
rule 2. This record is downstream of that page and has no independent authority; if the
canonical rule moves, this moves with it.
