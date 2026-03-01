const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { fetchFailedJobLogs } = require('./log-fetcher');
const { callClaude } = require('./claude-client');
const { enforceFormat, validateFormat } = require('./post-processor');
const { upsertComment } = require('./comment-manager');

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

    // Read system prompt from file
    const promptPath = path.join(process.env.GITHUB_WORKSPACE || '.', 'ci-fix-coach-system-prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Build user message
    const userMessage = [
      `Failed CI jobs: ${failedNames.join(', ')}`,
      '',
      'Here are the error logs:',
      logSnippets,
      '',
      'Analyze these failures. Reply ONLY in A/B/C/D/E format.',
      'IMPORTANT: Section C MUST use numbered steps: 1) ... 2) ... 3) ...',
      'Start your reply with A. on the first line. No other text.'
    ].join('\n');

    // Call Claude
    console.log(`Calling Claude (${model})...`);
    const result = await callClaude({
      apiKey: anthropicApiKey,
      model,
      systemPrompt,
      userMessage
    });

    console.log(`Claude response: ${result.inputTokens} input tokens, ${result.outputTokens} output tokens`);

    // Post-process to enforce format
    let reply = enforceFormat(result.text);
    const validation = validateFormat(reply);

    if (!validation.valid) {
      console.log(`Format validation failed: ${JSON.stringify(validation)}`);
      console.log('Using post-processed output anyway.');
    }

    // Post comment on PR (with dedup)
    await upsertComment(octokit, context, reply);

    // Set outputs
    core.setOutput('diagnosis', reply);
    core.setOutput('model-used', result.model);
    core.setOutput('input-tokens', result.inputTokens.toString());
    core.setOutput('output-tokens', result.outputTokens.toString());

    console.log('CI Fix Coach completed successfully.');

  } catch (error) {
    core.setFailed(`CI Fix Coach failed: ${error.message}`);
  }
}

run();
