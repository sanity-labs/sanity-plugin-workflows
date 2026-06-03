import {defineMigration, set} from 'sanity/migrate'

/**
 * Convert legacy hex-string `color` values on `workflow.stage` objects into the
 * namespaced `workflow.color` object shape (reuses the `@sanity/color-input`
 * field structure but under a collision-free type name).
 *
 * Before: `{ _type: 'workflow.stage', color: '#3B82F6' }`
 * After:  `{ _type: 'workflow.stage', color: { _type: 'workflow.color', hex: '#3b82f6', alpha: 1, hsl, hsv, rgb } }`
 *
 * To run:
 *   npx sanity migration run color-to-color-input
 *   (append --no-dry-run to apply changes)
 */

interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

interface HslColor {
  h: number
  s: number
  l: number
  a: number
}

interface HsvColor {
  h: number
  s: number
  v: number
  a: number
}

function hexToRgb(hex: string): null | RgbColor {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null
  }

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
    a: 1,
  }
}

function rgbToHsl({r, g, b}: RgbColor): HslColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
        break
    }

    h *= 60
  }

  return {h: Math.round(h), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100, a: 1}
}

function rgbToHsv({r, g, b}: RgbColor): HsvColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  const s = max === 0 ? 0 : delta / max
  const v = max

  if (delta !== 0) {
    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
        break
    }

    h *= 60
  }

  return {h: Math.round(h), s: Math.round(s * 100) / 100, v: Math.round(v * 100) / 100, a: 1}
}

function buildColorValue(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return null
  }

  return {
    _type: 'workflow.color',
    hex: hex.toLowerCase(),
    alpha: 1,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    rgb,
  }
}

export default defineMigration({
  migrate: {
    object(obj) {
      if (obj._type !== 'workflow.stage') {
        return undefined
      }

      const {color} = obj

      // Legacy hex string (<= v0.3.0): build the full color object.
      if (typeof color === 'string') {
        const colorValue = buildColorValue(color)
        return colorValue ? set({...obj, color: colorValue}) : undefined
      }

      // Bare `color` object from the broken v0.4.0: re-namespace to workflow.color.
      if (color && typeof color === 'object' && (color as {_type?: string})._type === 'color') {
        return set({...obj, color: {...(color as object), _type: 'workflow.color'}})
      }

      return undefined
    },
  },
  title: 'Convert workflow stage color to workflow.color object',
})
