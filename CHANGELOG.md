# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and semver per the rules in `README.md` §Versioning.

## [1.2.0] — 2026-05-24

### Added
- `schema/design.v1.2.json` — additive superset of v1.1. `SplineStrokeElement` gains a `strokeType` discriminator field (one of `running`, `bean`, `triple-run`, `satin-band`, `chain`, `track`) and an optional `stitchLengthMm` for the line-stitch variants. Default `strokeType` is `'satin-band'`, so all v1.1 documents validate against v1.2 unchanged. Closes audit B1: the five non-satin spline strokes can now go through the engine via the schema, not client-side.
- Fixture `fixtures/spline_running_horizontal.v1.2.json` exercising the new `running` stroke type.
- Codegen now reads `design.v1.2.json`; generated TS + Pydantic types are a strict superset of v1.1.

### Notes
- `widthMm` is documented as IGNORED for the line-stitch types (`running`, `bean`, `triple-run`). The schema doesn't enforce this — keeping the field required gives v1.1 docs a stable migration path.
- Engine-side execution: only `'satin-band'` was wired in v1.1's `_design_intent_spline_stroke_to_legacy_dict`. The other five are wired in this minor's matching engine release (see stiq-engine `requirements.txt` pin bump to `v1.2.0`).

## [1.1.0] — 2026-05-25

### Added
- `schema/design.v1.1.json` — additive superset of v1.0. Introduces `SplineStrokeElement`, a satin-style stroke band along a centerline (`type: "splineStroke"`, `centerline: [[xMm, yMm]…]`, `widthMm`). The engine extracts ±widthMm/2 rails from the centerline and runs them through the same `emit_satin_column` emitter used by `SatinElement`. Replaces the editor's client-side spline-stroke generator under Phase C of the satin unification. v1.0 documents continue to validate unchanged.
- Fixture `fixtures/spline_stroke_horizontal.v1.1.json` exercising the new element.
- Codegen now reads `design.v1.1.json` as the source of truth. The generated TS + Pydantic types are a strict superset of the v1.0 surface, so existing consumers stay compile-clean.

### Notes
- Per README §Versioning, edits to `design.v1.json` are blocked by CI; new element types land in `design.v1.N.json` files. v1.1 is the first such bump.
- v1.0 fixtures are routed to `design.v1.json` for validation; v1.1+ fixtures use the matching schema. The TS fixture-validator picks the schema from the filename suffix.

## [1.0.2] — 2026-05-25

### Added
- Python wheel now ships `schema/design.v1.json` and the `fixtures/` directory via hatch `force-include`. Consumers can load them via `importlib.resources.files('stiq_design_schema')` instead of needing the source tree. Mirrors what the npm package already exposes via its `exports` map.

## [1.0.1] — 2026-05-25

### Fixed
- `exports` map now explicitly lists `./package.json` and the schema file path so consumers can `import pkg from 'stiq-design-schema/package.json'` (needed by the frontend's boot-time skew check). No schema or codegen changes.

## [1.0.0] — 2026-05-25

### Added
- Initial schema (`schema/design.v1.json`): hoop + transform + satin element.
- TypeScript codegen via `json-schema-to-typescript`.
- Pydantic v2 codegen via `datamodel-code-generator`.
- Runtime validation via `ajv` (TS) and Pydantic (Py).
- Golden fixture: `fixtures/satin_rotated_37deg.v1.json`.
- CI: codegen freshness check, fixture validation, frozen-v1 guard.
- Release workflow: tag → dual-publish to npm (+ PyPI when trusted publishing is configured).

### Notes
- Naming convention: every dimension is suffixed by its unit (`Mm`, `Deg`). Matches the legacy `stitch-defaults.json` parity fixture used by `stiq` and `stiq-engine` since 2026-05-20.
- v1 only models satin. Other element types ship in v1.N minor releases:
  - v1.1: open spline (running stitch paths)
  - v1.2: design text
  - v1.3: shapes (ellipse, rect, polygon)
  - v1.4: fills (tatami, tatamiBeta, parallel, contour, eulerian)
- PyPI publishing is gated behind a one-time PyPI account + trusted-publishing setup. Until that lands, the engine consumes this package via `pip install git+https://github.com/angryAtNumbers/stiq-schema@v1.0.0`.
