const { describe, it } = require('node:test');
const assert = require('node:assert');
const { enforceFormat, validateFormat } = require('../src/post-processor');

describe('enforceFormat', () => {
  it('should strip preamble before A.', () => {
    const input = `Here is my analysis:\n\nA. The build failed.\nB. Missing dependency.\nC. What you do now:\n1) Install it.\nD. Local check:\nnpm install\nE. File/change:\npackage.json`;
    const result = enforceFormat(input);
    assert.ok(result.startsWith('A.'), 'Should start with A.');
  });

  it('should add numbered steps to section C when missing', () => {
    const input = `A. Test failed.\nB. Missing module.\nC. What you do now:\nInstall the dependency.\nRun the build.\nCommit changes.\nD. Local check:\nnpm install\nE. File/change:\npackage.json`;
    const result = enforceFormat(input);
    assert.ok(result.includes('1) Install the dependency.'), 'Should have step 1)');
    assert.ok(result.includes('2) Run the build.'), 'Should have step 2)');
    assert.ok(result.includes('3) Commit changes.'), 'Should have step 3)');
  });

  it('should renumber inconsistent step numbers', () => {
    const input = `A. Build failed.\nB. Type error.\nC. What you do now:\n- Fix the type.\n- Run tsc.\n- Commit.\nD. Local check:\nnpx tsc\nE. File/change:\nUserCard.tsx`;
    const result = enforceFormat(input);
    assert.ok(result.includes('1) Fix the type.'), 'Should renumber bullet to 1)');
    assert.ok(result.includes('2) Run tsc.'), 'Should renumber bullet to 2)');
  });

  it('should strip markdown formatting', () => {
    const input = `A. The **build** failed.\nB. Missing \`axios\` module.\nC. What you do now:\n1) Run \`npm install axios\`.\nD. Local check:\nnpm install\nE. File/change:\n\`package.json\` – add axios`;
    const result = enforceFormat(input);
    assert.ok(!result.includes('**'), 'Should strip bold markers');
    assert.ok(!result.includes('`'), 'Should strip backticks');
  });

  it('should handle already-correct format', () => {
    const input = `A. The npm test command failed because package.json is missing.\nB. The repository does not have a package.json file.\nC. What you do now:\n1) Check if package.json exists.\n2) If missing, run npm init.\n3) Add test script.\n4) Commit and push.\nD. Local check:\nls package.json\nE. File/change:\npackage.json – create it.`;
    const result = enforceFormat(input);
    const validation = validateFormat(result);
    assert.ok(validation.valid, 'Already correct format should remain valid');
  });
});

describe('validateFormat', () => {
  it('should validate correct format', () => {
    const input = `A. Failed.\nB. Reason.\nC. What you do now:\n1) Step one.\n2) Step two.\nD. Local check:\ncommand\nE. File/change:\nfile.txt`;
    const result = validateFormat(input);
    assert.ok(result.valid);
  });

  it('should reject missing section', () => {
    const input = `A. Failed.\nB. Reason.\nC. What you do now:\n1) Step one.\nD. Local check:\ncommand`;
    const result = validateFormat(input);
    assert.ok(!result.valid, 'Missing E should be invalid');
    assert.ok(!result.hasE);
  });

  it('should reject missing numbered steps', () => {
    const input = `A. Failed.\nB. Reason.\nC. What you do now:\nStep one.\nStep two.\nD. Local check:\ncommand\nE. File/change:\nfile.txt`;
    const result = validateFormat(input);
    assert.ok(!result.hasNumberedSteps);
  });
});
