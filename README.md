# CI Fix Coach

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-CI%20Fix%20Coach-blue?logo=github)](https://github.com/marketplace/actions/ci-fix-coach)
[![Version](https://img.shields.io/github/v/release/Chris1220-cmd/ci-fix-coach?color=green&label=version)](https://github.com/Chris1220-cmd/ci-fix-coach/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/Chris1220-cmd/ci-fix-coach?style=social)](https://github.com/Chris1220-cmd/ci-fix-coach/stargazers)

**Your CI failed. Here is exactly what to fix.**

CI Fix Coach is a GitHub Action that automatically diagnoses CI failures and posts actionable fix instructions directly on your pull request. No more digging through logs — get a precise diagnosis in seconds.

## How it works

```
PR push → CI fails → CI Fix Coach reads the logs → Posts diagnosis as PR comment
```

When any CI check fails on your PR, CI Fix Coach:

1. Downloads the actual error logs from the failed jobs
2. Sends them to Claude (Anthropic) for analysis
3. Posts a structured diagnosis as a PR comment with exact steps to fix it

## Example output

When your CI fails, you get a comment like this:

```
A. The build failed at tsc compilation due to a type mismatch in UserCard.tsx:18.
B. The property "age" is passed as string but the interface expects number,
   likely from an untyped API response.
C. What you do now:
1) Open src/components/UserCard.tsx at line 18.
2) Trace where user.age is assigned — check if the API response is parsed
   with correct types.
3) Add explicit type conversion: Number(user.age) or update the interface
   if string is intentional.
4) Run tsc locally to confirm the fix.
5) Commit and push.
D. Local check:
npx tsc --noEmit
E. File/change:
src/components/UserCard.tsx:18 – cast user.age to number, or fix the
upstream type definition.
```

## Quick start

Add this to `.github/workflows/ci-fix-coach.yml`:

```yaml
name: CI Fix Coach

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  checks: read
  actions: read
  issues: write
  pull-requests: write

jobs:
  diagnose:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: Chris1220-cmd/ci-fix-coach@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

Then add your Anthropic API key as a repository secret:
**Settings > Secrets and variables > Actions > New repository secret > `ANTHROPIC_API_KEY`**

That's it. Every failed CI check now gets an automatic diagnosis.

## What it diagnoses

| Category | Examples |
|----------|----------|
| Lint / format failures | ESLint, Prettier, flake8, black, rubocop |
| Test failures | Jest, pytest, mocha, JUnit, go test |
| Missing dependencies | npm, pip, cargo, go mod |
| Build / compile errors | tsc, webpack, gcc, javac, rustc |
| Permission denied | SSH keys, tokens, Docker, file permissions |
| Timeouts | Job limits, async callbacks, hanging processes |
| Missing env variables | DATABASE_URL, API keys, secrets not wired |
| Docker build errors | COPY failed, no space left, binary not found |

## Configuration

| Input | Default | Description |
|-------|---------|-------------|
| `anthropic-api-key` | (required) | Your Anthropic API key |
| `github-token` | `GITHUB_TOKEN` | GitHub token for API access |
| `model` | `claude-haiku-4-5-20251001` | Claude model to use |
| `log-lines` | `120` | Max log lines to analyze per job |
| `wait-seconds` | `15` | Seconds to wait for checks to complete |

## Features

- **Smart log extraction** — Finds the first error in the log and extracts context around it, instead of blindly taking the last N lines
- **Comment deduplication** — Updates the same comment on each push instead of flooding your PR
- **Format enforcement** — Post-processes Claude's output to ensure consistent A/B/C/D/E structure
- **Retry logic** — Retries Claude API calls with exponential backoff on failure
- **Feedback** — Each comment includes thumbs up/down for tracking diagnosis quality
- **Timestamp** — Shows when the diagnosis was last updated

## FAQ

**Is my source code sent to Claude?**
No. Only CI log output is sent. Your source code, secrets, and environment variables are never included.

**How much does it cost?**
CI Fix Coach uses Claude Haiku by default. Each diagnosis costs approximately $0.001-0.003 in API usage. You need your own Anthropic API key.

**Does it work with monorepos?**
Yes. It analyzes all failed jobs in the PR regardless of repo structure.

**What if the diagnosis is wrong?**
React with thumbs down on the comment. If the log doesn't contain enough information, CI Fix Coach will say so and ask for more context.

## Development

```bash
npm install          # Install dependencies
npm test             # Run tests (14 tests)
npm run build        # Bundle with ncc into dist/
```

## License

MIT
