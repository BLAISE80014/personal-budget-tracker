import assert from 'node:assert/strict'
import { test } from 'node:test'
import FinanceData from '../models/FinanceData.js'
import { preferencesSchema, validate } from '../utils/validation.js'
import localizeJsx from '../../build/localize-jsx.js'
import { translate } from '../../src/translations.js'

test('preferences accept Kinyarwanda without changing other preference fields', () => {
  assert.deepEqual(validate(preferencesSchema, { language: 'Kinyarwanda' }), { language: 'Kinyarwanda' })
})

test('preferences still reject unsupported languages', () => {
  assert.throws(() => validate(preferencesSchema, { language: 'Swahili' }), { statusCode: 400 })
})

test('finance preference schema persists Kinyarwanda', () => {
  const languagePath = FinanceData.schema.path('preferences.language')
  assert.ok(languagePath.enumValues.includes('Kinyarwanda'))
})

test('JSX localization transform wraps text, expressions, and accessible labels', () => {
  const source = 'export const Sample = ({ label, task }) => <button title="Save" aria-label={`View ${task}`}>{label}</button>'
  const result = localizeJsx().transform(source, `${process.cwd().replaceAll('\\', '/')}/src/sample.jsx`)

  assert.match(result.code, /<LocalizedElement properties=\{\["title","aria-label"\]\}>/)
  assert.match(result.code, /<LocalizedText value=\{\(\) => \(label\)\}/)
  assert.equal(translate('Dashboard', 'Kinyarwanda'), 'Imbonerahamwe')
  assert.equal(translate('View report', 'Kinyarwanda'), 'Reba raporo')
  assert.equal(translate('View monthly report', 'Kinyarwanda'), 'Reba monthly report')
  assert.equal(translate('Food is already 84% used.', 'Kinyarwanda'), 'Icyiciro Food cyakoreshejweho 84%.')
  assert.match(translate('Groceries expense of $32 was added.', 'Kinyarwanda'), /Groceries.*\$32/)
  assert.equal(translate('Dashboard', 'English'), 'Dashboard')
})
