## Signal K SDK Execution Plan (Canonical)

Build a TypeBox + TypeScript architecture under `@signalk/sdk` with internal modules `delta`, `rest`, `parser`, and `codegen`, with explicit gates so implementation only proceeds after user approval at each phase.

This file is the procedural execution plan. `SIGNALK_TYPES_SPEC.md` is the authoritative specification for architecture, contracts, acceptance criteria, and detailed decisions.

**Recommended fixes incorporated**
1. Precedence order is strict: upstream ServerAPI (`signalk-server/packages/server-api/src`) first, then public specification schemas (`SignalK/specification/schemas`), then bundled public spec/plan alignment; memory-file references are not normative.
2. Module separation uses `delta`, `rest`, `parser`, and `codegen` under `@signalk/sdk`.
3. Subscription protocol support is limited to `format: "delta"`.
4. Each phase explicitly traces back to relevant sections and acceptance criteria in `SIGNALK_TYPES_SPEC.md`.
5. `https://github.com/SignalK/signalk-server/tree/master/packages/server-api/src` is the primary public schema baseline.
6. Any local-vs-upstream conflict requires an explicit user decision prompt before implementation proceeds.
7. TypeBox-first is mandatory: schemas are the source of truth and SDK TS types must be derived from TypeBox schemas.
8. Schema source precedence for implementation: first `@signalk/server-api/typebox`; if missing there, create local SDK TypeBox schemas from plain server-api TS contracts.
9. Planning docs and `docs/reference` snapshots are non-normative guidance and must not be used as runtime/build schema inputs.

**Formal Status Tracking**
- Active checkpoint: Phase 2C implementation and Gate B review prep.
- Current recorded status: Phase 1 Gate A and Gate B approved on 2026-04-12; Phase 2A Gate A and Gate B approved on 2026-04-12; Phase 2B Gate A and Gate B approved on 2026-04-12; Phase 2C Gate A approved on 2026-04-12; Phase 2C Gate B not yet formally approved.
- Required next step: complete Phase 2C implementation evidence and review/sign off Phase 2C Gate B before starting Phase 3 or later phases.
- Rule for future work: every transition must record the approved gate and the next active checkpoint here so progress is tracked procedurally, not inferred from code state.

**Steps**
1. Phase 1: Transport Foundations and Protocol Contracts
Spec traceability: `SIGNALK_TYPES_SPEC.md` Scope, Design Decisions, Layer Model: Transport Layer, Parser Contract, Acceptance Criteria 1/4/5/8.
Gate A (post-analysis): confirm exact in-scope transport contracts for delta-data and protocol-control (`hello`, `subscribe`, `unsubscribe`, subscription policies/options, roles/version, ack/error shapes), explicit out-of-scope (`TCP`, full-document model), and that subscription `format` support is `delta` only; compare with upstream baseline (`signalk-server/packages/server-api/src`) and raise explicit decision prompts for any conflicts.
Implementation: define transport schema inventory and SDK module boundaries (`delta`, `parser`), parser transport scope model (`delta-data`, `protocol-control`, `all`), delta-only subscription format validation, and a bootstrap `smoke-test-client` harness for runtime verification following `SMOKE_TEST_CLIENT_SPEC.md`.
Gate B (post-implementation): review transport schema map, parser transport interfaces, smoke-test-client baseline behavior, smoke-test-client spec compliance, and test matrix before moving to payload work.

2. Phase 2A: Payload Values and `meta.type` Mapping
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Value mapping, Payload Layer, Parser Contract: Type Resolution, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm value payload families and registry strategy, including fallback behavior for unknown schema names.
Implementation: define value payload schema contracts and parser dispatch rules using `meta.type` only for path values. Implement strict/lenient value semantics: strict treats unknown/missing mappings as invalid, lenient returns not-validated statuses for unknown/missing mappings. During this phase, replace the inline transport `RelativePositionOriginSchema.position` shape with the canonical shared Position schema to avoid duplicate definitions.
Gate B (post-implementation): approve value registry, dispatch semantics, and value-focused tests.

