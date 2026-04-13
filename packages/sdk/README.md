# @signalk/sdk

Signal K SDK package for transport, parser, REST, and code generation modules.

## SDK Schema Compatibility Note

### Transport

- The SDK transport envelope schemas were reimplemented locally in SDK TypeBox to enforce schema-first ownership in this package, remove direct dependence on plain TypeScript type imports from server-api, and keep runtime validation aligned with SDK-defined contracts.
- subscription policy schema are locally defined in `transport` based on server-api types. Approval for promoting SDK schema ownership to server-api required.

### metadata

- Server-api zones schema requires `zones: []` but most send `zones: null` when no zones are present. Need to decide whether to allow `null` or enforce `[]` for no-zones cases.
