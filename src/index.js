const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { fetchFailedJobLogs } = require('./log-fetcher');
const { callClaude } = require('./claude-client');
const { enforceFormat, validateFormat } = require('./post-processor');
const { upsertComment } = require('./comment-manager');

const FALLBACK_MODEL = 'claude-sonnet-4-20250514';

async function analyzeJob({ jobName, jobSnippet, changedFiles, systemPrompt, model, anthropicApiKey }) {
  const messageParts = [
    `Failed CI job: ${jobName}`,
    ''
  ];

  if (changedFiles.length > 0 && changedFiles.length <= 50) {
    messageParts.push('Files changed in this PR:');
    messageParts.push(changedFiles.join('\n'));
    messageParts.push('');
  }

  messageParts.push(
    'Here is the error log:',
    jobSnippet,
    '',
    'Analyze this failure. Reply ONLY in A/B/C/D/E format.',
    'IMPORTANT: Section C MUST use numbered steps: 1) ... 2) ... 3) ...',
    'Start your reply with A. on the first line. No other text.'
  );

  const userMessage = messageParts.join('\n');

  let result = await callClaude({ apiKey: anthropicApiKey, model, systemPrompt, userMessage });
  let reply = enforceFormat(result.text);
  let validation = validateFormat(reply);
  let modelUsed = model;

  if (!validation.valid && model !== FALLBACK_MODEL) {
    console.log(`  Format validation failed with ${model}, falling back to ${FALLBACK_MODEL}...`);
    result = await callClaude({ apiKey: anthropicApiKey, model: FALLBACK_MODEL, systemPrompt, userMessage });
    reply = enforceFormat(result.text);
    validation = validateFormat(reply);
    modelUsed = FALLBACK_MODEL;
  }

  return { reply, validation, modelUsed, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
}

async function getChangedFiles(octokit, context) {
  try {
    const prNumber = context.payload.pull_request.number;
    const files = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
      per_page: 100
    });
    return files.data.map(f => f.filename);
  } catch (e) {
    console.log(`Could not fetch changed files: ${e.message}`);
    return [];
  }
}

async function run() {
  try {
    // Read inputs
    const anthropicApiKey = core.getInput('anthropic-api-key', { required: true });
    const githubToken = core.getInput('github-token');
    const model = core.getInput('model') || 'claude-haiku-4-5-20251001';
    const maxLines = parseInt(core.getInput('log-lines') || '120', 10);
    const waitSeconds = parseInt(core.getInput('wait-seconds') || '15', 10);

    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    // Wait for other checks to complete
    if (waitSeconds > 0) {
      console.log(`Waiting ${waitSeconds}s for other checks to complete...`);
      await new Promise(r => setTimeout(r, waitSeconds * 1000));
    }

    // Fetch failed job logs
    console.log('Fetching failed job logs...');
    const { failedNames, jobLogs, hasFailures } = await fetchFailedJobLogs(
      octokit, context, { maxLines }
    );

    if (!hasFailures) {
      console.log('No failed checks found. Skipping.');
      return;
    }

    console.log(`Failed jobs: ${failedNames.join(', ')}`);
    console.log(`Jobs to analyze: ${jobLogs.length}`);

    // Fetch changed files for monorepo awareness
    const changedFiles = await getChangedFiles(octokit, context);
    if (changedFiles.length > 0) {
      console.log(`Changed files in PR: ${changedFiles.length}`);
    }

    // Read system prompt from action's own directory (GITHUB_ACTION_PATH),
    // not from the user's repo workspace (GITHUB_WORKSPACE)
    const promptPath = path.join(process.env.GITHUB_ACTION_PATH || '.', 'ci-fix-coach-system-prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Analyze each failed job separately
    const analyses = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let lastModelUsed = model;

    for (const { name, snippet } of jobLogs) {
      console.log(`Analyzing job: ${name}...`);
      const { reply, validation, modelUsed, inputTokens, outputTokens } = await analyzeJob({
        jobName: name,
        jobSnippet: snippet,
        changedFiles,
        systemPrompt,
        model,
        anthropicApiKey
      });

      console.log(`  Model: ${modelUsed}, tokens: ${inputTokens}/${outputTokens}, format valid: ${validation.valid}`);
      if (!validation.valid) {
        console.log(`  Format still invalid after fallback: ${JSON.stringify(validation)}`);
      }

      analyses.push({ name, reply });
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      lastModelUsed = modelUsed;
    }

    // Build final reply: single A-E block for one job, sectioned for multiple
    let finalReply;
    if (analyses.length === 1) {
      finalReply = analyses[0].reply;
    } else {
      finalReply = analyses
        .map(a => `### ${a.name}\n\n${a.reply}`)
        .join('\n\n---\n\n');
    }

    // Post comment on PR (with dedup)
    await upsertComment(octokit, context, finalReply);

    // Set outputs
    core.setOutput('diagnosis', finalReply);
    core.setOutput('model-used', lastModelUsed);
    core.setOutput('input-tokens', totalInputTokens.toString());
    core.setOutput('output-tokens', totalOutputTokens.toString());

    console.log(`CI Fix Coach completed successfully (model: ${lastModelUsed}, jobs: ${analyses.length}).`);

  } catch (error) {
    core.setFailed(`CI Fix Coach failed: ${error.message}`);
  }
}

run();
