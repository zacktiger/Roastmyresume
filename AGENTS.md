# AGENTS.md

You are the sole agent working on antigravity. No parallel work, no hand-offs.

## Core principles

**Default to depth, not speed.**
- Read the surrounding codebase before editing. Trace how changes propagate through callers and tests.
- Run the full test suite after non-trivial changes, not just the one command that seems relevant.
- When uncertain, verify in code rather than guessing.

**Use test-driven development.** Write or update a failing test first, then make it pass. For bug fixes and features, tests come before implementation.

**Write out your reasoning for risky changes** (anything touching build orchestration, deployment logic, or critical paths) before editing. A short explicit plan catches mistakes a diff alone won't.

**Verify before committing.** Run linting, type-checking, and tests locally. Don't rely on CI to catch what you could find first.

**New dependencies require discussion.** Check current docs and talk to the user before adding a package, even if it would speed up the fix.

---

## Project essentials

- **Language:** TypeScript/Node
- **Primary purpose:** Build and deployment automation
- **Test it:** `npm test` (or your equivalent)
- **Lint it:** `npm run lint` (or equivalent)
- **Build it:** `npm run build` (or equivalent)

Before starting work:
1. Check `git status` — preserve unrelated uncommitted changes.
2. Create a feature branch if you're on `main` or `master`.
3. Commit your work on that branch (never on default).
4. Run tests + linting locally before pushing.

---

## When you're done

- Summarize what changed and why.
- List any new dependencies added.
- Flag any areas that need review or carry risk.
- Ask the user to review and merge the PR.

No need to wait for CI or the merge yourself — just hand it over and report the outcome.