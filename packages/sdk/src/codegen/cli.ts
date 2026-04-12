import {
  generateAsyncApiSpec,
  generateMarkdownDocs,
  generateOpenApiSpec
} from './index.js'

const target = process.argv[2]

async function run(): Promise<void> {
  if (target === 'openapi') {
    await generateOpenApiSpec()
    return
  }

  if (target === 'asyncapi') {
    await generateAsyncApiSpec()
    return
  }

  if (target === 'docs') {
    await generateMarkdownDocs()
    return
  }

  if (target === 'all') {
    await generateOpenApiSpec()
    await generateAsyncApiSpec()
    await generateMarkdownDocs()
    return
  }

  throw new Error('Usage: node dist/codegen/cli.js <openapi|asyncapi|docs|all>')
}

void run()