3. Phase 2B: Payload Metadata
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Static payloads, Payload Layer, Parser Contract: Type Resolution, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm metadata validation contract and result typing.
Implementation: define metadata payload schemas and parser metadata validation path with typed valid/invalid outcomes. Metadata remains schema-validated in both strict and lenient modes.
Gate B (post-implementation): approve metadata behavior and regression coverage.

4. Phase 2C: Payload Notifications
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Static payloads, Payload Layer, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm notification payload shape and optional field policy (state/method/message required; status/position/createdAt/id optional).
Implementation: define notification payload schemas and parser notification validation route. Notification schema validation remains strict in both strict and lenient modes.
Gate B (post-implementation): approve notification outcomes and compatibility tests.

4A. Cross-cutting Rule: Transport Determinism
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Strictness scope and Transport schema behavior, Parser Contract: Validation Scoping.
Rule: transport schema classification is deterministic and independent of strict/lenient payload mode. Subscription protocol remains `format: "delta"` only under all strictness settings.

5. Phase 3: API Presentation and Documentation Surface
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: API presentation, Packaging, Packaging & Distribution, Acceptance Criteria 2/6/7/8.
Gate A (post-analysis): confirm subpath module export ergonomics and naming, plus helper-surface decisions (type guards, type predicates, union narrowers, schema introspection, error narrowers); confirm that all TypeBox schemas authored in Phases 1–2 carry `description` on every property and that `@sinclair/typebox-codegen` coverage is complete.
Implementation: define exports for `@signalk/sdk` and subpath modules (`/delta`, `/rest`, `/parser`, `/codegen`), plus OpenAPI/AsyncAPI derivation surfaces; run `@sinclair/typebox-codegen` build step to emit JSDoc-annotated `.d.ts` declarations from TypeBox schema `description` fields, replacing any manually maintained JSDoc.
Gate B (post-implementation): approve import UX, docs output shape, developer helper surface, and IDE hover-text coverage from generated declarations.

6. Phase 4: Codegen and Drift Guardrails
Spec traceability: `SIGNALK_TYPES_SPEC.md` Generation and Artifacts, Packaging & Distribution, Acceptance Criteria 7/8/9.
Gate A (post-analysis): confirm generation inputs and drift detection policy.
Implementation: define `@signalk/sdk/codegen` outputs and guardrails (API snapshots, dependency boundary checks, tree-shaking checks, parser-registry artifact generation/update, upstream server-api comparison points when in doubt).
Planning note: include an optional Arduino-focused codegen output that emits lightweight IntelliSense helper artifacts (for example constants/enums/header stubs) from the same TypeBox source of truth, with no new runtime validation requirements.
Tooling reminder: implement option 3 for `Path` (compile-time branded type overlay) during codegen/tooling work so runtime schema behavior remains unchanged.
Gate B (post-implementation): final release-readiness approval.

7. Gate Enforcement Rules
No implementation in any phase/subphase starts before Gate A approval.
No transition to next phase/subphase occurs before Gate B approval.
Gate A must include explicit questions/clarifications and tracked assumptions.
Unresolved clarifications block implementation start.

8. Dependency and Sequence Rules
Phase 2A depends on Phase 1 outputs.
Phase 2B and 2C depend on Phase 1 outputs and shared parser scaffolding; they are not blocked on Phase 2A value mapping completion.
Phase 3 depends on stable outputs from Phase 1 and Phase 2A/2B/2C.
Phase 4 depends on finalized package/export contracts from Phase 3.

**Specification linkage (normative)**
- Upstream ServerAPI is the primary authoritative source: `https://github.com/SignalK/signalk-server/tree/master/packages/server-api/src`.
- Public specification schemas are the secondary authoritative reference: `https://github.com/SignalK/specification/tree/master/schemas`.
- `SIGNALK_TYPES_SPEC.md` is the bundled public specification for architecture, contracts, acceptance criteria, and detailed decisions.
- `SIGNALK_EXECUTION_PLAN.md` is the execution workflow (phases, gates, dependencies, approvals).
- During implementation and reviews, if scope/behavior ambiguity appears, consult `SIGNALK_TYPES_SPEC.md` first.

