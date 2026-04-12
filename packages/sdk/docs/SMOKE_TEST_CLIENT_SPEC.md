# Smoke Test Client Spec (Non-Publishable)

## Objective
Define a runtime verification client used during phase gates in the execution plan.

This client is a testing app only. It is never published as part of the library.

## Scope
- Validate SDK package-consumption and transport parsing behavior against a real Signal K WebSocket server.
- Provide a deterministic smoke pass/fail outcome in CI or local runs.
- Catch packaging, export-map, and runtime import regressions early.

## Non-Goals
- Not a production application.
- Not part of public API surface.
- Not included in package publish artifacts.

## Isolation and Non-Pollution Requirements
1. Keep client code isolated under `smoke-test-client/`.
2. Maintain a separate client package manifest/config for tooling isolation.
3. Do not export smoke-test-client modules from the library package `exports` map.
4. Do not include smoke-test-client in publish artifacts (`files` includes publishable output only).
5. Keep smoke-test-client scripts separate from release/publish scripts.

## Real Package Consumption Requirement
The smoke-test-client must consume the library as a real package from built output. It must not link directly to source files.

Required rules:
1. Build library output first (`dist/`).
2. Install library into smoke-test-client as a package artifact generated from built output.
3. Import using package specifiers only (`@signalk/sdk` and its subpath modules).
4. Disallow imports that point to `src/` or direct relative paths into library internals.
5. Disallow ad hoc file linking to TypeScript source for runtime validation checks.

## Artifact Consumption Flow
1. SDK build compiles TypeScript output into `dist/`.
2. Packaging script copies compiled files into `dist/package` and writes a publish-ready `package.json`.
3. `smoke:pack` runs `npm pack ./dist/package --pack-destination ./dist`.
4. `smoke:install` installs the latest tarball into `smoke-test-client/node_modules`.
5. Smoke validation compiles `smoke-test-client/src/index.ts`, connects via WebSocket, and runs verification checks.

## Baseline Runtime Behavior to Preserve
- Import `@signalk/sdk` from installed tarball artifact.
- Connect to a real server WebSocket endpoint (default `ws://127.0.0.1:3000/signalk/v1/stream?...` or `SK_WS_URL`).
- Parse received transport messages using SDK parser APIs.
- Validate delta messages with `isDelta` and `getDeltaUpdateCount`.
- Exit successfully with explicit "Smoke validation passed" output.

## Acceptance Criteria
1. Smoke-test-client runs without importing library source files directly.
2. Smoke-test-client imports `@signalk/sdk` package names/subpath modules that resolve from built/published-style outputs.
3. Smoke-test-client is excluded from publish artifacts.
4. Import from `@signalk/sdk` succeeds and core module functions are callable.
5. If behavior differs from upstream references, decision prompt workflow is followed before continuing.

## Change Control
- Changes to smoke-test-client validation responsibilities must update:
  - `SIGNALK_TYPES_SPEC.md`
  - `SIGNALK_EXECUTION_PLAN.md`
  - this file (`SMOKE_TEST_CLIENT_SPEC.md`)
- If these are not in sync, coding must pause.
