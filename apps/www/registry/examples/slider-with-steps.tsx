"use client"

/**
 * A slider with an explicit `min`, `max` and `step`, so the thumb snaps to a
 * small set of stops rather than gliding continuously. A coarse step is honest
 * for a preference nobody needs to the unit: here a fictional map zoom runs from
 * one to nine in twos, so every stop is a value the reader can actually mean.
 *
 * The value read out beside the label is the snapped number, and it moves in
 * steps of two as the thumb does. There is no reading and no unit (ADR 0012):
 * the stops are a synthetic preference, not a measurement.
 */

import { useState } from "react"

import { Slider } from "@/registry/base-lyra/ui/slider"

export default function SliderWithSteps() {
  const [zoom, setZoom] = useState(5)
  return (
    <div className="w-full max-w-sm">
      <Slider
        label="Example map zoom"
        value={zoom}
        onValueChange={setZoom}
        min={1}
        max={9}
        step={2}
      />
    </div>
  )
}
