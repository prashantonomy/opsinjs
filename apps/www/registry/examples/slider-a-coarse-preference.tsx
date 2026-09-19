"use client"

/**
 * The case the control was built for: a coarse, non-clinical preference where
 * the exact number does not matter and the gesture of sliding towards more or
 * less is the point. Here it is a fictional notification volume from nought to a
 * hundred, with the value read out beside the label so the reader sees roughly
 * how far along the track the thumb sits.
 *
 * There is no reading and no unit here (ADR 0012). A slider must never carry a
 * measurement, so the example sets a preference nobody would mistake for their
 * own data rather than a value with clinical meaning.
 */

import { useState } from "react"

import { Slider } from "@/registry/base-lyra/ui/slider"

export default function SliderACoarsePreference() {
  const [volume, setVolume] = useState(45)
  return (
    <div className="w-full max-w-sm">
      <Slider
        label="Example notification volume"
        value={volume}
        onValueChange={setVolume}
      />
    </div>
  )
}
