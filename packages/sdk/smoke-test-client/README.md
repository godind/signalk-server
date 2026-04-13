# SDK Smoke Client

The smoke client validates packaged `@signalk/sdk` artifacts against a real Signal K WebSocket stream.

It is intentionally wired to consume the installed SDK artifact, not local source files.

## Run Modes

From the repository root:

```bash
npm run smoke:run -w @signalk/sdk
```

From the smoke client directly:

```bash
npm --prefix ./packages/sdk/smoke-test-client run start
```

The default WebSocket target is:

```text
ws://localhost:3000/signalk/v1/stream?subscribe=*&sendMeta=all
```

Override it with:

```bash
SK_WS_URL=ws://host:3000/signalk/v1/stream?subscribe=*&sendMeta=all
```

## Logging

Smoke behavior is controlled by three environment variables:

1. `SK_SMOKE_LOG_LEVEL`
2. `SK_SMOKE_DIAGNOSTICS`
3. `SK_VALIDATION_SCOPE`

### `SK_SMOKE_LOG_LEVEL`

Supported values:

- `debug`
- `info`
- `warn`
- `error`

Behavior:

- `debug`: show all logs
- `info`: show info, success, warn, error
- `warn`: show warn and error only
- `error`: show error only

Consecutive duplicate logging activities are suppressed. An activity may contain one base log line or a grouped set of related lines such as `ERROR` + `CONTEXT` + `PAYLOAD` for the same event. When a different activity appears, the smoke client emits a summary line such as:

```text
[INFO][log] Repeat count: 5
```

Only consecutive identical activities are collapsed. If a different activity appears in between, counting resets.

Examples:

```bash
SK_SMOKE_LOG_LEVEL=debug npm run smoke:run -w @signalk/sdk
SK_SMOKE_LOG_LEVEL=warn npm run smoke:run -w @signalk/sdk
```

Backward compatibility:

- `SK_SMOKE_VERBOSE=false` still maps to `info` if `SK_SMOKE_LOG_LEVEL` is not set.

### `SK_SMOKE_DIAGNOSTICS`

Supported values:

- `off`
- `context`
- `payload`

Behavior:

- `off`: emit only the base log line
- `context`: emit targeted parser diagnostics context lines
- `payload`: do everything in `context`, plus emit targeted payload dumps for selected failure events

Examples:

```bash
SK_SMOKE_LOG_LEVEL=info SK_SMOKE_DIAGNOSTICS=off npm run smoke:run -w @signalk/sdk
SK_SMOKE_LOG_LEVEL=warn SK_SMOKE_DIAGNOSTICS=context npm run smoke:run -w @signalk/sdk
SK_SMOKE_LOG_LEVEL=error SK_SMOKE_DIAGNOSTICS=payload npm run smoke:run -w @signalk/sdk
```

## Diagnostics Policy

Diagnostics mode is combined with log level as an AND filter.

- Log level controls whether the base event is eligible to be emitted.
- Diagnostics mode controls whether context and payload companions are emitted for eligible base events.
- If the base log line is filtered out by `SK_SMOKE_LOG_LEVEL`, companion diagnostics are also suppressed.

When diagnostics are enabled, warning/error outcome events can emit grouped entries:

- base log line: `[WARN]` or `[ERROR]`
- context companion: `[CONTEXT]` when `SK_SMOKE_DIAGNOSTICS=context|payload`
- payload companion: `[PAYLOAD]` when `SK_SMOKE_DIAGNOSTICS=payload`

### `SK_VALIDATION_SCOPE`

Supported values:

- `transport`
- `payload`
- `metadata`
- `all`

Behavior:

- `transport`: transport parsing routes enabled, payload routes disabled
- `payload`: metadata + value payload routes enabled, transport parsing disabled
- `metadata`: metadata routes enabled, value payload routes disabled, transport parsing disabled
- `all`: transport + metadata + value payload routes enabled

When `SK_VALIDATION_SCOPE` is `payload` or `metadata`, non-delta JSON frames are treated as out-of-scope and logged as `non-delta-ignored` instead of transport parse errors.

Current targeted payload diagnostics:

- Failed `transport-candidate` classification emits a concise `[ERROR]` line and detailed parser validation reasons in `[CONTEXT]` diagnostics.
- Failed `transport-candidate` classification logs the full offending WebSocket payload in `[PAYLOAD]` diagnostics when `SK_SMOKE_DIAGNOSTICS=payload`.

This produces a companion entry similar to:

```text
[CONTEXT][ws.message.classified] transport parser validation details ...
[PAYLOAD][ws.message.classified] offending transport candidate ...
```

Fields include:

- `errors`: deduplicated parser validation errors from transport parsing
- `raw`: original WebSocket message text
- `jsonCandidate`: parsed JSON object that failed transport parsing

## VS Code Launch Configurations

The repository launch configuration provides:

- fixed log-level entries (`debug`, `info`, `warn`, `error`)
- a prompted launcher that asks for both:
  - log level
  - diagnostics mode

All launch entries run the smoke client after the `SDK: Prepare Smoke Client` task installs the latest packaged SDK artifact into the smoke client.
