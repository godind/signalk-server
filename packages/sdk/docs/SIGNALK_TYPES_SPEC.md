# Signal K Types + Parser Spec (v1) — Canonical

Primary authoritative source: /packages/server-api/src
Secondary authoritative source: https://github.com/SignalK/specification/tree/master/schemas

## Scope
Build a TypeScript + TypeBox library and parser that support Signal K workflows with explicit layers:
1. **Transport layer** (`delta/data` + subscription protocol/control message shapes).
2. **Payload layer** (inner value/meta/notification object shapes).

Targets: TypeScript and JavaScript (ESM), usable in web browsers and Node.js server plugins.
Exclude the legacy full-document model. Focus on Delta stream, subscription protocol (hello/subscribe/unsubscribe/policies/roles/version), and REST APIs.
Support the Signal K delta/stream and REST API models without using standalone `v1`/`v2` package groupings.

Current implementation target is the `@signalk/sdk` package with ESM-first output and TypeScript declarations, split into internal modules: `delta`, `rest`, `parser`, and `codegen`.

## Non-Goals (Explicit)
- No legacy full-document Signal K model support.
- No TCP streaming transport support in v1 scope.
- No compatibility shims that emulate full-document behavior.
- No smoke-test-client import from SDK source paths.

## Clarifications Adopted
- Precedence order is strict: upstream ServerAPI first, then public specification schemas, then bundled public spec/plan alignment for implementation.
- Module separation is `delta`, `rest`, `parser`, and `codegen` under `@signalk/sdk`; standalone `v1`/`v2` grouping or labeling is not used.
- Subscription protocol support is limited to `format: "delta"`.
- Formal Signal K schema specification reference: `https://github.com/SignalK/specification/tree/master/schemas`.
- Primary public schema baseline is `https://github.com/SignalK/signalk-server/tree/master/packages/server-api/src`.
- If local interpretation conflicts with upstream baseline, implementation must pause and request an explicit user decision.
- After a conflict decision, `SIGNALK_TYPES_SPEC.md` and `SIGNALK_EXECUTION_PLAN.md` must both be updated before coding continues.
- Schema-first rule is mandatory: TypeBox schemas are the canonical contract source, and SDK TypeScript types are derived from those schemas.
- Source selection rule: use `@signalk/server-api/typebox` schemas when present; when only plain server-api TS types exist, create local SDK TypeBox schemas and derive SDK TS types from them.
- Planning docs and `docs/reference` snapshots are guidance only and must never be runtime or build-time schema dependencies.


## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language support | TypeScript + JavaScript (ESM primary, CommonJS compat) | Both TS and JS consumers; dependency surface minimized, with TypeBox as a peer dependency |
| Versioning | Single package `@signalk/sdk` with internal modules `delta`, `rest`, `parser`, `codegen` | Matches current monorepo implementation while preserving module separation |
| Subscription format policy | Support only `format: "delta"` in subscription protocol | Avoids implicit full-model behavior and matches current intended scope |
| Value mapping | `meta.type` only for path value payload schema selection | Declarative, explicit, transport-agnostic |
| Static payloads | Metadata and notification payloads use static schemas (not `meta.type`-mapped) | These are well-defined; no dynamic routing needed |
| Parser default | Lenient by default | Better for production resiliency; strictness configurable at init |
| Strictness scope | Strictness affects payload validation only (values/metadata/notifications), not transport schema classification | Keeps transport classification deterministic while allowing payload-noise control |
| Transport schema behavior | Deterministic; subscription format remains `delta`-only regardless of strictness mode | Avoids hidden transport behavior changes from payload tuning flags |
| Parser output | Always structured non-throwing | Never throws on data quality issues; return statuses instead |
| API presentation | Exports via `@signalk/sdk` and subpath modules (`/delta`, `/rest`, `/parser`, `/codegen`) | Read-only API surface and clear domain separation |
| Docs/codegen source | Generated from TypeBox schemas | Single source of truth; OpenAPI/AsyncAPI derived |
| IntelliSense enrichment | `@sinclair/typebox-codegen` (Option B) — schema `description` → generated JSDoc-annotated `.d.ts` | Single source of truth for IDE hover text; avoids duplicating JSDoc alongside validation schemas; requires `description` on every TypeBox property |
| Extension model | Closed for v1 | No third-party schema plugins in initial release |
| Packaging | Publish from `dist/package` in `@signalk/sdk` only | Matches current build, pack, and smoke-install flow |
| Terminology | Transport (`delta-data` + `protocol-control`) + Payload (inner domain objects) | Distinguishes container-level entities from payload objects |
| Upstream precedence | ServerAPI is primary (`signalk-server/packages/server-api/src`), specification schemas are secondary (`SignalK/specification/schemas`) | Keeps local contracts aligned to public implementation while still cross-checking formal schema intent |

