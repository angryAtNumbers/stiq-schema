# stiq-design-schema

The shared design-document contract between the **stiq** editor and the **stiq-engine** stitch engine. One JSON Schema source, dual-published as a TypeScript package and a Python package, version-locked so both apps can't silently drift.

> **Status:** v1.0.0 — bootstrap (hoop + transform + satin element only).
> Subsequent minor versions add element types: v1.1 spline, v1.2 text, v1.3 shapes, v1.4 fills. See `CHANGELOG.md`.

## What this is

A small repo with three jobs:

1. **Hold the schema.** `schema/design.v1.json` (JSON Schema Draft 2020-12) is the only authoritative source for what a Stiq design document looks like on the wire.
2. **Codegen both languages.** TypeScript types via `json-schema-to-typescript`; Pydantic v2 models via `datamodel-code-generator`. Both committed to the repo so consumers don't run codegen at install time.
3. **Ship fixtures.** Reference designs both apps round-trip in their CI to prove preview = export.

## Consuming the schema

### From the frontend (`stiq`, TypeScript)

```bash
npm install stiq-design-schema
```

```ts
import type { StiqDesign, SatinElement } from 'stiq-design-schema'
import schema from 'stiq-design-schema/schema'

// Runtime validation with ajv 2020-12
import Ajv2020 from 'ajv/dist/2020.js'
const ajv = new Ajv2020({ strict: false })
const validate = ajv.compile(schema)
```

### From the engine (`stiq-engine`, Python)

When the PyPI package exists:

```bash
pip install stiq-design-schema
```

Until PyPI is claimed, pin via git tag:

```toml
# pyproject.toml
dependencies = [
  "stiq-design-schema @ git+https://github.com/angryAtNumbers/stiq-schema@v1.0.0",
]
```

```python
from stiq_design_schema import StiqDesign

doc = StiqDesign.model_validate(payload)   # raises on invalid
```

## Layout

```
stiq-schema/
├── schema/design.v1.json          ← the source of truth
├── codegen/
│   ├── ts.mjs                     ← schema → src/ts/index.ts
│   └── py.py                      ← schema → src/py/stiq_design_schema/__init__.py
├── src/
│   ├── ts/index.ts                ← generated, committed
│   └── py/stiq_design_schema/
│       └── __init__.py            ← generated, committed
├── fixtures/                      ← canonical designs both apps round-trip
│   └── satin_rotated_37deg.v1.json
├── tests/                         ← schema-internal sanity checks
│   ├── ts/
│   └── py/
├── .github/workflows/
│   ├── ci.yml                     ← codegen freshness + tests on PR
│   └── release.yml                ← tag → dual publish
├── package.json
├── pyproject.toml
├── README.md                      ← you're reading this
└── CHANGELOG.md
```

## Codegen

Generated TypeScript and Python are **committed** to this repo (modelled on `@types/node`). Reasons:

- Reviewable diffs — schema changes show their downstream effect in the same PR.
- Consumers don't need a codegen toolchain at install time.
- CI enforces freshness: every PR re-runs codegen and fails on `git diff --exit-code` against `src/`.

Regenerate locally:

```bash
npm run codegen        # both TS and Py
npm run codegen:ts     # just TS
npm run codegen:py     # just Python
```

The Python codegen needs `datamodel-code-generator` on the PATH (`pip install 'datamodel-code-generator>=0.25.6'`).

## Versioning

Two versions in play, deliberately distinct:

1. **Schema version** — the dated string inside each design document:
   ```json
   { "schemaVersion": "2026-05-25", ... }
   ```
   Stripe-style snapshot. Engines accept any date in their supported window (currently the last 12 months) and run migrators on older docs at the API boundary. **Frozen once shipped** — `schema/design.v1.json` is immutable; evolution lives in `design.v1.1.json`, `design.v1.2.json`, etc.

2. **Package version** — semver on this repo's tags:
   - **Patch** (`1.0.0` → `1.0.1`): codegen tool bump, doc-only changes.
   - **Minor** (`1.0.0` → `1.1.0`): additive — new element type, new optional field, new enum value. Old apps see new fields via Pydantic's `extra='ignore'` at internal boundaries.
   - **Major** (`1.x.y` → `2.0.0`): breaking — rename, remove, type change. Requires a migrator on the engine.

**Versioning rules — never break these:**

1. **Never add a required field without a default + migrator.**
2. **No nested `oneOf` + `discriminator`.** Keep unions flat at the top level. (Avoids `datamodel-code-generator` bugs #1769, #1832, #1910, #1921.)
3. **Don't conflate coordinate spaces.** All schema coords are world-space millimetres. Editor-px → mm conversion happens at the frontend's send boundary, not in the schema.

## Skew detection

The frontend logs at boot the schema package version it bundled with. The engine exposes a `GET /schema-version` endpoint reporting the version it linked against. At the API boundary:

- Same major + minor → proceed.
- Major.minor mismatch (frontend ahead) → engine 422s with `schema mismatch: client v1.3, server v1.2`.
- Same major, different minor (engine ahead) → engine tolerates via `extra='ignore'`.
- Different major → 422 unless an explicit migrator handles the transition.

## Adding an element type

1. Bump the minor: copy `schema/design.v1.json` → `schema/design.v1.N.json` (do NOT edit v1.0).
2. Add the element type under `$defs/`. Append it to the `Element.oneOf` array.
3. Append a fixture under `fixtures/` exercising the new element.
4. Run `npm run codegen` and verify the generated TS/Py diffs are clean and additive.
5. Bump `version` in both `package.json` and `pyproject.toml` (same number — they share a release tag).
6. Update `CHANGELOG.md`.
7. Open the PR. CI gates: codegen freshness, all fixtures validate, frozen-v1-guard skipped because we're touching v1.N not v1.
8. Tag-then-release after merge.

## PyPI setup (one-time)

PyPI account creation + name claim + trusted publishing is a 5-minute manual process. Until it's done, the `pypi` job in `release.yml` is gated by `vars.PYPI_TRUSTED == 'true'` (a repo variable you flip after configuring trusted publishing on PyPI's web UI).

Steps when ready:
1. Create a PyPI account at https://pypi.org.
2. Go to Account → Publishing → Add pending publisher.
3. Fill in: owner `angryAtNumbers`, repo `stiq-schema`, workflow `release.yml`, environment `release`.
4. Set repo variable: `gh variable set PYPI_TRUSTED --body "true"`.
5. Next tagged release publishes to PyPI automatically.

## License

MIT.