- Change control rule: when upstream-vs-local differences are found, evaluate ServerAPI first, then public specification schemas; then update `SIGNALK_TYPES_SPEC.md` and `SIGNALK_EXECUTION_PLAN.md`; coding must pause until both documents are updated and approved.

**Relevant files**
- `SIGNALK_TYPES_SPEC.md` — canonical architecture/spec reference (normative).
- `SIGNALK_EXECUTION_PLAN.md` — execution plan and gate workflow (procedural).
- `SMOKE_TEST_CLIENT_SPEC.md` — smoke-test-client architecture and rules (non-publishable, dist-package consumption, and gate evidence requirements).
- `reference/src/lib/schemas/messaging/delta.ts` — copied delta schema reference snapshot for this planning bundle.
- `reference/src/lib/schemas/messaging/hello.ts` — copied hello schema reference snapshot for this planning bundle.
- `reference/src/lib/schemas/resources/resources.ts` — copied local resources schema snapshot for this planning bundle (non-authoritative).
- `reference/src/lib/parser-registry.ts` — copied parser registry reference snapshot for this planning bundle.
- `smoke-test-client/src/index.ts` — current local smoke validation entrypoint used in package-consumption checks.
- `https://github.com/godind/typebox_concept/tree/master/smoke-test-client` — portable bootstrap reference for use by other AI/tools after plan migration.

**Verification**
1. Each phase must produce a gate package: scope summary, assumptions, risks, decisions, and acceptance pass/fail status.
2. Parser validation scopes must be demonstrated at review time: transport-only, payload-only, both, plus transport sub-scope control.
3. Package/export contracts must be validated for `@signalk/sdk` and its subpath modules (`/delta`, `/rest`, `/parser`, `/codegen`).
4. Drift checks must treat ServerAPI (`https://github.com/SignalK/signalk-server/tree/master/packages/server-api/src`) as primary and public specification schemas (`https://github.com/SignalK/specification/tree/master/schemas`) as secondary; any detected difference must be logged, converted into an explicit user decision prompt, and block coding until `SIGNALK_TYPES_SPEC.md` and `SIGNALK_EXECUTION_PLAN.md` are updated.
5. Each phase review must explicitly cite the relevant sections of `SIGNALK_TYPES_SPEC.md` listed in its traceability line.

**Phase Deliverable Checklist (Approval Gate Pack)**
1. Phase 1 must deliver: transport schema map (`delta-data`, `protocol-control`), parser transport-scope contract, conflict log against upstream references, tests for transport-only validation paths, `SMOKE_TEST_CLIENT_SPEC.md`, and a bootstrap `smoke-test-client` harness.
2. Phase 1 passes when: all transport contracts validate, delta-only subscription format is enforced, smoke-test-client imports library via built package artifacts (not source-file links), smoke-test-client validates transport parsing via a real WebSocket server connection, and any upstream conflict has an approved decision record.
3. Phase 2A must deliver: value payload schema registry, `meta.type` dispatch table, unknown-schema fallback behavior, and value-path test fixtures.
4. Phase 2A passes when: value dispatch is `meta.type` only, strict mode marks unknown/missing mappings invalid, lenient mode returns not-validated statuses for unknown/missing mappings, and parser outcomes are typed and non-throwing.
5. Phase 2B must deliver: metadata payload schemas, metadata parser route, and metadata-only validation fixtures.
6. Phase 2B passes when: metadata validation is static (no `meta.type` routing), metadata outcomes are typed valid/invalid results, and strict/lenient mode does not change metadata schema enforcement.
7. Phase 2C must deliver: notification payload schemas, notification parser route, optional-field policy tests, and compatibility fixtures.
8. Phase 2C passes when: notification validation is static, required/optional field behavior matches the spec, strict/lenient mode does not change notification schema enforcement, and parser outcomes remain non-throwing.
9. Phase 3 must deliver: export map (`@signalk/sdk` subpath modules), helper-surface contract (guards/predicates/introspection/error narrowers), docs derivation outputs, and JSDoc-annotated TypeScript declarations generated from TypeBox schema `description` fields via `@sinclair/typebox-codegen`.
10. Phase 3 passes when: import-resolution checks succeed, helper APIs match approved Gate A decisions, docs outputs are reproducible from schemas, smoke-test-client validates packaged artifact consumption against a real WebSocket server, and smoke-test-client remains excluded from publish artifacts.
11. Phase 4 must deliver: `@signalk/sdk/codegen` pipeline outputs, parser-registry artifact updates, drift-check report, and release-readiness report.
12. Phase 4 passes when: codegen artifacts are reproducible, drift checks are clean or explicitly approved, and all package/export contracts pass verification.

