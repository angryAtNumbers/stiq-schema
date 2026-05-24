# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and semver per the rules in `README.md` §Versioning.

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
