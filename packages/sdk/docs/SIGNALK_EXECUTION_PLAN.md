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

**Steps**
1. Phase 1: Transport Foundations and Protocol Contracts
Spec traceability: `SIGNALK_TYPES_SPEC.md` Scope, Design Decisions, Layer Model: Transport Layer, Parser Contract, Acceptance Criteria 1/4/5/8.
Gate A (post-analysis): confirm exact in-scope transport contracts for delta-data and protocol-control (`hello`, `subscribe`, `unsubscribe`, subscription policies/options, roles/version, ack/error shapes), explicit out-of-scope (`TCP`, full-document model), and that subscription `format` support is `delta` only; compare with upstream baseline (`signalk-server/packages/server-api/src`) and raise explicit decision prompts for any conflicts.
Implementation: define transport schema inventory and SDK module boundaries (`delta`, `parser`), parser transport scope model (`delta-data`, `protocol-control`, `all`), delta-only subscription format validation, and a bootstrap `smoke-test-client` harness for runtime verification following `SMOKE_TEST_CLIENT_SPEC.md`.
Gate B (post-implementation): review transport schema map, parser transport interfaces, smoke-test-client baseline behavior, smoke-test-client spec compliance, and test matrix before moving to payload work.

2. Phase 2A: Payload Values and `meta.type` Mapping
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Value mapping, Payload Layer, Parser Contract: Type Resolution, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm value payload families and registry strategy, including fallback behavior for unknown schema names.
Implementation: define value payload schema contracts and parser dispatch rules using `meta.type` only for path values. During this phase, replace the inline transport `RelativePositionOriginSchema.position` shape with the canonical shared Position schema to avoid duplicate definitions.
Gate B (post-implementation): approve value registry, dispatch semantics, and value-focused tests.

3. Phase 2B: Payload Metadata
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Static payloads, Payload Layer, Parser Contract: Type Resolution, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm metadata validation contract and result typing.
Implementation: define metadata payload schemas and parser metadata validation path with typed valid/invalid outcomes.
Gate B (post-implementation): approve metadata behavior and regression coverage.

4. Phase 2C: Payload Notifications
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: Static payloads, Payload Layer, Acceptance Criteria 3/4/5.
Gate A (post-analysis): confirm notification payload shape and optional field policy (state/method/message required; status/position/createdAt/id optional).
Implementation: define notification payload schemas and parser notification validation route.
Gate B (post-implementation): approve notification outcomes and compatibility tests.

5. Phase 3: API Presentation and Documentation Surface
Spec traceability: `SIGNALK_TYPES_SPEC.md` Design Decisions: API presentation, Packaging, Packaging & Distribution, Acceptance Criteria 2/6/7/8.
Gate A (post-analysis): confirm subpath module export ergonomics and naming, plus helper-surface decisions (type guards, type predicates, union narrowers, schema introspection, error narrowers).
Implementation: define exports for `@signalk/sdk` and subpath modules (`/delta`, `/rest`, `/parser`, `/codegen`), plus OpenAPI/AsyncAPI derivation surfaces.
Gate B (post-implementation): approve import UX, docs output shape, and developer helper surface.

6. Phase 4: Codegen and Drift Guardrails
Spec traceability: `SIGNALK_TYPES_SPEC.md` Generation and Artifacts, Packaging & Distribution, Acceptance Criteria 7/8/9.
Gate A (post-analysis): confirm generation inputs and drift detection policy.
Implementation: define `@signalk/sdk/codegen` outputs and guardrails (API snapshots, dependency boundary checks, tree-shaking checks, parser-registry artifact generation/update, upstream server-api comparison points when in doubt).
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
4. Phase 2A passes when: value dispatch is `meta.type` only, fallback behavior is deterministic, and parser outcomes are typed and non-throwing.
5. Phase 2B must deliver: metadata payload schemas, metadata parser route, and metadata-only validation fixtures.
6. Phase 2B passes when: metadata validation is static (no `meta.type` routing) and metadata outcomes are typed valid/invalid results.
7. Phase 2C must deliver: notification payload schemas, notification parser route, optional-field policy tests, and compatibility fixtures.
8. Phase 2C passes when: notification validation is static, required/optional field behavior matches the spec, and parser outcomes remain non-throwing.
9. Phase 3 must deliver: export map (`@signalk/sdk` subpath modules), helper-surface contract (guards/predicates/introspection/error narrowers), and docs derivation outputs.
10. Phase 3 passes when: import-resolution checks succeed, helper APIs match approved Gate A decisions, docs outputs are reproducible from schemas, smoke-test-client validates packaged artifact consumption against a real WebSocket server, and smoke-test-client remains excluded from publish artifacts.
11. Phase 4 must deliver: `@signalk/sdk/codegen` pipeline outputs, parser-registry artifact updates, drift-check report, and release-readiness report.
12. Phase 4 passes when: codegen artifacts are reproducible, drift checks are clean or explicitly approved, and all package/export contracts pass verification.

**Decisions**
- Include protocol/control support required for delta subscription flow (`hello`, `subscribe`, `unsubscribe`, policies/options, roles/version, acks/errors).
- Exclude TCP transport and full-document model support.
- SDK module strategy is canonical: `@signalk/sdk` with `delta`, `rest`, `parser`, and `codegen` subpaths.
- TypeBox remains a peer dependency; dependency surface should remain minimal.

## Current Delivery Baseline

1. Keep package scaffold under `/packages/sdk` only.
2. Keep ESM-first build with TypeScript declarations.
3. Publish artifacts from `dist/package` only.
4. Keep smoke-test-client private and consuming tarball output from `dist/package`.

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
