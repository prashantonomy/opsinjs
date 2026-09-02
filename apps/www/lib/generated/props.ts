/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    every `export interface <Pascal>Props` under registry/bases/
 * Generator: scripts/build-reference.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * <PropsTable name="StatusPillProps" /> in components/docs/tables.tsx reads this
 * map, and it is the only reader. No page writes a prop row by hand: a typed row
 * is correct on the day it is written and wrong from the next commit onwards,
 * with nothing anywhere to say so.
 *
 * The shape is fumadocs' TypeTable `type` prop - prop name to
 * { type, description, default, required } - so the entry is passed straight
 * through with no translation layer of its own to drift.
 *
 * Only the interface's OWN members are here. Props inherited through `extends`
 * are deliberately absent: opsinjs re-documents what it adds, and a table that
 * repeated forty upstream props would bury the four that are decisions.
 *
 * No timestamp. This file is behind a byte-for-byte drift gate, and a build time
 * would fail it on every run made on a different second from the commit.
 */

/** One row of a generated props table. Assignable to fumadocs' `TypeNode`. */
export interface GeneratedProp {
  /** The type exactly as the interface writes it. */
  type: string
  /** The prop's doc comment with its tags removed. Absent when it has none. */
  description?: string
  /** The value of an `@default` or `@defaultValue` tag, when there is one. */
  default?: string
  /** False when the prop is declared optional. */
  required: boolean
}

/** One interface's props, keyed by prop name, in declaration order. */
export type GeneratedPropsTable = Record<string, GeneratedProp>

/** Keyed by the exported interface name: `StatusPillProps`. */
export const PROPS_TABLES: Record<string, GeneratedPropsTable> = {
  "StatusPillProps": {
    "status": {
      type: "ClinicalStatus",
      description: "Required. There is no neutral default and no \"unknown\" level.",
      required: true,
    },
    "label": {
      type: "string",
      description: "Overrides the default word for this level — for translation, or for a product whose readers use different language. It may not change the meaning, and it may not be an empty string.",
      required: false,
    },
    "size": {
      type: "\"sm\" | \"md\"",
      description: "Visual weight only. Both sizes render icon, word and colour; neither drops the word.",
      required: false,
    },
    "describes": {
      type: "string",
      description: "What the pill applies to, for the accessible name: \"HbA1c result\". Without it a screen-reader user hears a level with no subject.",
      required: false,
    },
    "className": {
      type: "string",
      description: "Merged onto the root. The pill's own classes win where they conflict.",
      required: false,
    },
  },
}

/** Interface name to the file it is exported from, relative to apps/www. */
export const PROPS_SOURCES: Record<string, string> = {
  "StatusPillProps": "registry/bases/base/status-pill.tsx",
}

export const PROPS_META: { interfaces: number; props: number } = {
  interfaces: 1,
  props: 5,
}
