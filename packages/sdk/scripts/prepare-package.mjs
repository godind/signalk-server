import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sdkRoot = path.resolve(process.cwd())
const distRoot = path.join(sdkRoot, 'dist')
const packageOutDir = path.join(distRoot, 'package')

await mkdir(packageOutDir, { recursive: true })
const compiledDirs = ['rest', 'parser', 'codegen', 'delta']

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
      types: './delta/delta.d.ts',
      import: './delta/delta.js'
    },
    './delta/protocol': {
      types: './delta/protocol.d.ts',
      import: './delta/protocol.js'
    },
    './delta/metadata': {
      types: './delta/metadata.d.ts',
      import: './delta/metadata.js'
    },
    './delta/payload': {
      types: './delta/payload/index.d.ts',
      import: './delta/payload/index.js'
    },
    './delta/payload/notification': {
      types: './delta/payload/notification.d.ts',
      import: './delta/payload/notification.js'
    },
    './rest': {
      types: './rest/index.d.ts',
      import: './rest/index.js'
    },
    './rest/notifications': {
      types: './rest/notifications.d.ts',
      import: './rest/notifications.js'
    },
    './rest/discovery': {
      types: './rest/discovery.d.ts',
      import: './rest/discovery.js'
    },
    './rest/history': {
      types: './rest/history.d.ts',
      import: './rest/history.js'
    },
    './rest/resources': {
      types: './rest/resources.d.ts',
      import: './rest/resources.js'
    },
    './rest/course': {
      types: './rest/course.d.ts',
      import: './rest/course.js'
    },
    './rest/autopilot': {
      types: './rest/autopilot.d.ts',
      import: './rest/autopilot.js'
    },
    './rest/radar': {
      types: './rest/radar.d.ts',
      import: './rest/radar.js'
    },
    './rest/weather': {
      types: './rest/weather.d.ts',
      import: './rest/weather.js'
    },
    './parser': {
      types: './parser/facade.d.ts',
      import: './parser/facade.js'
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
