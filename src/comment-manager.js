/**
 * Manages PR comments with deduplication.
 * Uses a hidden HTML signature to find and update existing comments.
 */

const SIGNATURE = '<!-- ci-fix-coach -->';

async function upsertComment(github, context, body) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issueNumber = context.payload.pull_request
    ? context.payload.pull_request.number
    : context.issue.number;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const fullBody = `## CI Fix Coach\n\n${body}\n\n---\n_Last updated: ${timestamp}_\n_Was this helpful? React with \u{1F44D} or \u{1F44E} on this comment._\n\n${SIGNATURE}`;

  console.log(`Looking for existing CI Fix Coach comment on PR #${issueNumber}...`);

  // Find existing CI Fix Coach comment
  const comments = await github.rest.issues.listComments({
    owner, repo, issue_number: issueNumber, per_page: 100
  });

  console.log(`Found ${comments.data.length} total comments on PR #${issueNumber}`);

  const existing = comments.data.find(c => c.body && c.body.includes(SIGNATURE));

  if (existing) {
    console.log(`Found existing CI Fix Coach comment: ${existing.id}, updating...`);
    const updated = await github.rest.issues.updateComment({
      owner, repo, comment_id: existing.id, body: fullBody
    });
    console.log(`Updated comment ${existing.id}, status: ${updated.status}`);
    return { action: 'updated', commentId: existing.id };
  }

  console.log('No existing CI Fix Coach comment found, creating new one...');
  const created = await github.rest.issues.createComment({
    owner, repo, issue_number: issueNumber, body: fullBody
  });
  console.log(`Created new comment: ${created.data.id}, status: ${created.status}`);
  return { action: 'created', commentId: created.data.id };
}

module.exports = { upsertComment, SIGNATURE };