**Decisions**
- Include protocol/control support required for delta subscription flow (`hello`, `subscribe`, `unsubscribe`, policies/options, roles/version, acks/errors).
- Exclude TCP transport and full-document model support.
- SDK module strategy is canonical: `@signalk/sdk` with `delta`, `rest`, `parser`, and `codegen` subpaths.
- TypeBox remains a peer dependency; dependency surface should remain minimal.
- IntelliSense enrichment strategy: `@sinclair/typebox-codegen` (Option B) — TypeBox schema `description` fields are the single authoritative source for IDE hover text; a build step emits JSDoc-annotated `.d.ts` declarations, eliminating the need to maintain JSDoc manually alongside validation schemas.

**Schema Authoring Standards (standing rule)**
All new TypeBox schemas authored anywhere in this project must include a `description` field on:
- The schema object itself (top-level `$id` + `description`).
- Every named property, including optional ones.
- Every `Type.Union`, `Type.Array`, and `Type.Intersect` node that is a named property.
This rule ensures that when Phase 3 `@sinclair/typebox-codegen` runs, every generated declaration carries complete JSDoc hover text. Schemas missing `description` fields on properties are considered incomplete and must be updated before Phase 3 Gate A.

**Schema Annotation Standard (TypeBox -> IDE Docs)**
Purpose: keep one schema source of truth while producing rich IDE hover text.

Required annotations for all new/updated TypeBox schemas:
- `description`: required on every schema object and every named property.
- `deprecated`: required when a field is legacy; include migration guidance in `description`.
- `default`: required when runtime behavior has a true default.
- `examples`: required when the field has non-obvious shape/format/units.
- Constraints: include explicit validation constraints in schema keywords where applicable (`format`, `pattern`, `minimum`, `maximum`, `minLength`, `maxLength`, `minItems`, `maxItems`, `multipleOf`).

Phase 3 codegen mapping policy (`@sinclair/typebox-codegen`):
- `description` -> JSDoc body
- `deprecated` -> `@deprecated`
- `default` -> `@default`
- `examples` -> `@example` (one tag per example)
- Constraint keywords -> appended JSDoc constraint notes

Gate checks:
- Phase 3 Gate A must include an annotation coverage check for all schemas introduced in Phases 1-2.
- Phase 3 Gate B must include IDE hover verification from generated `.d.ts` output.

Phase 3 Gate Checklist Template (must be completed in every review package):

Gate A checklist:
- [ ] Every schema and named property in Phase 1-2 scope has `description`.
- [ ] Legacy fields have `deprecated` metadata and migration wording.
- [ ] Runtime defaults are expressed with schema `default` where applicable.
- [ ] Non-obvious fields include `examples`.
- [ ] Constraint keywords are encoded in schema (`format`, `pattern`, ranges, lengths, items).

