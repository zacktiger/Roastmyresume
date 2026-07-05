---
name: agent-rules
description: Defines the core principles, scoped workflows, security guardrails, branch management strategies, and delivery rules for Antigravity agents. Use when editing files, preparing a commit, or changing workflow policy. Do not load it just to answer read-only repo questions unless the task is about the workflow itself.
---

# AGENTS.md

You are the sole agent working on antigravity. No parallel work, no hand-offs. Choose the lightest workflow that fits the request. Do not force implementation, validation, or git/publish steps onto read-only tasks.

## 1. Core Principles

**Default to depth, not speed.**
- Read the surrounding codebase before editing. Trace how changes propagate through callers and tests.
- When uncertain, verify in code rather than guessing.
- Write out your reasoning for risky changes (build orchestration, deployment logic, critical paths) before editing.

**Right-size the workflow.**
- Start in inspection mode when the user is asking a question, requesting a review, locating config, or diagnosing behavior.
- Escalate to implementation mode only when the user clearly wants files changed or a fix shipped.
- Escalate to publish mode only when the user explicitly asks for a commit, push, or PR.
- Prefer the minimum commands that produce the needed evidence.

**Security & Secret Guardrails:**
- Never hardcode secrets, API keys, tokens, passwords, private keys, or other sensitive material.
- Treat `.env`, `.pem`, `.key`, `.pfx`, service-account files, database URLs, and auth tokens as strictly confidential.
- Do not print environment values, request headers with credentials, or raw responses in chat output or logs.
- If a secret is exposed, immediately halt work and notify the user.

**Dependency Management:**
- Check current docs and ask the user for explicit approval before adding any new `npm` packages.

---

## 2. Choose the Workflow First

Before taking action, classify the task into one of these modes. If the request is ambiguous, begin in Mode A.

### Mode A: Inspect / Diagnose / Review / Answer
Use this mode for:
- locating files, config, env vars, or feature entry points
- explaining code or architecture
- reviewing product behavior or UX
- investigating bugs without making changes
- answering repo, process, or git questions

Workflow: `Inspect -> Reproduce if useful -> Report`

Rules:
1. Stay read-only by default.
2. Do not branch, commit, push, or open a PR.
3. Do not run lint, build, or test unless one of these is true:
   - the user explicitly asked for it
   - the command output is the most direct evidence for the issue
   - you already made changes and are moving into Mode B
4. Use git only when it materially helps the task, such as checking worktree safety before editing, answering a git-specific question, or comparing revisions.
5. If you discover a likely fix but the user only asked for diagnosis, report it first instead of silently switching into delivery workflow.

### Mode B: Implement / Edit
Use this mode for:
- bug fixes
- features
- refactors
- documentation or config updates
- any request where the desired outcome is a changed file

Workflow: `Setup -> Implement -> Validate -> Handoff`

Rules:
1. **Assess State:** Run `git status` before editing to check for uncommitted changes. Do not overwrite unrelated work.
2. **Branching:** If you are on `main` or `master`, immediately checkout a new feature branch (`git checkout -b feature/brief-description` or `fix/brief-description`). Never commit directly to the default branch.
3. **Repository Branch Safety:** Never use the repository's only branch as a feature branch. Before creating or working on a feature branch, ensure the repository has a real default branch such as `main` or `master` that contains the current stable code. If the repo has no default branch yet, create and push one first, then branch from it.
4. **Write the Test First:** Before writing feature code or bug fixes, write or update a failing test when practical and meaningful for the change.
5. **Implement:** Write the minimum necessary code to make the requested behavior work.
6. **Refactor:** Clean up the code while keeping behavior correct.
7. **Validate:** Run the smallest reliable check set that proves the change. Prefer targeted validation over full-repo validation unless the change is broad or the user asked for the full loop.
8. **Failure Handling:** If validation fails, fix the issue and retry. If you fail to pass the relevant validation loop after 3 consecutive attempts, halt and ask the user for guidance.

### Mode C: Publish / Ship
Use this mode only when the user explicitly asks to commit, push, or open a PR.

Workflow: `Setup -> Validate -> Commit -> Push -> Handoff`

Rules:
1. Stage only the files relevant to the specific fix or feature.
2. Write clear, descriptive commit messages summarizing the why and what.
3. Push only the intended branch.
4. **PR Verification Guardrail:** Before announcing that a PR was created, verify that the PR actually exists on the remote, targets the correct base branch, and has a reachable URL. If any of those checks fail, do not claim a PR was created.
5. Never publish unrelated local changes.

## 3. Handoff Requirements

When you changed files, provide a concise summary containing:
- what was changed and why
- any new dependencies added, if previously approved
- the validation that was run and its result
- any areas of the code that carry risk or require careful human review

If no files were changed, report findings and recommended next steps without pretending a delivery workflow occurred.
