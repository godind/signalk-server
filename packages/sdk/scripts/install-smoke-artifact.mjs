import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const sdkRoot = path.resolve(process.cwd())
const distDir = path.join(sdkRoot, 'dist')
const smokeClientDir = path.join(sdkRoot, 'smoke-test-client')

const distFiles = await readdir(distDir)
const tarballs = distFiles.filter((file) => file.endsWith('.tgz')).sort()

if (tarballs.length === 0) {
  throw new Error('No packed SDK artifact found under dist/')
}

const tarballPath = path.join(distDir, tarballs[tarballs.length - 1])

execSync('npm install --no-save ' + JSON.stringify(tarballPath), {
  cwd: smokeClientDir,
  stdio: 'inherit'
})
