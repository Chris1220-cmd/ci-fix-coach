const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { extractRelevantSection } = require('../src/log-fetcher');

const fixturesDir = path.join(__dirname, 'fixtures');

describe('extractRelevantSection', () => {
  it('should find ERROR line and include context before it', () => {
    const log = fs.readFileSync(path.join(fixturesDir, 'eslint-failure.log'), 'utf-8');
    const result = extractRelevantSection(log, 50);
    assert.ok(result.includes('error'), 'Should include error lines');
    assert.ok(result.includes('eslint'), 'Should include eslint context');
  });

  it('should find npm ERR in missing dependency log', () => {
    const log = fs.readFileSync(path.join(fixturesDir, 'missing-dependency.log'), 'utf-8');
    const result = extractRelevantSection(log, 50);
    assert.ok(result.includes('TS2307') || result.includes('axios'), 'Should include the actual error');
  });

  it('should find ENOENT pattern', () => {
    const log = 'line 1\nline 2\nline 3\nnpm error ENOENT: no such file\nline 5\nline 6';
    const result = extractRelevantSection(log, 10);
    assert.ok(result.includes('ENOENT'), 'Should find ENOENT pattern');
  });

  it('should fall back to last N lines when no error pattern found', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `clean output line ${i}`);
    const log = lines.join('\n');
    const result = extractRelevantSection(log, 50);
    const resultLines = result.split('\n');
    assert.ok(resultLines.length <= 50, 'Should return at most 50 lines');
    assert.ok(result.includes('line 199'), 'Should include last line');
  });

  it('should handle all fixture files without crashing', () => {
    const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.log'));
    assert.ok(files.length >= 7, 'Should have at least 7 fixture files');
    for (const file of files) {
      const log = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      const result = extractRelevantSection(log, 120);
      assert.ok(result.length > 0, `${file} should produce non-empty output`);
    }
  });
});