## Layer Model

### 1. Transport Layer
**Purpose:** Represent delta stream transport structures and subscription protocol control messages.
**Includes:**
- `delta/data` messages: delta/update/value-entry/meta-entry containers, context/source/timestamp/path.
- `protocol/control` messages: hello, subscribe, unsubscribe, subscription options/policies, and control acknowledgements/errors.

**Does NOT include:** Detailed inner payload constraints.
**Usage:** Clients/plugins that need transport parsing/routing/session handling.

### 2. Payload Layer
**Purpose:** Represent inner domain objects and constraints.
**Includes:**
- Value payload schemas (position, numeric, MMSI, geolocation, etc.)
- Notification value payload
- Metadata value payload

**Does NOT include:** Transport envelope/protocol structure.
**Usage:** Apps processing objects independent of transport frames; codegen and docs source.

### 3. API Presentation Layer (Subpath Modules)
**Purpose:** Read-only, ergonomic API presentation over transport + payload models using exports from `@signalk/sdk` and subpath modules.
**Constraints:**
- Must keep transport-vs-payload distinction obvious.
- Must expose payload by domain sub-categories.
- Must not require a separate facade package.

**Type helpers (IntelliSense support):**
- Type guards: `isPosition()`, `isNumeric()`, `isNotification()`, etc.
- Type predicates: `(value): value is Position` for exhaustive narrowing.
- Union narrowers: predicates for `PayloadValue | null` → specific payload type.
- Schema introspection: `getSchemaForType(type: string)` returns schema metadata.
- Error narrowers: `(error): error is ValidationError` with field path access.
- JSDoc codegen: `@sinclair/typebox-codegen` reads TypeBox schema `description` fields and emits JSDoc-annotated `.d.ts` declarations; IDE hover text is derived from schemas, not maintained separately.

## Parser Contract

### 1. Initialization
```ts
type ParserConfig = {
  strictness?: 'lenient' | 'strict'  // default: lenient
   validationScope?: 'transport' | 'payload' | 'metadata' | 'all'  // default: all
  transportScope?: 'delta-data' | 'protocol-control' | 'all'  // default: all
   transportErrorMode?: 'verbose' | 'primary'  // default: primary
}

function createParser(config?: ParserConfig): Parser
```

### 2. Validation Scoping
- Allow selecting transport-only, payload-only, metadata-only, or both-layer validation.
- Allow transport sub-scoping: delta-data only, protocol-control only, or both.
- Allow only subscription `format: "delta"` in supported protocol messages.
- Transport schema behavior is deterministic and independent of parser strictness mode.

### 2A. Strictness Semantics
- `strict` mode (payload layer):
   - metadata: validate against metadata schema; invalid entries return invalid outcomes.
   - values: known `meta.type` mappings validate against typed schemas; unknown schema types are invalid; missing schema mappings remain not-validated.
   - notifications: validate against notification schema; invalid entries return invalid outcomes.
