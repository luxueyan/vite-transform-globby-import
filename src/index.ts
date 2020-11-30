import { join } from 'path'
import { lstatSync } from 'fs'
import glob from 'glob'
import { createResolver, Resolver } from 'vite/dist/node/resolver.js'
import { Transform } from 'vite/dist/node/transform.js'

const modulesDir: string = join(process.cwd(), '/node_modules/')

interface SharedConfig {
  root?: string
  alias?: Record<string, string>
  resolvers?: Resolver[],
  nameProvider(path: string): string
}

function template(template: string) {
  return (data: { [x: string]: any }) => {
    return template.replace(/#([^#]+)#/g, (_, g1) => data[g1] || g1)
  }
}

const globbyTransfrom = function (config: SharedConfig): Transform {
  const resolver = createResolver(
    config.root || process.cwd(),
    config.resolvers || [],
    config.alias || {}
  )
  const cache = new Map()
  const getName = (filePath: string, defaultName: string) => config?.nameProvider != undefined ?  config?.nameProvider(filePath) : defaultName
  return {
    test({ path }) {
      const filePath = path.replace('\u0000', '') // why some path startsWith '\u0000'?
      try {
        return (
          !filePath.startsWith(modulesDir) &&
          /\.(vue|js|jsx|ts|tsx)$/.test(filePath) &&
          lstatSync(filePath).isFile()
        )
      } catch {
        return false
      }
    },
    transform({ code, path, isBuild }) {
      let result = cache.get(path)
      if (!result) {
        result = code.replace(
          /import\s+([\w\s{}*]+)\s+from\s+(['"])globby(\?path)?!([^'"]+)\2/g,
          (_, g1, g2, g3, g4) => {
            const filePath = path.replace('\u0000', '') // why some path startsWith '\u0000'?
            // resolve path
            const resolvedFilePath = g4.startsWith('.')
              ? resolver.resolveRelativeRequest(filePath, g4)
              : { pathname: resolver.requestToFile(g4) }
            const files = glob.sync(resolvedFilePath.pathname, { dot: true })

            let templateStr = 'import #name# from #file#' // import default
            let name = g1
            const m = g1.match(/\{\s*(\w+)(\s+as\s+(\w+))?\s*\}/) // import module
            const m2 = g1.match(/\*\s+as\s+(\w+)/) // import * as all module
            if (m) {
              templateStr = `import { ${m[1]} as #name# } from #file#`
              name = m[3] || m[1]
            } else if (m2) {
              templateStr = 'import * as #name# from #file#'
              name = m2[1]
            }
            const temRender = template(templateStr)

            const groups: Array<string>[] = []
            const replaceFiles = files.map((f, i) => {
              const fileName = getName(f, g1 + i)
              const file = g2 + resolver.fileToRequest(f) + g2
              groups.push([fileName, file])
              return temRender({ name: fileName, file })
            })

            return (
              replaceFiles.join('\n') +
              (g3
                ? '\n' + groups.map((v) => `${v[0]}._path = ${v[1]}`).join('\n')
                : '') +
              `\nconst ${name} = { ${groups.map((v) => v[0]).join(',')} }\n`
            )
          }
        )
        if (isBuild) cache.set('path', result)
      }
      return result
    }
  }
}
export = globbyTransfrom
