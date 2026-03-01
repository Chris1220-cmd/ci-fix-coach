/**
 * Post-processes Claude's output to enforce strict A/B/C/D/E format.
 * Fixes common Haiku issues: missing numbered steps, markdown leaking, preamble text.
 */

function enforceFormat(rawText) {
  let text = rawText.trim();

  // 1. Strip any preamble before "A."
  const aMatch = text.match(/^A\./m);
  if (aMatch && aMatch.index > 0) {
    text = text.substring(aMatch.index);
  }

  // 2. Strip markdown formatting
  text = text.replace(/#{1,6}\s/g, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/`{3}[^\n]*\n([\s\S]*?)`{3}/g, '$1');
  text = text.replace(/`([^`\n]+)`/g, '$1');

  // 3. Enforce numbered steps in section C
  const sectionCRegex = /(C\.\s*What you do now:?\s*\n)([\s\S]*?)(\n[DE]\.)/i;
  const cMatch = text.match(sectionCRegex);
  if (cMatch) {
    const header = cMatch[1];
    const body = cMatch[2];
    const nextSection = cMatch[3];

    const lines = body.split('\n').filter(l => l.trim());
    let stepNum = 1;
    const numbered = lines.map(line => {
      const cleaned = line
        .replace(/^\s*[-*•]\s*/, '')
        .replace(/^\s*\d+[.)]\s*/, '')
        .trim();
      if (cleaned) return `${stepNum++}) ${cleaned}`;
      return '';
    }).filter(Boolean).join('\n');

    text = text.replace(sectionCRegex, header + numbered + nextSection);
  }

  // 4. Strip any text after E section's content (trailing notes, summaries)
  const eSectionMatch = text.match(/^E\.\s*.+/m);
  if (eSectionMatch) {
    const eStart = text.indexOf(eSectionMatch[0]);
    const afterE = text.substring(eStart);
    // Keep E section content: everything up to a blank line followed by non-section text
    const eLines = afterE.split('\n');
    const eContent = [];
    let foundBlank = false;
    for (const line of eLines) {
      if (line.trim() === '' && eContent.length > 0) foundBlank = true;
      if (foundBlank && line.trim() !== '' && !line.startsWith('E.')) break;
      eContent.push(line);
    }
    text = text.substring(0, eStart) + eContent.join('\n');
  }

  return text.trim();
}

function validateFormat(text) {
  const hasA = /^A\./m.test(text);
  const hasB = /^B\./m.test(text);
  const hasC = /^C\./m.test(text);
  const hasD = /^D\./m.test(text);
  const hasE = /^E\./m.test(text);
  const hasNumberedSteps = /^\d\)\s/m.test(text);
  const startsWithA = text.trimStart().startsWith('A.');

  return {
    valid: hasA && hasB && hasC && hasD && hasE && hasNumberedSteps && startsWithA,
    hasA, hasB, hasC, hasD, hasE, hasNumberedSteps, startsWithA
  };
}

module.exports = { enforceFormat, validateFormat };