- `lenient` mode (payload layer):
   - metadata: validate against metadata schema; invalid entries return invalid outcomes.
   - values: known `meta.type` mappings validate against typed schemas; unknown schema types and missing mappings are returned as not-validated outcomes with explicit status.
   - notifications: validate against notification schema; invalid entries return invalid outcomes.
- Non-throwing behavior is preserved in both modes.

### 2B. Mode Outcome Matrix (Phase 2A)
This matrix is normative for value-entry outcomes and is used for Phase 2A Gate B approval.

| Pattern | Detection condition | Lenient mode | Strict mode | Notes |
|---|---|---|---|---|
| Known schema, valid value | `meta.type` resolves to a known schema and value passes schema check | `schemaTypeStatus=known-schema-type`, `validationStatus=valid`, `validationErrors=[]` | `schemaTypeStatus=known-schema-type`, `validationStatus=valid`, `validationErrors=[]` | Non-throwing |
| Known schema, invalid value | `meta.type` resolves to a known schema and value fails schema check | `schemaTypeStatus=known-schema-type`, `validationStatus=invalid`, `validationErrors` present | `schemaTypeStatus=known-schema-type`, `validationStatus=invalid`, `validationErrors` present | Non-throwing |
| Unknown schema type | `meta.type` exists but does not resolve to known schema | `schemaTypeStatus=unknown-schema-type`, `validationStatus=not-validated`, no `validationErrors` | `schemaTypeStatus=unknown-schema-type`, `validationStatus=invalid`, `validationErrors` present | Fixed by Phase 2A Gate B decision |
| Missing schema mapping | no usable `meta.type` mapping for path | `schemaTypeStatus=no-schema-type`, `validationStatus=not-validated`, no `validationErrors` | `schemaTypeStatus=no-schema-type`, `validationStatus=not-validated`, no `validationErrors` | Fixed by Phase 2A Gate B decision |
| Invalid path | path is empty, non-string, or otherwise invalid | `schemaTypeStatus=invalid-path`, `validationStatus=invalid`, `validationErrors` present | `schemaTypeStatus=invalid-path`, `validationStatus=invalid`, `validationErrors` present | Non-throwing |

Phase 2A Gate B completion requirements for this matrix:
1. Unknown schema type strict-mode policy is explicitly selected and recorded.
2. Missing schema mapping strict-mode policy is explicitly selected and recorded.
3. Tests in `packages/sdk/test/sdk.test.mjs` assert each row in this table for both modes.

### 3. Type Resolution
- For path values: schema resolution driven by `meta.type`.
- For metadata: static payload schema.
- For notifications: static payload schema.
- For protocol/control messages: static transport protocol schemas.

### 4. Output Semantics
- Never throw for data quality issues in default flow.
- Return structured result entries with status and error details when invalid.
- Preserve enough context to trace errors to source envelope location and payload field.

## Generation and Artifacts

From TypeBox schemas, generate:
1. **TypeScript static types** (ESM primary, CommonJS fallback).
2. **OpenAPI specification** (for API consumers).
3. **AsyncAPI specification** (for event stream consumers).
4. **Runtime validators** (compiled TypeBox validators).
5. **JSDoc-annotated TypeScript declarations** — generated by `@sinclair/typebox-codegen`; TypeBox schema `description` fields become `/** ... */` hover text in consuming IDEs. Requires `description` populated on every property across all schemas before Phase 3 Gate A.

### Schema Annotation Standard (TypeBox -> IDE Docs)

Required schema metadata:
- `description`: required on every schema object and every named property.
- `deprecated`: required for legacy fields (paired with migration guidance in `description`).
- `default`: required when a runtime default exists.
- `examples`: required when format/units/shape are non-obvious.
- Constraints: use schema keywords directly (`format`, `pattern`, `minimum`, `maximum`, `minLength`, `maxLength`, `minItems`, `maxItems`, `multipleOf`) instead of prose-only rules.

