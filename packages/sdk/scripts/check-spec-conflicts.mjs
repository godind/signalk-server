import { access } from 'node:fs/promises'
import path from 'node:path'

const sdkRoot = path.resolve(process.cwd())
const serverApiSrcCandidates = [
  path.resolve(sdkRoot, 'packages', 'server-api', 'src'),
  path.resolve(sdkRoot, '..', 'server-api', 'src')
]

let serverApiSrcPath
for (const candidate of serverApiSrcCandidates) {
  try {
    await access(candidate)
    serverApiSrcPath = candidate
    break
  } catch {
    // Try the next candidate.
  }
}

if (!serverApiSrcPath) {
  throw new Error(
    `Primary source path is missing. Checked: ${serverApiSrcCandidates.join(', ')}. ` +
      'SDK generation requires packages/server-api/src to be present.'
  )
}

console.log('Spec input check passed: using source code inputs, not docs snapshots.')
