/**
 * Fetches and extracts relevant CI failure logs from GitHub Actions API.
 */

const ERROR_PATTERNS = [
  /\bERROR\b/, /\berror\b:/, /\bError\b:/, /\bFAIL\b/, /\bfailed\b/i,
  /\bException\b/, /\bTraceback\b/, /exit code [1-9]/, /\bnpm ERR\b/,
  /\bfatal\b:/, /\bpanic\b:/, /ENOENT/, /EACCES/, /EPERM/,
  /ModuleNotFoundError/, /ImportError/, /SyntaxError/, /TypeError/
];

// Job/check names to exclude (self-exclusion)
const SELF_EXCLUSION_NAMES = ['CI Fix Coach', 'diagnose'];

function isSelfExcluded(name) {
  return SELF_EXCLUSION_NAMES.some(n => name === n || name.startsWith('CI Fix Coach'));
}

function extractRelevantSection(fullLog, maxLines = 120) {
  const lines = fullLog.split('\n');

  // Find the first meaningful error line
  let firstErrorLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (ERROR_PATTERNS.some(p => p.test(lines[i]))) {
      firstErrorLine = i;
      break;
    }
  }

  if (firstErrorLine >= 0) {
    // Take 20 lines before the first error, then maxLines total
    const start = Math.max(0, firstErrorLine - 20);
    return lines.slice(start, start + maxLines).join('\n');
  }

  // Fallback: last N lines
  return lines.slice(-maxLines).join('\n');
}

async function fetchFailedJobLogs(github, context, { maxLines = 120 } = {}) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const headSha = context.payload.pull_request.head.sha;

  // Get all checks for this PR, excluding our own action
  const checks = await github.rest.checks.listForRef({ owner, repo, ref: headSha });
  const failed = checks.data.check_runs.filter(c =>
    c.conclusion === 'failure' && !isSelfExcluded(c.name)
  );

  if (failed.length === 0) {
    return { failedNames: [], logSnippets: '', jobLogs: [], hasFailures: false };
  }

  const failedNames = failed.map(c => c.name);

  // Get workflow runs to download actual logs
  const runs = await github.rest.actions.listWorkflowRunsForRepo({
    owner, repo, head_sha: headSha
  });

  const jobLogs = []; // [{name, snippet}]

  for (const run of runs.data.workflow_runs) {
    if (run.conclusion !== 'failure') continue;

    const jobs = await github.rest.actions.listJobsForWorkflowRun({
      owner, repo, run_id: run.id
    });

    for (const job of jobs.data.jobs) {
      if (job.conclusion !== 'failure') continue;
      if (isSelfExcluded(job.name)) continue;

      let snippet = '';

      try {
        const logResponse = await github.rest.actions.downloadJobLogsForWorkflowRun({
          owner, repo, job_id: job.id
        });

        const fullLog = typeof logResponse.data === 'string'
          ? logResponse.data
          : String(logResponse.data);

        snippet = extractRelevantSection(fullLog, maxLines);
      } catch (e) {
        snippet = `Could not download logs: ${e.message}\n`;
        // Fallback: list failed steps
        for (const step of job.steps || []) {
          if (step.conclusion === 'failure') {
            snippet += `Failed step: ${step.name}\n`;
          }
        }
      }

      jobLogs.push({ name: job.name, snippet });
    }
  }

  // Fallback: if no job logs fetched (e.g. log download failed entirely)
  if (jobLogs.length === 0) {
    const fallbackSnippet = `Failed checks: ${failedNames.join(', ')}\nNo detailed logs available.\n`;
    jobLogs.push({ name: failedNames[0] || 'unknown', snippet: fallbackSnippet });
  }

  // Build combined logSnippets string for backward compat
  const logSnippets = jobLogs
    .map(j => `--- Job: ${j.name} ---\n${j.snippet}`)
    .join('\n\n');

  return { failedNames, logSnippets, jobLogs, hasFailures: true };
}

module.exports = { fetchFailedJobLogs, extractRelevantSection };
