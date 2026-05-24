/**
 * Validates every fixture under fixtures/ against schema/design.v1.json.
 * Fails the test run if any fixture doesn't satisfy the schema.
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
const SCHEMA = JSON.parse(await readFile(resolve(ROOT, 'schema', 'design.v1.json'), 'utf8'))
const FIXTURE_DIR = resolve(ROOT, 'fixtures')

const ajv = new Ajv2020.default({ allErrors: true, strict: false })
addFormats.default(ajv)
const validate = ajv.compile(SCHEMA)

const fixtureFiles = (await readdir(FIXTURE_DIR)).filter(f => f.endsWith('.json'))

for (const file of fixtureFiles) {
  test(`fixture ${file} validates against design.v1.json`, async () => {
    const data = JSON.parse(await readFile(resolve(FIXTURE_DIR, file), 'utf8'))
    const ok = validate(data)
    if (!ok) {
      const errors = validate.errors?.map(e => `  ${e.instancePath || '/'} ${e.message}`).join('\n')
      assert.fail(`fixture failed schema validation:\n${errors}`)
    }
  })
}
