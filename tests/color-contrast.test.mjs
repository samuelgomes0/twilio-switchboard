import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const css = readFileSync("app/globals.css", "utf8")
function tokens(selector) {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0]
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]))
}
const light = tokens(":root")
function color(theme, name) {
  const value = theme[name]
  const reference = value.match(/^var\(--([\w-]+)\)$/)
  return reference ? color(theme, reference[1]) : value
}
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
function contrast(first, second) {
  const [dark, bright] = [luminance(first), luminance(second)].sort((a, b) => a - b)
  return (bright + 0.05) / (dark + 0.05)
}

for (const [name, theme] of [["light", light], ["dark", { ...light, ...tokens(".dark") }]]) {
  test(`${name}: interaction text meets WCAG AA contrast in default, hover and selected states`, () => {
    for (const [foreground, background] of [
      ["primary-foreground", "primary"], ["primary-foreground", "primary-hover"],
      ["destructive-foreground", "destructive"], ["destructive-foreground", "destructive-hover"],
      ["primary", "primary-soft"], ["primary", "card"], ["primary", "muted"],
      ["primary", "sidebar"],
    ]) {
      const ratio = contrast(color(theme, foreground), color(theme, background))
      assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`)
    }
  })
  test(`${name}: primary controls, destructive controls and brand share the red palette`, () => {
    assert.equal(color(theme, "brand"), color(theme, "primary"))
    assert.equal(color(theme, "destructive"), color(theme, "primary"))
    assert.equal(color(theme, "destructive-hover"), color(theme, "primary-hover"))
  })
}