Gate B checklist:
- [ ] `@sinclair/typebox-codegen` output regenerated and reproducible.
- [ ] Generated declarations include mapped tags (`@deprecated`, `@default`, `@example`).
- [ ] Constraint notes are present in generated JSDoc where schema keywords exist.
- [ ] IDE hover spot-check completed for at least one transport type and one payload type.
- [ ] Any annotation gaps are tracked and fixed before gate approval.

## Current Delivery Baseline

1. Keep package scaffold under `/packages/sdk` only.
2. Keep ESM-first build with TypeScript declarations.
3. Publish artifacts from `dist/package` only.
4. Keep smoke-test-client private and consuming tarball output from `dist/package`.

## Formal Gate Review Log

### Phase 1 Gate A Review (Approved)

Date prepared: 2026-04-12
Date approved: 2026-04-12
Status: approved

Scope confirmation draft:
- In scope: `delta-data` and `protocol-control` transport handling.
- Supported protocol/control contracts currently implemented: `hello`, `subscribe`, `unsubscribe`, `ack`, `error`.
- Explicitly out of scope: TCP transport, full-document model.
- Subscription protocol support remains limited to `format: "delta"`.

Reviewed implementation evidence:
- Transport schema inventory exists under `packages/sdk/src/delta/transport.ts`.
- Parser transport scope model (`delta-data`, `protocol-control`, `all`) exists under `packages/sdk/src/parser/index.ts`.
- Smoke-test-client runtime verification harness exists under `packages/sdk/smoke-test-client`.

Conflict and decision log draft:
- Local transport behavior now validates `$source` and disregards `source` for transport identity. This is a local adaptation based on observed runtime data and explicit user direction; retain as an approved local decision unless maintainers want stricter upstream parity.
- Transport schema classification is deterministic and independent of payload strictness/leniency.
- Subscription policy behavior has been aligned with current server-api semantics for `fixed` and `instant` requests.

Approval record:
- Approved Phase 1 scope as transport-only (`delta-data` + `protocol-control`) with the recorded out-of-scope exclusions.
- Approved the local `$source`-only transport identity decision as the current Phase 1 conflict resolution.

### Phase 1 Gate B Review (Approved)

Date prepared: 2026-04-12
Date approved: 2026-04-12
Status: approved

Deliverable checklist draft:
- Transport schema map present.
- Parser transport-scope contract present.
- Transport-only validation tests present.
- `SMOKE_TEST_CLIENT_SPEC.md` and bootstrap smoke-test-client harness present.
- Packaged-artifact consumption path exercised via `smoke:install` and smoke client tarball install flow.

Pass criteria evidence draft:
- Delta-only subscription format enforcement is implemented and covered by SDK tests.
- Smoke-test-client validates transport parsing through a real WebSocket server connection.
- Recent smoke runs confirmed live transport parsing after source-handling and log-format changes.

Known follow-up before formal closure:
- Upstream conflict decision records should be explicitly linked or copied into this plan when they affect transport behavior.
- If maintainers want a stricter upstream-compatibility statement for `$source` formatting, Phase 1 should remain pending until that decision is recorded.

Approval record:
- Approved Phase 1 as complete for transport foundations.
- Remaining upstream-compatibility questions are tracked as explicit follow-up decisions and do not block progression to Phase 2A gate review.

### Phase 2A Gate A Review (Approved)

Date prepared: 2026-04-12
Date approved: 2026-04-12
Status: approved

Scope confirmation draft:
- Value payload mapping remains `meta.type`-driven for path values.
- Outcome model includes `known-schema-type`, `unknown-schema-type`, `no-schema-type`, and `invalid-path` statuses.
- Unknown and missing schema mappings are modeled as non-throwing outcomes (`not-validated`) in the current implementation.

Reviewed implementation evidence:
- Value processing and dispatch behavior is implemented under `packages/sdk/src/parser/payload-parser.ts`.
- Parser API exposes value processing and validation routes under `packages/sdk/src/parser/index.ts`.
- Value-path behavior tests exist under `packages/sdk/test/sdk.test.mjs` (known valid schema, unknown schema type, invalid known schema value, and missing mapping outcomes).

