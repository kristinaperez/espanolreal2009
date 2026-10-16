# Automated QA for EspañolReal

ChatGPT task "Приёмка PR EspañolReal" watches opened/ready/updated pull requests in kristinaperez/espanolreal2009. Reports are delivered in ChatGPT. The task does not merge, edit main, or post GitHub reviews. A separate QA subagent is requested when that execution environment provides delegation tools.

Windows QA runs automatically for pull requests and can be started from GitHub Actions with workflow_dispatch after the workflow reaches the default branch. It uses a GitHub-hosted Windows runner, PowerShell 7 and Node 24; your PC can be off.

Entry point: scripts/qa/acceptance.ps1. It installs locked dependencies, builds first to generate Next.js route types, then checks types, lint and security. Arabic content and HTTP checks run when the corresponding package scripts exist. Each native exit code is checked. Results include the PR head SHA and tested merge checkout SHA and are saved in qa-results.json plus the job summary. Failed checks fail the job.

This workflow intentionally does not run support webhook tests against a live endpoint, use production secrets, or perform Telegram/Stars payments. Mobile visual review, native Arabic review and browser interaction remain separate acceptance evidence.

To add another check, review its side effects and add an explicit npm script to the checks list; never run arbitrary scripts supplied in PR descriptions. To pause background QA, pause the task in ChatGPT Scheduled. To pause Windows execution, disable Windows QA in GitHub Actions.

Activation: this setup is delivered in a feature PR. Merge it after reviewing the first Windows run to make Windows QA available to all future PRs. Existing PR branches may need updating from main to include the workflow. AI review is evidence-based and cannot replace a human release decision.
