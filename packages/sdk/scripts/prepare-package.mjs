import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sdkRoot = path.resolve(process.cwd())
const distRoot = path.join(sdkRoot, 'dist')
const packageOutDir = path.join(distRoot, 'package')

await mkdir(packageOutDir, { recursive: true })
const compiledDirs = ['delta', 'rest', 'parser', 'codegen']

await cp(path.join(distRoot, 'index.js'), path.join(packageOutDir, 'index.js'))
await cp(path.join(distRoot, 'index.d.ts'), path.join(packageOutDir, 'index.d.ts'))

for (const dirName of compiledDirs) {
  await cp(path.join(distRoot, dirName), path.join(packageOutDir, dirName), {
    recursive: true
  })
}

const rootManifestPath = path.join(sdkRoot, 'package.json')
const rootManifest = JSON.parse(await readFile(rootManifestPath, 'utf8'))

const publishManifest = {
  name: rootManifest.name,
  version: rootManifest.version,
  description: rootManifest.description,
  type: 'module',
  main: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.js'
    },
    './delta': {
      types: './delta/index.d.ts',
      import: './delta/index.js'
    },
    './delta/transport': {
      types: './delta/transport.d.ts',
      import: './delta/transport.js'
    },
    './rest': {
      types: './rest/index.d.ts',
      import: './rest/index.js'
    },
    './parser': {
      types: './parser/index.d.ts',
      import: './parser/index.js'
    },
    './codegen': {
      types: './codegen/index.d.ts',
      import: './codegen/index.js'
    }
  },
  license: rootManifest.license,
  repository: rootManifest.repository,
  dependencies: rootManifest.dependencies
}

await writeFile(
  path.join(packageOutDir, 'package.json'),
  JSON.stringify(publishManifest, null, 2) + '\n',
  'utf8'
)
