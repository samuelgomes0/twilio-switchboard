import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import ts from "typescript"

const require = createRequire(import.meta.url)

export function createLoader(overrides = {}, { cache = true } = {}) {
  const modules = new Map()
  function load(relative) {
    if (cache && modules.has(relative)) return modules.get(relative)
    const source = ts.transpileModule(readFileSync(path.resolve(relative), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText
    const exports = {}
    if (cache) modules.set(relative, exports)
    const localRequire = (id) => {
      if (id in overrides) return overrides[id]
      if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`)
      return require(id)
    }
    new Function("require", "exports", source)(localRequire, exports)
    return exports
  }
  return load
}

// These suites intentionally reload TypeScript modules, including their dependencies.
export function load(relative, overrides = {}) {
  return createLoader(overrides, { cache: false })(relative)
}
