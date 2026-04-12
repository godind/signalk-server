import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type GenerateTarget = 'openapi' | 'asyncapi' | 'docs'

export interface GenerateOptions {
  outputDir?: string
}

const PRIMARY_SOURCE = 'packages/server-api/src'
const SECONDARY_SOURCE = 'https://github.com/SignalK/specification/tree/master/schemas'

function ensureOutputDir(outputDir: string): Promise<void> {
  return mkdir(outputDir, { recursive: true }).then(() => undefined)
}

export async function generateOpenApiSpec(options: GenerateOptions = {}): Promise<string> {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), 'docs/generated')
  await ensureOutputDir(outputDir)

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Signal K SDK OpenAPI Snapshot',
      version: '0.1.0',
      description: `Primary source: ${PRIMARY_SOURCE}; secondary source: ${SECONDARY_SOURCE}`
    },
    paths: {
      '/signalk/v1/api/vessels/self': {
        get: {
          summary: 'Get self vessel model snapshot',
          responses: {
            '200': {
              description: 'Signal K vessel data'
            }
          }
        }
      }
    }
  }

  const outputPath = path.join(outputDir, 'openapi.generated.json')
  await writeFile(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf8')
  return outputPath
}

export async function generateAsyncApiSpec(options: GenerateOptions = {}): Promise<string> {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), 'docs/generated')
  await ensureOutputDir(outputDir)

  const spec = {
    asyncapi: '3.0.0',
    info: {
      title: 'Signal K SDK AsyncAPI Snapshot',
      version: '0.1.0',
      description: `Primary source: ${PRIMARY_SOURCE}; secondary source: ${SECONDARY_SOURCE}`
    },
    channels: {
      'signalk/v1/stream': {
        address: 'signalk/v1/stream',
        messages: {
          deltaMessage: {
            name: 'deltaMessage',
            title: 'Signal K delta stream message'
          }
        }
      }
    }
  }

  const outputPath = path.join(outputDir, 'asyncapi.generated.json')
  await writeFile(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf8')
  return outputPath
}

export async function generateMarkdownDocs(options: GenerateOptions = {}): Promise<string> {
  const outputDir = options.outputDir ?? path.resolve(process.cwd(), 'docs/generated')
  await ensureOutputDir(outputDir)

  const content = [
    '# Signal K SDK Generated Docs',
    '',
    '## Inputs',
    '',
    `- Primary source: ${PRIMARY_SOURCE}`,
    `- Secondary source: ${SECONDARY_SOURCE}`,
    '',
    '## Modules',
    '',
    '- delta',
    '- rest',
    '- parser',
    '- codegen',
    ''
  ].join('\n')

  const outputPath = path.join(outputDir, 'sdk.generated.md')
  await writeFile(outputPath, content, 'utf8')
  return outputPath
}
