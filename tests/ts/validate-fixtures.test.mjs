/**
 * Validates every fixture under fixtures/ against the matching schema.
 *
 * Fixture filename convention pins the schema to validate against:
 *   - `*.v1.json`   → schema/design.v1.json
 *   - `*.v1.1.json` → schema/design.v1.1.json
 *   - generic `*.json` (no version suffix) → latest schema
 *
 * v1.1 is additive, so a v1.0 fixture validates against either, but we
 * keep the routing explicit so a future breaking change (v2) doesn't
 * silently pass v1 fixtures.
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const FIXTURE_DIR = resolve(ROOT, 'fixtures')

const schemaCache = new Map()
async function loadSchema(name) {
  if (!schemaCache.has(name)) {
    const text = await readFile(resolve(ROOT, 'schema', name), 'utf8')
    const ajv = new Ajv2020.default({ allErrors: true, strict: false })
    addFormats.default(ajv)
    schemaCache.set(name, ajv.compile(JSON.parse(text)))
  }
  return schemaCache.get(name)
}

function schemaForFixture(fname) {
  // .v1.1.json → design.v1.1.json. Matches before the looser .v1 case.
  if (/\.v1\.1\.json$/.test(fname)) return 'design.v1.1.json'
  if (/\.v1\.json$/.test(fname))    return 'design.v1.json'
  return 'design.v1.1.json'  // unversioned → latest
}

const fixtureFiles = (await readdir(FIXTURE_DIR)).filter(f => f.endsWith('.json'))

for (const file of fixtureFiles) {
  const schemaName = schemaForFixture(file)
  test(`fixture ${file} validates against ${schemaName}`, async () => {
    const validate = await loadSchema(schemaName)
    const data = JSON.parse(await readFile(resolve(FIXTURE_DIR, file), 'utf8'))
    const ok = validate(data)
    if (!ok) {
      const errors = validate.errors?.map(e => `  ${e.instancePath || '/'} ${e.message}`).join('\n')
      assert.fail(`fixture failed schema validation:\n${errors}`)
    }
  })
}
