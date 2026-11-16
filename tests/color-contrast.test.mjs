import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const css = readFileSync("app/globals.css", "utf8")
const specification = readFileSync(
  "design-system-rotas-autenticadas.md",
  "utf8"
)
function tokens(selector) {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0]
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value,
    ])
  )
}
const light = tokens(":root")
function color(theme, name) {
  const value = theme[name]
  const reference = value.match(/^var\(--([\w-]+)\)$/)
  return reference ? color(theme, reference[1]) : value
}

// OKLCH → linear sRGB, using the CSS Color 4 conversion matrices.
function luminance(value) {
  const match = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/)
  assert.ok(match, `Unsupported opaque color: ${value}`)
  const [, lightness, chroma, hue] = match.map(Number)
  const radians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (channel) => Math.min(1, Math.max(0, channel))
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}
function contrast(first, second) {
  const [dark, bright] = [luminance(first), luminance(second)].sort(
    (a, b) => a - b
  )
  return (bright + 0.05) / (dark + 0.05)
}

for (const [name, theme, column] of [
  ["light", light, 1],
  ["dark", { ...light, ...tokens(".dark") }, 2],
]) {
  test(`${name}: normative OKLCH palette matches the supplied design system`, () => {
    const rows = [
      ...specification.matchAll(
        /\| `--([\w-]+)` \| `(oklch\([^`]+\))` \| `(oklch\([^`]+\))` \|/g
      ),
    ]
    assert.ok(rows.length >= 30)
    for (const [, token, ...values] of rows)
      assert.equal(theme[token], values[column - 1], token)
  })
  test(`${name}: canvas uses the background and sidebar has its own surface`, () => {
    assert.equal(color(theme, "canvas"), color(theme, "background"))
    assert.notEqual(color(theme, "sidebar"), color(theme, "background"))
  })
  test(`${name}: body, supporting copy and primary button text meet AA contrast`, () => {
    for (const [foreground, background] of [
      ["foreground", "background"],
      ["card-foreground", "card"],
      ["muted-foreground", "background"],
      ["muted-foreground", "muted"],
      ["sidebar-foreground", "sidebar"],
      ["primary-foreground", "primary"],
      ["primary-foreground", "primary-hover"],
      ["sidebar-primary-foreground", "sidebar-primary"],
    ]) {
      const ratio = contrast(color(theme, foreground), color(theme, background))
      assert.ok(
        ratio >= 4.5,
        `${foreground} on ${background}: ${ratio.toFixed(2)}:1`
      )
    }
  })
  test(`${name}: primary actions and destructive actions have distinct semantic colors`, () => {
    assert.notEqual(color(theme, "destructive"), color(theme, "primary"))
    const hue = (name) => Number(color(theme, name).match(/ ([\d.]+)\)$/)[1])
    const distance = Math.abs(hue("primary") - hue("destructive"))
    assert.ok(Math.min(distance, 360 - distance) >= 60, "primary and danger need distinct hues")
  })
}