Clarifications to confirm at Gate A:
- Strict/lenient semantics for unknown/missing mappings are currently represented in plan/spec expectations; confirm whether a stricter strict-mode path (marking unknown/missing mappings as invalid) is required immediately in Phase 2A or deferred to follow-up.
- Confirm that `meta.type`-only dispatch remains the approved rule with no fallback to path heuristics.

Approval record:
- Approved Phase 2A scope and registry strategy as currently implemented (`meta.type`-only dispatch + typed non-throwing outcomes).
- Approved progression to Gate B with strict/lenient alignment captured as an explicit Gate B closure decision.

### Phase 2A Gate B Review (Approved)

Date prepared: 2026-04-12
Date approved: 2026-04-12
Status: approved

Deliverable checklist draft:
- Value payload schema registry wiring is present.
- `meta.type` dispatch table behavior is present through schema type index + lookup.
- Value-path fixtures/tests cover known valid, known invalid, unknown schema type, and no-schema outcomes.
- Parser outcomes remain typed and non-throwing for value routes.

Pass criteria evidence draft:
- `meta.type`-based known-schema validation path is exercised in SDK tests.
- Unknown schema types are returned with `unknown-schema-type` and `not-validated` status in lenient mode, and `unknown-schema-type` plus `invalid` status in strict mode.
- Missing mappings are returned with `no-schema-type` and `not-validated` status in both lenient and strict modes.
- Invalid values for known schemas return structured validation errors.

Mode outcome table for Gate B decision:

| Pattern | Detection condition | Lenient mode | Strict mode | Decision status |
|---|---|---|---|---|
| Known schema, valid value | `meta.type` resolves and value passes schema | `known-schema-type` + `valid` | `known-schema-type` + `valid` | fixed |
| Known schema, invalid value | `meta.type` resolves and value fails schema | `known-schema-type` + `invalid` | `known-schema-type` + `invalid` | fixed |
| Unknown schema type | `meta.type` exists but does not resolve | `unknown-schema-type` + `not-validated` | `unknown-schema-type` + `invalid` | fixed |
| Missing schema mapping | no usable `meta.type` mapping for path | `no-schema-type` + `not-validated` | `no-schema-type` + `not-validated` | fixed |
| Invalid path | path is empty/non-string/invalid | `invalid-path` + `invalid` | `invalid-path` + `invalid` | fixed |

Known follow-up before formal closure:
- None for the mode matrix; implementation and tests must match the fixed decisions above before Gate B approval.

Approval record:
- Approved Phase 2A as complete.
- Implementation, tests, and spec/plan text have been verified against the fixed mode-outcome table above.

### Phase 2B Gate A Review

Date prepared: 2026-04-12
Status: approved 2026-04-12

Scope confirmation draft:
- Metadata validation remains static and does not use `meta.type` routing for metadata-entry validation.
- Metadata result typing remains binary: `valid` or `invalid`.
- Strict/lenient parser mode does not change metadata schema enforcement.
- Parser-wide metadata-only mode disables value routes while leaving metadata routes active.

Reviewed implementation evidence:
- Metadata types are defined under `packages/sdk/src/parser/metadata-parser.ts`.
- Metadata processing/validation behavior is implemented in `packages/sdk/src/parser/payload-parser.ts`.
- Parser API exposes `validateMetadata()` and `processMetadata()` under `packages/sdk/src/parser/index.ts`.
- Metadata-specific regression tests exist under `packages/sdk/test/sdk.test.mjs`.

Clarifications to confirm at Gate A:
- Confirm that metadata schema validation stays identical in lenient and strict modes.
- Confirm that metadata validation failures should remain non-throwing and should not fail transport parsing.

Gate A approval questions:
- Approve Phase 2B scope as static metadata validation with typed valid/invalid outcomes?
- Approve metadata enforcement parity across lenient and strict modes?

### Phase 2B Gate B Review

Date prepared: 2026-04-12
Status: approved 2026-04-12

