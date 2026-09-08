import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSummary, SUPPORTED_LANGUAGES } from './summarize.js';

test('summary validation enforces shape, length limits and category allowlist', () => {
  const good = validateSummary({ title: 'Sporting, Şampiyonlar Ligi öncesi son antrenmanını yaptı', paragraphs: [Array(40).fill('kelime').join(' '), Array(30).fill('kelime').join(' ')], category: 'training' }, 'tr');
  assert.equal(good.kind, 'summary');
  assert.equal(good.language, 'tr');
  assert.equal(good.category, 'training');
  assert.equal(good.paragraphs.length, 2);
  const unknownCategory = validateSummary({ title: 'Başlık', paragraphs: [Array(40).fill('kelime').join(' ')], category: 'clickbait' }, 'en');
  assert.equal(unknownCategory.category, undefined);
  assert.throws(() => validateSummary({ title: '', paragraphs: ['metin'] }, 'tr'), /başlığı/);
  assert.throws(() => validateSummary({ title: 'Başlık', paragraphs: [Array(400).fill('kelime').join(' ')] }, 'tr'), /uzunluğu/);
  assert.throws(() => validateSummary({ title: 'Başlık', paragraphs: [] }, 'tr'), /uzunluğu/);
  assert.throws(() => validateSummary(null, 'tr'), /biçimi/);
  assert.ok(SUPPORTED_LANGUAGES.tr && SUPPORTED_LANGUAGES.en);
});
