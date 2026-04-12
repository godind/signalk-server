import { performance } from 'node:perf_hooks'
import { Value } from 'typebox/value'
import { KnownValueSchemaRegistry } from '../dist/parser/schema-type-registry.js'
import { createCompiledPayloadValidators } from '../dist/parser/payload-validators.js'

const iterations = Number(process.env.SK_BENCH_ITERS ?? 200000)
const warmupIterations = Math.max(1000, Math.floor(iterations / 20))

const validCandidates = {
  Numeric: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'navigation.speedOverGround',
    value: 6.4
  },
  Position: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'navigation.position',
    value: { latitude: 60.123, longitude: 24.456 }
  },
  Notification: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'notifications.anchor',
    value: {
      state: 'alarm',
      method: ['visual'],
      message: 'Anchor drag detected'
    }
  }
}

const invalidCandidates = {
  Numeric: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'navigation.speedOverGround',
    value: 'fast'
  },
  Position: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'navigation.position',
    value: { latitude: 200, longitude: 24.456 }
  },
  Notification: {
    context: 'vessels.self',
    $source: 'NMEA0183.COM1.GP',
    path: 'notifications.anchor',
    value: {
      state: 'alarm',
      method: ['visual'],
      message: 42
    }
  }
}

const compiledValidators = createCompiledPayloadValidators()
const schemaNames = Object.keys(KnownValueSchemaRegistry)

function runTimer(label, fn) {
  const start = performance.now()
  fn()
  const durationMs = performance.now() - start
  const opsPerSec = Math.round((iterations * schemaNames.length * 1000) / durationMs)
  return { label, durationMs, opsPerSec }
}

function warmup() {
  for (const schemaName of schemaNames) {
    const schema = KnownValueSchemaRegistry[schemaName]
    const compiled = compiledValidators[schemaName]
    const valid = validCandidates[schemaName]
    const invalid = invalidCandidates[schemaName]

    for (let i = 0; i < warmupIterations; i += 1) {
      Value.Check(schema, valid)
      compiled.Check(valid)
      Value.Check(schema, invalid)
      compiled.Check(invalid)
    }
  }
}

function benchmarkValueCheck() {
  return runTimer('Value.Check(valid)', () => {
    for (let i = 0; i < iterations; i += 1) {
      for (const schemaName of schemaNames) {
        Value.Check(KnownValueSchemaRegistry[schemaName], validCandidates[schemaName])
      }
    }
  })
}

function benchmarkCompiledCheck() {
  return runTimer('Compiled.Check(valid)', () => {
    for (let i = 0; i < iterations; i += 1) {
      for (const schemaName of schemaNames) {
        compiledValidators[schemaName].Check(validCandidates[schemaName])
      }
    }
  })
}

function benchmarkValueErrors() {
  return runTimer('Value.Check+Errors(invalid)', () => {
    for (let i = 0; i < iterations; i += 1) {
      for (const schemaName of schemaNames) {
        const schema = KnownValueSchemaRegistry[schemaName]
        const candidate = invalidCandidates[schemaName]
        if (!Value.Check(schema, candidate)) {
          ;[...Value.Errors(schema, candidate)]
        }
      }
    }
  })
}

function benchmarkCompiledErrors() {
  return runTimer('Compiled.Check+Errors(invalid)', () => {
    for (let i = 0; i < iterations; i += 1) {
      for (const schemaName of schemaNames) {
        const validator = compiledValidators[schemaName]
        const candidate = invalidCandidates[schemaName]
        if (!validator.Check(candidate)) {
          ;[...validator.Errors(candidate)]
        }
      }
    }
  })
}

function formatResult(result) {
  return `${result.label}: ${result.durationMs.toFixed(1)} ms (${result.opsPerSec} ops/sec)`
}

console.log(`[bench] payload validator benchmark`)
console.log(`[bench] schemas=${schemaNames.length}, iterations=${iterations}, warmup=${warmupIterations}`)

warmup()

const results = [
  benchmarkValueCheck(),
  benchmarkCompiledCheck(),
  benchmarkValueErrors(),
  benchmarkCompiledErrors()
]

for (const result of results) {
  console.log(`[bench] ${formatResult(result)}`)
}

const checkSpeedup = (results[0].durationMs / results[1].durationMs).toFixed(2)
const errorSpeedup = (results[2].durationMs / results[3].durationMs).toFixed(2)

console.log(`[bench] speedup check=${checkSpeedup}x errors=${errorSpeedup}x`)
