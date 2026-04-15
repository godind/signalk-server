// Shared delta payload/domain types.
//
// Position source of truth is @signalk/server-api/typebox.
// SDK intentionally re-exports that type here as the canonical public import path.
// Domain-specific modules may re-export Position for convenience, but they should
// point to this module rather than creating local aliases or alternate sources.
export type {
  GeoJsonLinestringGeometry,
  GeoJsonMultiPolygonGeometry,
  GeoJsonPointGeometry,
  GeoJsonPolygonGeometry,
  IsoTimeType,
  Notification,
  Position
} from '@signalk/server-api/typebox'
