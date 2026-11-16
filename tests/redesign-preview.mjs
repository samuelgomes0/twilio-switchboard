import fs from "node:fs"
import assert from "node:assert/strict"
import { pathToFileURL } from "node:url"

const playwrightPath =
  process.env.SWITCHBOARD_PLAYWRIGHT_PATH ?? process.argv[2]
if (!playwrightPath)
  throw new Error("Informe o caminho da instalação externa do Playwright.")
const { chromium } = await import(pathToFileURL(`${playwrightPath}/index.mjs`))
const browser = await chromium.launch({ channel: "msedge", headless: true })
const context = await browser.newContext({
  reducedMotion: "reduce",
  colorScheme: "dark",
})
const page = await context.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
// Capture an isolated browser; never load the user's saved credentials.
await context.route("**/api/**", (route) => route.abort())
await context.addInitScript(() => localStorage.setItem("theme", "dark"))
fs.mkdirSync(".next/redesign", { recursive: true })
try {
  for (const width of [1920, 1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 })
    await page.goto(
      process.env.SWITCHBOARD_TEST_URL ?? "http://127.0.0.1:3000",
      { waitUntil: "networkidle" }
    )
    await page.screenshot({
      path: `.next/redesign/directory-${width}.png`,
      fullPage: true,
    })
    const state = await page.evaluate(() => ({
      theme: document.documentElement.className,
      overflow: document.documentElement.scrollWidth > innerWidth,
      rows: document.querySelectorAll(".directory-table tbody tr").length,
    }))
    if (state.overflow || !state.theme.includes("light") || state.rows !== 13)
      throw new Error(JSON.stringify({ width, ...state }))
    console.log(JSON.stringify({ width, ...state }))
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(process.env.SWITCHBOARD_TEST_URL ?? "http://127.0.0.1:3000", {
    waitUntil: "networkidle",
  })
  await page.locator(".directory-toolbar select").selectOption("taskrouter")
  await page.waitForFunction(
    () => document.querySelectorAll(".directory-table tbody tr").length === 5
  )
  await page.locator(".directory-search input").fill("plugin")
  await page.waitForFunction(
    () => document.querySelectorAll(".directory-table tbody tr").length === 1
  )
  await page.locator(".directory-search input").fill("zzzzzz")
  await page.locator(".directory-empty").waitFor()
  await page.locator(".directory-search input").fill("")
  await page.locator(".directory-toolbar select").selectOption("")
  await page.waitForFunction(
    () => document.querySelectorAll(".directory-table tbody tr").length === 13
  )
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark")
      document.documentElement.classList.toggle("light", theme === "light")
    }, theme)
    await page.mouse.move(0, 0)
    await page.evaluate(() => document.activeElement?.blur())
    await page.waitForTimeout(50)
    const styles = await page.evaluate(() => {
      const selectors = [".command-trigger", ".directory-search input"]
      return selectors.map((selector) => {
        const style = getComputedStyle(document.querySelector(selector))
        return [
          style.backgroundColor,
          style.borderColor,
          style.borderRadius,
          style.minHeight,
          style.fontSize,
        ]
      })
    })
    assert.deepEqual(styles[0], styles[1], `${theme}: same search style`)
    for (const selector of [".command-trigger", ".directory-search input"]) {
      const field = page.locator(selector)
      await field.hover()
      await page.waitForTimeout(50)
      const hovered = await field.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
      assert.notEqual(hovered, styles[0][0], `${theme}: visible hover`)
      await page.keyboard.press("Tab")
      await field.focus()
      assert.equal(
        await field.evaluate(
          (element) => getComputedStyle(element).outlineWidth
        ),
        "2px",
        `${theme}: keyboard focus`
      )
      await field.evaluate((element) => element.blur())
      await page.mouse.move(0, 0)
    }
  }
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
  })
  const layout = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector(".shell-header"))
      .paddingLeft,
    content: getComputedStyle(document.querySelector(".shell-content"))
      .paddingLeft,
    titleLeft: document
      .querySelector(".directory-heading")
      .getBoundingClientRect().left,
    tableLeft: document
      .querySelector(".directory-table")
      .getBoundingClientRect().left,
    radius: getComputedStyle(document.querySelector(".directory-table th"))
      .borderTopLeftRadius,
  }))
  assert.equal(
    layout.header,
    layout.content,
    "Header and content gutters align"
  )
  assert.equal(
    layout.titleLeft,
    layout.tableLeft,
    "Page heading and table align"
  )
  assert.equal(layout.radius, "6px", "Rounded table header")
  await page.keyboard.press("Control+k")
  await page.getByRole("dialog").waitFor()
  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  console.log("Busca, filtro, estado vazio e atalho global aprovados")
  if (errors.length) throw new Error(errors.join("\n"))
} finally {
  await browser.close()
}
