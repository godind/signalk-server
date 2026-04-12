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

Logging is controlled by two environment variables:

1. `SK_SMOKE_LOG_LEVEL`
2. `SK_SMOKE_DIAGNOSTICS`

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
[INFO][log.repeat] previous line repeated count=5
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

Diagnostics mode is intentionally separate from log level.

- Log level controls which events are visible.
- Diagnostics mode controls how much extra information is attached to those visible events.

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
