/**
 * Manages PR comments with deduplication.
 * Uses a hidden HTML signature to find and update existing comments.
 */

const SIGNATURE = '<!-- ci-fix-coach -->';

async function upsertComment(github, context, body) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issueNumber = context.issue.number;
  const fullBody = `## CI Fix Coach\n\n${body}\n\n---\n_Was this helpful? React with \u{1F44D} or \u{1F44E} on this comment._\n\n${SIGNATURE}`;

  // Find existing CI Fix Coach comment
  const comments = await github.rest.issues.listComments({
    owner, repo, issue_number: issueNumber, per_page: 100
  });

  const existing = comments.data.find(c => c.body && c.body.includes(SIGNATURE));

  if (existing) {
    await github.rest.issues.updateComment({
      owner, repo, comment_id: existing.id, body: fullBody
    });
    console.log(`Updated existing comment: ${existing.id}`);
    return { action: 'updated', commentId: existing.id };
  }

  const created = await github.rest.issues.createComment({
    owner, repo, issue_number: issueNumber, body: fullBody
  });
  console.log(`Created new comment: ${created.data.id}`);
  return { action: 'created', commentId: created.data.id };
}

module.exports = { upsertComment, SIGNATURE };