Codegen mapping policy (`@sinclair/typebox-codegen`):
- `description` -> JSDoc body
- `deprecated` -> `@deprecated`
- `default` -> `@default`
- `examples` -> `@example` (one tag per example)
- Constraint keywords -> appended JSDoc constraint notes

Acceptance expectations:
- Phase 3 Gate A includes annotation coverage verification for all schema properties in scope.
- Phase 3 Gate B includes generated `.d.ts` hover-text verification for representative payload and transport types.

Phase 3 Gate Checklist Template:

Gate A checklist:
- [ ] Every schema and named property in scope has `description`.
- [ ] Legacy fields include schema `deprecated` metadata and migration wording.
- [ ] Runtime defaults are encoded with schema `default` where applicable.
- [ ] Non-obvious fields include schema `examples`.
- [ ] Validation constraints are encoded via schema keywords (format/pattern/range/length/items).

Gate B checklist:
- [ ] `@sinclair/typebox-codegen` declarations regenerated from current schemas.
- [ ] Mapping policy is visible in output (`description`, `@deprecated`, `@default`, `@example`, constraint notes).
- [ ] IDE hover verification completed for representative transport and payload types.
- [ ] Gaps found during hover verification are fixed before Gate B approval.

Artifacts are published from `@signalk/sdk` using `dist/package`; standalone `v1`/`v2` package groupings are not used.

## Packaging & Distribution

### Current Package Layout

1. **`@signalk/sdk`**
   - Single published package containing internal modules `delta`, `rest`, `parser`, and `codegen`.
   - Publishable artifact is assembled under `dist/package`.
   - Smoke-test-client installs packed tarball from `dist/package`.

### Bundle Targets

1. **Web client bundle**
   - `@signalk/sdk` with tree-shaken imports from relevant module exports.
   - ESM only.
   - Transport and protocol schemas available; payload validators tree-shaken by default (~40KB gzipped target for transport-only paths).

2. **Server/plugin bundle**
   - Full `@signalk/sdk` module surface.
   - Both lenient + strict parser modes.
   - ESM + CommonJS exports.
   - ~120KB gzipped target.

### API Presentation (Namespace Exports)

```ts
// SDK convenience exports
import { isDelta, parseDeltaJson, SignalKRestClient } from '@signalk/sdk'

// Subpath modules
import { isDelta as isDeltaFromModule } from '@signalk/sdk/delta'
import { parseDeltaObject } from '@signalk/sdk/parser'
import { generateOpenApiSpec } from '@signalk/sdk/codegen'

// REST client
import { SignalKRestClient as RestClient } from '@signalk/sdk/rest'
```

## Acceptance Criteria

### 1. Layer Separation ✓ Required
- Transport schemas (`delta-data` + `protocol-control`) compile and validate without requiring payload schemas.
- Payload schemas compile and validate without transport schemas.
- Combined mode works with no duplicate type conflicts.

### 2. Module Separation ✓ Required
- `delta`, `rest`, `parser`, and `codegen` remain separate internal modules with dedicated exports.
- Consumers can import subpath modules from `@signalk/sdk`.

### 3. Mapping and Static Rules ✓ Required
- Path value payload validation is selected **only** via `meta.type`.
- Metadata payload validation is static (no `meta.type` dispatch).
- Notification payload validation is static (no `meta.type` dispatch).

### 4. Parser Behavior ✓ Required
- Default parser mode is lenient.
- Parser returns structured statuses for all entries (valid/invalid/unknown/no-schema).
- Parser does not throw on malformed data in normal operation.
- Strictness mode affects payload validation only (values/metadata/notifications).

### 5. Validation Scoping ✓ Required
- Config can run transport-only, payload-only, or both-layer validation.
- Config can sub-scope transport to `delta-data`, `protocol-control`, or both.
- Subscription protocol validation accepts only `format: "delta"`.
- Transport schema classification is deterministic and independent of strict/lenient payload mode.

