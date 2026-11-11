# ADR 0031. Five interaction motions, on the springs the tokens already define

The interaction motion opsinjs ships is five motions, press, toggle, glide, unfold and arrive, each one of the jobs the motion foundation already names and each on the token already kept for that job; none of them moves a value.

## Status

**Accepted.** 2026-11-11. Builds on the motion doctrine in `apps/www/content/docs/foundations/motion.mdx`, `apps/www/content/docs/foundations/states.mdx` and rules 20 to 26 of `apps/www/content/docs/health/alerts.mdx`, and changes none of it. Requested by the owner on 2026-11-11, who asked for the five most important animations first and more later. Held by the component files under `apps/www/registry/bases/base/` that the table below names, by `apps/www/tokens/motion.json` and by the example `apps/www/registry/examples/motion-the-five-interactions.tsx`. Issue #52.

## Context

`tokens/motion.json` defines four sampled springs and gives each a job: `spring-snap` for direct manipulation, `spring-settle` for chrome that appears and disappears, `spring-calm` for a value already on screen that changes, and `spring-sheet` for large surfaces. Dialog and Sheet used `spring-sheet`. Almost nothing used the other three. Nearly every control ran a colour fade on `ease-standard` over `duration-fast`, a press was a one-pixel jump, and the result read as a wireframe that had been coloured in, which is the complaint ADR 0028 answered for colour and did not answer for motion.

Some of it was also wrong in ways a reader could see. The selected segment of a SegmentedControl swapped its card from one segment to the next, which the doctrine calls a swap. The Tabs indicator transitioned `transform` while Tailwind 4 writes its position to the individual `translate` property, so the bar's width animated and its position jumped. Menu, Select and Combobox popups appeared and vanished in a single frame. A Toast could be swiped away, but nothing followed the finger, so the gesture showed nothing until the toast had gone, and a toast docked to the top could only be swiped down across the page. The close controls on Dialog and Sheet answered hover and gave a touch nothing, which `foundations/states.mdx` carried as a `<Todo>`.

## Decision

- **Five motions, chosen by how often a reader meets them.** A press is the most frequent interaction there is, a toggle and a choice are the next, a popup opens most of the remaining chrome, and a toast is the system's only acknowledgement of an action.

| Motion | What moves | Components | Timing |
| --- | --- | --- | --- |
| Press | A capsule sinks to 0.97 and settles back | Button, a button-shaped Link, the close controls on Dialog, Sheet and Toast | `duration-instant` down, `spring-snap` up |
| Press on a surface | A linked tile sinks to 0.98 and returns with no overshoot | Card, MetricTile | `duration-instant` down, `ease-standard` over `duration-fast` up |
| Toggle | The Switch thumb squashes while held and travels, the Checkbox tick draws itself, the Radio dot grows from the centre | Switch, Checkbox, RadioGroup | `spring-snap` |
| Glide | One puck, or the tab bar, moves to the new choice | SegmentedControl, Tabs | `spring-snap` |
| Unfold | A popup grows out of its anchor from 0.96 and a 4px blur | Popover, Menu, Select, Combobox, Tooltip | `spring-settle` in, `ease-exit` over `duration-fast` out |
| Arrive | A toast rises from its edge, follows a swipe, springs back or leaves the way it was thrown | Toast | `spring-settle` in, `ease-exit` over `duration-fast` out |

- **A press is asymmetric.** CSS takes a transition's timing from the style it changes to, so the rest state carries `spring-snap` and `:active` carries `duration-instant`. That is how a press can go down on the timing `foundations/states.mdx` asks for and come back up on the spring the token's own `use` names for a pressed button settling, in a class string and without a stylesheet.
- **No spring touches a value.** A tile can hold a reading, so the surface press returns on the standard curve, because `spring-snap` and `spring-settle` overshoot and a figure drawn past its size for a frame is a figure nobody measured. Value, RangeBar and ScoreDial still never animate. No motion carries status, and nothing pulses, flashes or shakes.
- **Each component carries its own motion.** The product stylesheet does not travel with a component into a consumer's project, so the five are class strings in each file, not utilities in `app/product.css`. A file installed without the token sheet reads undeclared durations as zero and still shows every change of state, at once.
- **Reduced motion is the per-token fallback, not a kill switch.** `spring-snap` collapses to 0ms, `spring-settle` to a 100ms linear fade and the plain durations to 1ms. Travel, squash, scale and blur are pinned to rest under `motion-reduce:` or applied only under `motion-safe:`, so every change of state still happens and is still seen. A toast keeps following a swiping finger, because that movement is the reader's own.
- **`data-instant` is honoured where it serves the reader.** A popup that Escape or a second press dismisses closes at once. A popup opened from the keyboard unfolds exactly as one opened by a pointer does, although Base UI marks it instant, and a tooltip reached by focus or moved to from a neighbour appears at once.
- **A selection indicator may transition its size.** The foundation forbids transitioning `width` and `height` because it reflows the page. An absolutely positioned indicator reflows nothing, and a capsule scaled to a new width would stretch its rounded ends and its hairline, so the SegmentedControl puck and the Tabs bar are the named exception.
- **The puck is placed by measurement, not by state.** SegmentedControl measures the chosen segment in a layout effect and writes the puck's geometry onto the element, divided by the track's rendered scale so a row inside an arriving dialog is not placed small. The track carries `data-glide` once the puck is placed, and until then the chosen segment draws its own lift, so a server render and a reader without the script see the same selection.
- **A toast is thrown away from its edge.** It swipes up when docked to the top and down when docked to the bottom, and sideways towards its own corner, or either way when centred. Base UI's default was down and right wherever the toast sat.

## Consequences

- Every pressable capsule, toggle, choice, popup and toast in the catalogue moves now, and a product gets the motion by using the component, with nothing to configure.
- Inline text is left out on purpose. A Link inside a sentence and a Term keep their one-pixel press, because a word in running text should not change size.
- Colours on Button now ride the press timing, so a hover fill settles on `spring-snap` rather than fading on `ease-standard`. Its overshoot is too small to see in a colour.
- The motion foundation passes 1,100 words, which leaves little room under LEAN002 before the next addition has to move something out.
- When `feat/npm-packages` (ADR 0030) is rebased, each of these component changes has to be carried into `packages/react/src/components/`.
- Nothing here has had an accessibility review. Each motion was measured frame by frame in Chromium, with and without an emulated `prefers-reduced-motion: reduce`, and has not been tried on a phone, with a switch device, or by a reader with a vestibular disorder.

## Alternatives considered

**Five utilities in `app/product.css`.** One definition per motion, read in one place. Rejected because that stylesheet does not reach a consumer's project, so a component that installed cleanly would lose its motion without an error.

**A motion library.** `motion` is already a transitive dependency of the docs chrome, and `AGENTS.md` refuses it as a direct one, because a direct install would sit beside the copy `@fumadocs/base-ui` already brings. A component would also have to ship it to every consumer for five motions that CSS transitions draw on their own. A CSS transition also starts from wherever an interrupted motion is, which keeps every control usable while it moves.

**A value morph on `spring-calm` as one of the five.** Ruled out by `health/alerts.mdx`, which keeps Value, RangeBar and ScoreDial still, and left to a later decision that can argue it against that page.

**Ship a symmetric press.** Simpler, but either the press goes down on a 283ms spring, slower than the timing states asks for, or it comes back on the instant curve and loses the settle that tells a reader the press was let go.
