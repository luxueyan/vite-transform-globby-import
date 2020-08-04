import { join } from 'path'
import { lstatSync } from 'fs'
import glob from 'glob'
import { createResolver, Resolver } from 'vite/dist/node/resolver.js'
import { Transform } from 'vite/dist/node/transform.js'

const modulesDir: string = join(process.cwd(), '/node_modules/')

interface SharedConfig {
  root?: string
  alias?: Record<string, string>
  resolvers?: Resolver[]
}

const globbyTransfrom = function (config: SharedConfig): Transform {
  const resolver = createResolver(
    config.root || process.cwd(),
    config.resolvers || [],
    config.alias || {}
  )
  return {
    test(ctx) {
      const filePath = ctx.path.replace('\u0000', '') // why some path startsWith '\u0000'?
      return (
        !filePath.startsWith(modulesDir) &&
        /\.(vue|js|jsx|ts|tsx)$/.test(filePath) &&
        lstatSync(filePath).isFile()
      )
    },
    transform(ctx) {
      ctx.code = ctx.code.replace(
        /import\s+(\w+)\s+from\s+(['"])([^'"]+\*+[^'"]+)\2/g,
        (_, g1, g2, g3) => {
          const filePath = ctx.path.replace('\u0000', '') // why some path startsWith '\u0000'?
          const resolvedFilePath = g3.startsWith('.')
            ? resolver.resolveRelativeRequest(filePath, g3)
            : { pathname: resolver.requestToFile(g3) }
          const files = glob.sync(resolvedFilePath.pathname, { dot: true })

          let groups: string[] = []
          let replaceFiles = files.map((f, i) => {
            groups.push(g1 + i)
            return `import * as ${g1 + i} from ${g2}${resolver.fileToRequest(
              f
            )}${g2}`
          })
          return (
            replaceFiles.join('\r\n') +
            `\r\nconst ${g1} = { ${groups.join(', ')} }\r\n`
          )
        }
      )
      // console.log(ctx.code)
      return ctx
    }
  }
}
export = globbyTransfrom