### 6. API Presentation Behavior ✓ Required
- API presentation is provided by exports from `@signalk/sdk` and subpath modules.
- Subpath modules clearly separate transport entities from payload entities.
- Subpath modules expose payload by domain categories and REST APIs by domain.

### 7. Codegen/Docs ✓ Required
- OpenAPI and AsyncAPI are generated from TypeBox source schemas.
- Generated TS types align with runtime validators.
- JSDoc-annotated TypeScript declarations are generated via `@sinclair/typebox-codegen`; all TypeBox schema properties must carry a `description` field before Phase 3 Gate A.

### 8. Packaging & Bundle Strategy ✓ Required
- Architecture uses `@signalk/sdk` with four internal modules: `delta`, `rest`, `parser`, `codegen`.
- Web client transport-only paths are ≤50KB gzipped target with validators tree-shaken.
- Server/plugin bundle includes all schemas, validators, and helpers.
- API presentation uses exports: `@signalk/sdk`, `@signalk/sdk/delta`, `@signalk/sdk/rest`, `@signalk/sdk/parser`, `@signalk/sdk/codegen`.
- ESM-first, with CommonJS compatibility for server bundles.
- Runtime dependencies are minimized; TypeBox is required as a peer dependency.

### 9. Phase Gate Enforcement ✓ Required
- No implementation starts in a phase/subphase until Gate A is approved.
- No transition to next phase/subphase until Gate B is approved.
- Gate A must include explicit questions/clarifications and tracked assumptions.
- Unresolved clarifications block implementation start.
- Any local-vs-upstream schema conflict must be surfaced as a decision prompt and approved before implementation continues.
- After conflict approval, spec and plan documents must be updated before implementation resumes.



---

## Phase Workflow and Gates

Every phase (and subphase) follows the same gate model:
1. **Gate A — Post-analysis review (before implementation)**
   - Deliverables: scope summary, findings, assumptions, risks, approach, and explicit questions/clarifications.
   - Required decision: user approval before coding starts.
2. **Implementation**
   - Deliverables: code/schema changes in scope, tests, validation outputs, and drift notes.
3. **Gate B — Post-implementation review (before next phase)**
   - Deliverables: change summary, acceptance pass/fail table, remaining issues.
   - Required decision: user approval before proceeding.

## Milestones (Proposed)

**M1: Transport Layer + Parser Core**
- TypeBox transport schemas for `delta-data` (delta, update, value-entry, meta-entry).
- TypeBox transport protocol schemas (hello, subscribe, unsubscribe, policy/options, roles/version, control acks/errors).
- Parser runtime with transport validation and transport sub-scoping.
- Tests.

**M2A: Payload Values + Mapping**
- TypeBox value payload schemas (numeric, position, and other value payloads).
- Parser value payload validation dispatch via `meta.type`.
- Tests.

**M2B: Payload Metadata**
- TypeBox metadata payload schemas.
- Parser metadata validation path and typed results.
- Tests.

**M2C: Payload Notifications**
- TypeBox notification payload schemas (including extended optional fields).
- Parser notification validation and typed results.
- Tests.

**M3: API Presentation + Docs**
- Export surface (`@signalk/sdk`, `@signalk/sdk/delta`, `@signalk/sdk/rest`, `@signalk/sdk/parser`, `@signalk/sdk/codegen`).
- OpenAPI/AsyncAPI generation from schemas.
- JSDoc-annotated declarations generated from TypeBox `description` fields via `@sinclair/typebox-codegen`.
- Developer tooling (IDE hints, helper modules).

**M4: Codegen Pipeline + Release Guardrails**
- Generator that outputs types, validators, and docs from Signal K sources.
- v1 + v2 support where applicable.
- API snapshot checks, dependency boundary checks, and tree-shaking checks to prevent drift.
