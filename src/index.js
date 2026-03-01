const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { fetchFailedJobLogs } = require('./log-fetcher');
const { callClaude } = require('./claude-client');
const { enforceFormat, validateFormat } = require('./post-processor');
const { upsertComment } = require('./comment-manager');

const FALLBACK_MODEL = 'claude-sonnet-4-20250514';

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
    const { failedNames, logSnippets, hasFailures } = await fetchFailedJobLogs(
      octokit, context, { maxLines }
    );

    if (!hasFailures) {
      console.log('No failed checks found. Skipping.');
      return;
    }

    console.log(`Failed jobs: ${failedNames.join(', ')}`);
    console.log(`Log snippets length: ${logSnippets.length} chars`);

    // Fetch changed files for monorepo awareness
    const changedFiles = await getChangedFiles(octokit, context);
    if (changedFiles.length > 0) {
      console.log(`Changed files in PR: ${changedFiles.length}`);
    }

    // Read system prompt from file
    const promptPath = path.join(process.env.GITHUB_WORKSPACE || '.', 'ci-fix-coach-system-prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Build user message with changed files context
    const messageParts = [
      `Failed CI jobs: ${failedNames.join(', ')}`,
      ''
    ];

    if (changedFiles.length > 0 && changedFiles.length <= 50) {
      messageParts.push('Files changed in this PR:');
      messageParts.push(changedFiles.join('\n'));
      messageParts.push('');
    }

    messageParts.push(
      'Here are the error logs:',
      logSnippets,
      '',
      'Analyze these failures. Reply ONLY in A/B/C/D/E format.',
      'IMPORTANT: Section C MUST use numbered steps: 1) ... 2) ... 3) ...',
      'Start your reply with A. on the first line. No other text.'
    );

    const userMessage = messageParts.join('\n');

    // Call Claude (primary model)
    console.log(`Calling Claude (${model})...`);
    let result = await callClaude({
      apiKey: anthropicApiKey,
      model,
      systemPrompt,
      userMessage
    });

    console.log(`Claude response: ${result.inputTokens} input tokens, ${result.outputTokens} output tokens`);

    // Post-process to enforce format
    let reply = enforceFormat(result.text);
    let validation = validateFormat(reply);
    let modelUsed = model;

    // Fallback to Sonnet if format validation fails
    if (!validation.valid && model !== FALLBACK_MODEL) {
      console.log(`Format validation failed with ${model}, falling back to ${FALLBACK_MODEL}...`);
      result = await callClaude({
        apiKey: anthropicApiKey,
        model: FALLBACK_MODEL,
        systemPrompt,
        userMessage
      });
      reply = enforceFormat(result.text);
      validation = validateFormat(reply);
      modelUsed = FALLBACK_MODEL;
      console.log(`Fallback response: ${result.inputTokens} input, ${result.outputTokens} output tokens`);
    }

    if (!validation.valid) {
      console.log(`Format still invalid after fallback: ${JSON.stringify(validation)}`);
    }

    // Post comment on PR (with dedup)
    await upsertComment(octokit, context, reply);

    // Set outputs
    core.setOutput('diagnosis', reply);
    core.setOutput('model-used', modelUsed);
    core.setOutput('input-tokens', result.inputTokens.toString());
    core.setOutput('output-tokens', result.outputTokens.toString());

    console.log(`CI Fix Coach completed successfully (model: ${modelUsed}).`);

  } catch (error) {
    core.setFailed(`CI Fix Coach failed: ${error.message}`);
  }
}

run();
