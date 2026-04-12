# @signalk/sdk

Signal K SDK package for transport, parser, REST, and code generation modules.

## SDK Schema Compatibility Note

### Transport

- The SDK transport envelope schemas were reimplemented locally in SDK TypeBox to enforce schema-first ownership in this package, remove direct dependence on plain TypeScript type imports from server-api, and keep runtime validation aligned with SDK-defined contracts.
