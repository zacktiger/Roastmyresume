---
name: agent-rules
description: Defines the core principles, test-driven development guidelines, security guardrails, branch management strategies, and project workflows for Antigravity agents. Refer to this skill at the beginning of any coding task, before committing changes, or when finalizing work.
---

# AGENTS.md

You are the sole agent working on antigravity. No parallel work, no hand-offs. You must strictly follow the workflow pipeline below for every task.

## 1. Core Principles

**Default to depth, not speed.**
- Read the surrounding codebase before editing. Trace how changes propagate through callers and tests.
- When uncertain, verify in code rather than guessing.
- Write out your reasoning for risky changes (build orchestration, deployment logic, critical paths) before editing.

**Security & Secret Guardrails:**
- Never hardcode secrets, API keys, tokens, passwords, private keys, or other sensitive material.
- Treat `.env`, `.pem`, `.key`, `.pfx`, service-account files, database URLs, and auth tokens as strictly confidential.
- Do not print environment values, request headers with credentials, or raw responses in chat output or logs.
- If a secret is exposed, immediately halt work and notify the user.

**Dependency Management:**
- Check current docs and ask the user for explicit approval before adding any new `npm` packages.

---

## 2. The Agent Workflow Pipeline

You must execute tasks in this exact order: `Setup -> Implement -> Validate -> Commit -> Handoff`.

### Phase A: Setup & Context
1. **Assess State:** Run `git status` to check for uncommitted changes. Do not overwrite unrelated work.
2. **Branching:** If you are on `main` or `master`, immediately checkout a new feature branch (`git checkout -b feature/brief-description` or `fix/brief-description`). Never commit directly to the default branch.
3. **Repository Branch Safety:** Never use the repository's only branch as a feature branch. Before creating or working on a feature branch, ensure the repository has a real default branch such as `main` or `master` that contains the current stable code. If the repo has no default branch yet, create and push one first, then branch from it.
4. **PR Verification Guardrail:** Before announcing that a PR was created, verify that the PR actually exists on the remote, targets the correct base branch, and has a reachable URL. If any of those checks fail, do not claim a PR was created.

### Phase B: Implementation (TDD)
1. **Write the Test First:** Before writing feature code or bug fixes, write or update a failing test that defines the expected behavior.
2. **Implement:** Write the minimum necessary code to make the test pass.
3. **Refactor:** Clean up the code while ensuring tests remain green.

### Phase C: The Validation & Testing Loop
*This loop is mandatory before any commit.*
1. **Format & Lint:** Run `npm run lint` (or equivalent). Fix any stylistic or type errors.
2. **Build:** Run `npm run build` to ensure the project compiles successfully.
3. **Test:** Run `npm test`.
4. **Failure Handling (The Loop):**
   - If any check in steps 1-3 fails, read the error logs carefully.
   - Implement a fix and restart Phase C.
   - *Guardrail:* If you fail to pass the validation loop after 3 consecutive attempts, halt and ask the user for guidance. Do not force a broken commit.

### Phase D: Commit & Push
1. **Stage:** Stage only the files relevant to the specific fix or feature.
2. **Commit:** Write clear, descriptive commit messages summarizing the "why" and "what."
3. **Push:** Push the feature branch to the remote repository.

### Phase E: Review & Handoff
Once the code is pushed, provide the user with a concise summary containing:
- What was changed and why.
- Any new dependencies added (if previously approved).
- The results of the local validation loop (Lint/Build/Test status).
- Any areas of the code that carry risk or require careful human review.
- A request for the user to review and merge the PR. Do not attempt to merge it yourself.
