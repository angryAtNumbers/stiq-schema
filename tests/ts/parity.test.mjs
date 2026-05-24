/**
 * Cross-language parity test: enumerate every property the schema
 * declares (on every $def) and verify the generated TypeScript file
 * mentions each by its exact name. The Python parity test does the
 * mirror check against src/py/.
 *
 * This is the tripwire that catches "naming convention drifted" before
 * it ships. If you add `pullCompMm` to the schema but the codegen
 * emits `pullComp` (e.g. a snake_case mapping accident), this test
 * fails loud.
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const SCHEMA = JSON.parse(await readFile(resolve(ROOT, 'schema', 'design.v1.json'), 'utf8'))

function collectProperties(node, acc = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) collectProperties(item, acc)
    return acc
  }
  if (node && typeof node === 'object') {
    if (node.properties && typeof node.properties === 'object') {
      for (const key of Object.keys(node.properties)) acc.add(key)
    }
    for (const v of Object.values(node)) collectProperties(v, acc)
  }
  return acc
}

test('every schema property name appears in the generated TS', async () => {
  const ts = await readFile(resolve(ROOT, 'src', 'ts', 'index.ts'), 'utf8')
  const props = collectProperties(SCHEMA)
  const missing = []
  for (const name of props) {
    // Property might be quoted or unquoted; match either as a word.
    const pattern = new RegExp(`(["']?)${name}(["']?)\\s*\\??\\s*:`)
    if (!pattern.test(ts)) missing.push(name)
  }
  assert.equal(missing.length, 0, `TS missing schema properties: ${missing.join(', ')}`)
})
