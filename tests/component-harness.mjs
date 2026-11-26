import { readFileSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import React from "react"
import ts from "typescript"

const require = createRequire(import.meta.url)

// Run handlers from the real JSX tree; a deterministic hook store supports rerenders.
export function componentHarness(file, name, overrides = {}, props = {}) {
  const slots = []
  const effects = []
  let cursor = 0
  const hooks = {
    ...React,
    useContext: (context) => context._currentValue,
    useState(initial) {
      const index = cursor++
      if (!(index in slots))
        slots[index] = typeof initial === "function" ? initial() : initial
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === "function" ? value(slots[index]) : value
        },
      ]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    useReducer(reducer, initial) {
      const [value, setValue] = hooks.useState(initial)
      return [
        value,
        (action) => setValue((previous) => reducer(previous, action)),
      ]
    },
    useMemo: (callback) => callback(),
    useCallback: (callback) => callback,
    useEffect(callback, dependencies) {
      const index = cursor++
      if (
        !(index in slots) ||
        !dependencies ||
        dependencies.some(
          (value, position) => value !== slots[index]?.dependencies?.[position]
        )
      ) {
        const previous = slots[index]
        slots[index] = { dependencies }
        effects.push(() => {
          previous?.cleanup?.()
          slots[index].cleanup = callback()
        })
      }
    },
  }
  const cache = new Map()
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative)
    const exports = {}
    cache.set(relative, exports)
    const code = ts.transpileModule(readFileSync(relative, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    function localRequire(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id]
      if (id === "react") return hooks
      if (id === "next/navigation")
        return { useRouter: () => ({ push() {} }), usePathname: () => "/" }
      if (id.startsWith("@/") || id.startsWith(".")) {
        const stem = id.startsWith("@/")
          ? id.slice(2)
          : path.posix.join(path.posix.dirname(relative), id)
        return load([`${stem}.ts`, `${stem}.tsx`].find(existsSync))
      }
      return require(id)
    }
    new Function("require", "exports", code)(localRequire, exports)
    return exports
  }
  const Component = load(file)[name]
  let tree
  function render() {
    cursor = 0
    tree = Component(props)
    return tree
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== "object") return null
    if (predicate(node)) return node
    for (const child of React.Children.toArray(node.props?.children)) {
      const result = find(predicate, child)
      if (result) return result
    }
    return null
  }
  return {
    render,
    find,
    flushEffects() {
      while (effects.length) effects.shift()()
    },
    dispose() {
      for (const slot of slots) slot?.cleanup?.()
    },
  }
}
