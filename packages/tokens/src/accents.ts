/* GENERATED FILE - DO NOT EDIT.
 *
 * Source:    apps/www/tokens/accent.json
 * Generator: apps/www/scripts/build-tokens.mts   (`pnpm run generate`)
 * Gate:      `pnpm check:generated` regenerates this file and fails on a diff.
 *
 * The accent themes as data, for a theme picker. Set ACCENT_THEME_ATTRIBUTE
 * and ACCENT_ATTRIBUTE on any element to theme what is inside it. The
 * colours themselves are tokens in tokens.css; nothing here is a value a
 * component should paint with.
 */

export const ACCENT_SOURCE_HASH = "f426e133e8b8"

export const ACCENT_THEME_ATTRIBUTE = "data-accent-theme"
export const ACCENT_ATTRIBUTE = "data-accent"

export interface GeneratedAccentTheme {
  id: string
  label: string
  summary: string
  isDefault: boolean
  defaultAccent: string
  floors: "standard" | "enhanced"
  prefersContrastMore: boolean
}

export interface GeneratedAccent {
  id: string
  label: string
  /** The OKLCH hue, or null for the one accent with none. */
  hue: number | null
}

export const ACCENT_THEMES: GeneratedAccentTheme[] = [
  {
    "id": "normal",
    "label": "Normal",
    "summary": "Ink for action and the accent as light. The filled action stays a near-black capsule by day and a near-white one by night, as ADR 0028 set it, and the accent marks what is selected, what has focus and what can be pressed but is drawn as words.",
    "isDefault": true,
    "defaultAccent": "cobalt",
    "floors": "standard",
    "prefersContrastMore": false
  },
  {
    "id": "vibes",
    "label": "Vibes",
    "summary": "The accent is the action, at full chroma, and it throws light. Deep accents carry a white label; volt, jade and sky are bright and carry an ink label, with an ink rim by day where the fill alone would not separate from the page. By night a deep fill takes a light rim for the same reason.",
    "isDefault": false,
    "defaultAccent": "volt",
    "floors": "standard",
    "prefersContrastMore": false
  },
  {
    "id": "stryk",
    "label": "Stryk",
    "summary": "High contrast. Pure white and pure black grounds, boundaries and edges at full ink, no shadows and no translucency, a wider focus ring, and accents deep by day and light by night so every label clears WCAG AAA. It applies whenever the reader's system asks for more contrast, whatever theme the product chose.",
    "isDefault": false,
    "defaultAccent": "graphite",
    "floors": "enhanced",
    "prefersContrastMore": true
  }
]

export const ACCENTS: GeneratedAccent[] = [
  {
    "id": "cobalt",
    "label": "Cobalt",
    "hue": 250
  },
  {
    "id": "sky",
    "label": "Sky",
    "hue": 212
  },
  {
    "id": "jade",
    "label": "Jade",
    "hue": 152
  },
  {
    "id": "volt",
    "label": "Volt",
    "hue": 122
  },
  {
    "id": "rose",
    "label": "Rose",
    "hue": 354
  },
  {
    "id": "orchid",
    "label": "Orchid",
    "hue": 326
  },
  {
    "id": "violet",
    "label": "Violet",
    "hue": 300
  },
  {
    "id": "iris",
    "label": "Iris",
    "hue": 278
  },
  {
    "id": "graphite",
    "label": "Graphite",
    "hue": null
  }
]

/** Theme id, then accent id, to the accent fill in each mode. */
export const ACCENT_SWATCHES: Record<string, Record<string, { light: string; dark: string }>> = {
  "normal": {
    "cobalt": {
      "light": "oklch(0.53 0.155 250)",
      "dark": "oklch(0.845 0.079 250)"
    },
    "sky": {
      "light": "oklch(0.55 0.096 212)",
      "dark": "oklch(0.83 0.13 212)"
    },
    "jade": {
      "light": "oklch(0.545 0.143 152)",
      "dark": "oklch(0.83 0.13 152)"
    },
    "volt": {
      "light": "oklch(0.555 0.135 122)",
      "dark": "oklch(0.84 0.13 122)"
    },
    "rose": {
      "light": "oklch(0.56 0.16 354)",
      "dark": "oklch(0.855 0.089 354)"
    },
    "orchid": {
      "light": "oklch(0.56 0.16 326)",
      "dark": "oklch(0.86 0.129 326)"
    },
    "violet": {
      "light": "oklch(0.56 0.16 300)",
      "dark": "oklch(0.85 0.086 300)"
    },
    "iris": {
      "light": "oklch(0.56 0.16 278)",
      "dark": "oklch(0.85 0.074 278)"
    },
    "graphite": {
      "light": "oklch(0.269 0.007 250)",
      "dark": "oklch(0.929 0.004 250)"
    }
  },
  "vibes": {
    "cobalt": {
      "light": "oklch(0.56 0.158 250)",
      "dark": "oklch(0.56 0.158 250)"
    },
    "sky": {
      "light": "oklch(0.85 0.129 212)",
      "dark": "oklch(0.85 0.129 212)"
    },
    "jade": {
      "light": "oklch(0.85 0.221 152)",
      "dark": "oklch(0.85 0.221 152)"
    },
    "volt": {
      "light": "oklch(0.9 0.216 122)",
      "dark": "oklch(0.9 0.216 122)"
    },
    "rose": {
      "light": "oklch(0.585 0.239 354)",
      "dark": "oklch(0.585 0.239 354)"
    },
    "orchid": {
      "light": "oklch(0.59 0.273 326)",
      "dark": "oklch(0.59 0.273 326)"
    },
    "violet": {
      "light": "oklch(0.59 0.262 300)",
      "dark": "oklch(0.59 0.262 300)"
    },
    "iris": {
      "light": "oklch(0.58 0.23 278)",
      "dark": "oklch(0.58 0.23 278)"
    },
    "graphite": {
      "light": "oklch(0.145 0.005 250)",
      "dark": "oklch(0.985 0.002 250)"
    }
  },
  "stryk": {
    "cobalt": {
      "light": "oklch(0.46 0.132 250)",
      "dark": "oklch(0.9 0.05 250)"
    },
    "sky": {
      "light": "oklch(0.45 0.079 212)",
      "dark": "oklch(0.89 0.093 212)"
    },
    "jade": {
      "light": "oklch(0.445 0.118 152)",
      "dark": "oklch(0.87 0.226 152)"
    },
    "volt": {
      "light": "oklch(0.45 0.111 122)",
      "dark": "oklch(0.885 0.212 122)"
    },
    "rose": {
      "light": "oklch(0.485 0.2 354)",
      "dark": "oklch(0.905 0.055 354)"
    },
    "orchid": {
      "light": "oklch(0.49 0.228 326)",
      "dark": "oklch(0.91 0.081 326)"
    },
    "violet": {
      "light": "oklch(0.495 0.263 300)",
      "dark": "oklch(0.905 0.054 300)"
    },
    "iris": {
      "light": "oklch(0.495 0.286 278)",
      "dark": "oklch(0.9 0.048 278)"
    },
    "graphite": {
      "light": "oklch(0 0 0)",
      "dark": "oklch(1 0 0)"
    }
  }
}

/** What a page renders when it sets no attribute. */
export const DEFAULT_ACCENT_THEME = "normal"
export const DEFAULT_ACCENT = "cobalt"
