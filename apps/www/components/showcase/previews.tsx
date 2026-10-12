import type { ReactNode } from "react"

import type { Showcase } from "@/lib/showcases"

/**
 * Small schematics of each showcase screen for the `/showcase` grid. They are
 * drawn with the site's theme colours and the opsinjs token layer, so they
 * follow light and dark. Decorative: the card text carries the meaning, so
 * every drawing is hidden from assistive technology.
 *
 * Each drawing keeps the colour rules of the screen it stands for. The
 * medicines app carries neither colour axis, so its drawing is neutral
 * throughout. The results screen tints one title by category and states one
 * status in a pill, and the two never meet on one shape.
 */

/** A bar that stands in for a line of text. */
function Text({
  x,
  y,
  width,
  strong,
}: {
  x: number
  y: number
  width: number
  strong?: boolean
}) {
  return (
    <rect
      className={strong ? "fill-foreground/70" : "fill-muted-foreground/35"}
      x={x}
      y={y}
      width={width}
      height={4}
      rx={2}
    />
  )
}

/** A phone at a fixed size, its screen clipped to its own rounded corners. */
function Phone({
  id,
  x,
  children,
}: {
  id: string
  x: number
  children: ReactNode
}) {
  const y = 14
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={140} height={272} rx={16} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect className="fill-background" x={x} y={y} width={140} height={272} />
        {children}
      </g>
      <rect
        className="fill-none stroke-border"
        x={x + 0.5}
        y={y + 0.5}
        width={139}
        height={271}
        rx={16}
      />
    </g>
  )
}

/** The canvas behind the phones: measurement paper, as on the landing page. */
function Canvas({ id }: { id: string }) {
  return (
    <>
      <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
        <path className="fill-none stroke-border/60" d="M16 0H0V16" />
      </pattern>
      <rect className="fill-muted/40" width="480" height="300" />
      <rect fill={`url(#${id})`} width="480" height="300" />
    </>
  )
}

function MedicinesPreview() {
  const today = 100
  const sheet = 252
  return (
    <svg
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <Canvas id="showcase-grid-medicines" />

      <Phone id="showcase-clip-medicines-today" x={today}>
        <Text x={today + 12} y={30} width={64} strong />
        <Text x={today + 12} y={40} width={40} />
        {[0, 1].map((dose) => (
          <g key={dose}>
            <rect
              className="fill-card stroke-border"
              x={today + 10.5}
              y={54.5 + dose * 60}
              width={119}
              height={52}
              rx={8}
            />
            <Text x={today + 18} y={63 + dose * 60} width={52} strong />
            <Text x={today + 18} y={72 + dose * 60} width={30} />
            <rect
              className="fill-foreground/80"
              x={today + 18}
              y={84 + dose * 60}
              width={48}
              height={14}
              rx={7}
            />
            <rect
              className="fill-none stroke-border"
              x={today + 70.5}
              y={84.5 + dose * 60}
              width={50}
              height={13}
              rx={6.5}
            />
          </g>
        ))}
        <rect
          className="fill-muted stroke-border"
          x={today + 10.5}
          y={176.5}
          width={119}
          height={44}
          rx={8}
        />
        <Text x={today + 18} y={185} width={60} strong />
        <Text x={today + 18} y={195} width={96} />
        <Text x={today + 18} y={204} width={70} />
        <rect className="fill-card" x={today} y={252} width={140} height={34} />
        <path
          className="fill-none stroke-border"
          d={`M${today} 252.5H${today + 140}`}
        />
        {[0, 1, 2, 3].map((tab) => (
          <g key={tab}>
            <rect
              className={
                tab === 0 ? "fill-foreground/80" : "fill-muted-foreground/35"
              }
              x={today + 14 + tab * 32}
              y={259}
              width={12}
              height={10}
              rx={3}
            />
            <rect
              className={
                tab === 0 ? "fill-foreground/70" : "fill-muted-foreground/25"
              }
              x={today + 11 + tab * 32}
              y={273}
              width={18}
              height={3}
              rx={1.5}
            />
          </g>
        ))}
      </Phone>

      <Phone id="showcase-clip-medicines-sheet" x={sheet}>
        <Text x={sheet + 12} y={30} width={56} strong />
        <Text x={sheet + 12} y={40} width={36} />
        <rect
          className="fill-card stroke-border"
          x={sheet + 10.5}
          y={54.5}
          width={119}
          height={40}
          rx={8}
        />
        <rect className="fill-foreground/15" x={sheet} y={14} width={140} height={272} />
        <rect
          className="fill-card stroke-border"
          x={sheet + 0.5}
          y={104.5}
          width={139}
          height={200}
          rx={14}
        />
        <rect
          className="fill-muted-foreground/40"
          x={sheet + 58}
          y={111}
          width={24}
          height={3}
          rx={1.5}
        />
        <path
          className="fill-none stroke-border"
          d={`M${sheet + 22} 128.5H${sheet + 118}`}
        />
        {[0, 1, 2, 3].map((step) => (
          <circle
            key={step}
            className={
              step < 2
                ? "fill-foreground/80"
                : "fill-background stroke-muted-foreground/50"
            }
            cx={sheet + 22 + step * 32}
            cy={128.5}
            r={4}
          />
        ))}
        <Text x={sheet + 12} y={144} width={70} strong />
        {[0, 1].map((field) => (
          <g key={field}>
            <Text x={sheet + 12} y={160 + field * 34} width={36} />
            <rect
              className="fill-background stroke-border"
              x={sheet + 12.5}
              y={168.5 + field * 34}
              width={115}
              height={18}
              rx={5}
            />
          </g>
        ))}
        <rect
          className="fill-foreground/80"
          x={sheet + 12}
          y={250}
          width={116}
          height={18}
          rx={9}
        />
      </Phone>
    </svg>
  )
}