Deliverable checklist draft:
- Metadata payload typing is present.
- Metadata parser route is present.
- Parser-wide metadata-only mode is present.
- Metadata-only validation fixtures/tests are present.
- Invalid metadata handling is covered without breaking transport parsing.

Pass criteria evidence draft:
- Valid metadata entries return `validationStatus=valid`.
- Invalid metadata entries return `validationStatus=invalid` with structured validation errors.
- Metadata indexing of `meta.type` for later value resolution occurs only when `meta.value.type` is a usable string.
- Invalid metadata does not cause transport parse failure for otherwise valid deltas.
- Metadata-only parser mode returns metadata outcomes while value routes return empty results.

Mode policy summary for Gate B:

| Pattern | Detection condition | Lenient mode | Strict mode | Decision status |
|---|---|---|---|---|
| Valid metadata entry | metadata entry passes static metadata schema | `valid` | `valid` | fixed |
| Invalid metadata entry | metadata entry fails static metadata schema | `invalid` | `invalid` | fixed |
| Invalid metadata path | metadata path is empty/non-string/invalid | `invalid` | `invalid` | fixed |
| Invalid metadata in otherwise valid delta | delta transport is valid, metadata payload invalid | transport parse succeeds; metadata route returns `invalid` outcome | transport parse succeeds; metadata route returns `invalid` outcome | fixed |

Known follow-up before formal closure:
- None identified; Gate B can close once the current tests and implementation are accepted as sufficient evidence.

Gate B approval question:
- Approve Phase 2B as complete based on the current metadata parser behavior, result typing, and regression coverage?

### Phase 2C Gate A Review

Date prepared: 2026-04-12
Status: approved 2026-04-12

Scope confirmation draft:
- Notification validation remains static and does not use `meta.type` routing.
- Notification required/optional policy is fixed: `state`, `method`, and `message` are required; `status`, `position`, `createdAt`, and `id` are optional.
- Strict/lenient parser mode does not change notification schema enforcement.
- Notification validation failures remain non-throwing typed outcomes.

Reviewed implementation evidence baseline:
- Canonical notification schema is defined in `packages/server-api/src/typebox/protocol-schemas.ts` as `NotificationSchema`.
- Notification schema is exported through `packages/server-api/src/typebox/notifications-schemas.ts`.

Gate A approval record:
- Approved Phase 2C scope as static notification validation with fixed required/optional field policy.
- Approved strict/lenient enforcement parity and non-throwing notification outcome behavior as Phase 2C constraints.

## Conflict Decision Checkpoints

Checkpoint A location: docs/SIGNALK_TYPES_SPEC.md source precedence section.
Checkpoint B location: docs/SIGNALK_EXECUTION_PLAN.md conflict checkpoint section.
Checkpoint C location: scripts/check-spec-conflicts.mjs before generation scripts run.

Decision rule at every checkpoint:
- If conflict is found between /packages/server-api/src and SignalK/specification schemas, stop implementation and request maintainer decision.
- After decision, update SIGNALK_TYPES_SPEC.md and SIGNALK_EXECUTION_PLAN.md before resuming code changes.

**Further Considerations**
1. Approval cadence: keep one gate review meeting/message per phase to avoid async drift.
2. Upstream alignment: during each Gate A, explicitly list unresolved mismatches with ServerAPI first, then public specification schemas, and request a user decision before implementing conflicting behavior.

**Decision Prompt Template**
1. Context: what contract/path/message differs and where it was found.
2. Upstream references: ServerAPI link/path first, then public specification schema link/path, plus local impacted files.
3. Options: Option A (follow upstream as-is), Option B (local adaptation), Option C (defer/park).
4. Recommendation: preferred option with rationale.
5. Impact: parser behavior, schema compatibility, migration risk, and test impact.
6. Decision required: explicit user approval; then update `SIGNALK_TYPES_SPEC.md` and `SIGNALK_EXECUTION_PLAN.md` before implementation continues.
