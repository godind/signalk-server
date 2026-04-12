import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const sdkRoot = path.resolve(process.cwd())
const distPackageDir = path.join(sdkRoot, 'dist', 'package')
const distPackageManifestPath = path.join(distPackageDir, 'package.json')

await access(distPackageManifestPath)

const manifest = JSON.parse(await readFile(distPackageManifestPath, 'utf8'))

if (manifest.name !== '@signalk/sdk') {
  throw new Error('dist/package manifest name must be @signalk/sdk')
}

if (!manifest.exports || !manifest.exports['.']) {
  throw new Error('dist/package manifest must contain exports for the package root')
}