function ResultsPreview() {
  const x = 170
  return (
    <svg
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <Canvas id="showcase-grid-results" />

      <Phone id="showcase-clip-results" x={x}>
        <rect
          className="fill-foreground/70"
          x={x + 12}
          y={28}
          width={76}
          height={7}
          rx={3}
        />
        <Text x={x + 12} y={41} width={44} />

        <rect
          className="fill-card stroke-border"
          x={x + 10.5}
          y={52.5}
          width={119}
          height={106}
          rx={8}
        />
        {/* The title, tinted by category and by nothing else. */}
        <rect
          x={x + 18}
          y={62}
          width={60}
          height={5}
          rx={2.5}
          style={{ fill: "var(--opsin-category-labs-ink)" }}
        />
        {/* The one status on the screen: a pill carrying a word. */}
        <rect
          x={x + 18.5}
          y={73.5}
          width={46}
          height={13}
          rx={6.5}
          style={{
            fill: "var(--opsin-status-steady-surface)",
            stroke: "var(--opsin-status-steady-line)",
          }}
        />
        <circle
          cx={x + 26}
          cy={80}
          r={2.5}
          style={{ fill: "var(--opsin-status-steady-line)" }}
        />
        <rect
          x={x + 32}
          y={78}
          width={26}
          height={4}
          rx={2}
          style={{ fill: "var(--opsin-status-steady-ink)" }}
        />
        <rect
          className="fill-foreground/80"
          x={x + 18}
          y={96}
          width={34}
          height={13}
          rx={3}
        />
        <Text x={x + 56} y={104} width={18} />
        {/* One continuous band with no coloured zones, and a marker told apart by shape. */}
        <rect
          className="fill-muted-foreground/25"
          x={x + 18}
          y={124}
          width={104}
          height={6}
          rx={3}
        />
        <path
          className="fill-background stroke-foreground/80"
          d={`M${x + 68} 121L${x + 73} 127L${x + 68} 133L${x + 63} 127Z`}
        />
        <Text x={x + 18} y={140} width={14} />
        <Text x={x + 108} y={140} width={14} />

        <Text x={x + 12} y={170} width={48} strong />
        <Text x={x + 12} y={180} width={112} />
        <Text x={x + 12} y={188} width={96} />

        <rect
          className="fill-card stroke-border"
          x={x + 10.5}
          y={200.5}
          width={119}
          height={44}
          rx={8}
        />
        <Text x={x + 18} y={209} width={64} strong />
        <rect
          className="fill-foreground/80"
          x={x + 18}
          y={222}
          width={58}
          height={14}
          rx={7}
        />

        <Text x={x + 12} y={256} width={80} />
        <Text x={x + 12} y={264} width={60} />
        <rect
          className="fill-muted stroke-border"
          x={x + 10.5}
          y={272.5}
          width={119}
          height={20}
          rx={5}
        />
      </Phone>
    </svg>
  )
}

export const showcasePreviews: Record<Showcase["slug"], () => ReactNode> = {
  "diabetes-medicines-app": MedicinesPreview,
  "results-screen": ResultsPreview,
}
