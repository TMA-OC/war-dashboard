# VIBE AGENCY SOP (Single File)

## PURPOSE

This document is the single source of truth for how the vibecoding agency operates. It defines the toolchain, roles, responsibilities, stack, folder structure, workflows, reporting cadence, and the rules for how work is created, tracked, implemented, tested, reviewed, approved, and shipped. It is written so Jay can resume this agency from any context by referencing this file.

---

## LOCKED DECISIONS (DO NOT RE-ASK)

1. **Kanban tool:** GitHub Projects (Projects v2)
2. **Repo hosting:** GitHub (Jay will provide a PAT when needed)
3. **Frontend:** Vue 3 + Vite
4. **First step:** set up the agency first (no project brief required to start setup)
5. **Reporting cadence to Jay:** after each major milestone OR whenever blocked and needs Jay intervention
6. **Token/model usage:** optimize efficiency without compromising output quality; use smaller models only for low-risk tasks

---

## NAMING AND LANGUAGE

- Do not mention Jay's personal name. Refer to the human stakeholder as "Jay".
- Use the label "needs-jay" and the board status "Waiting for Human" for anything that requires Jay's input.
- Keep updates concise and structured; avoid long free-form threads.

---

## TOOLS AND SYSTEMS

- **Project management:** GitHub Issues + GitHub Projects (v2) as Kanban
- **Execution:** PR-driven development; every meaningful task should have a PR
- **CI:** GitHub Actions (added early)
- **Local development:** Docker Compose only when it reduces friction (e.g., local Postgres)
- **Documentation:** Markdown in-repo, governed by this SOP

---

## RECOMMENDED DEFAULT STACK (OPTIMIZED FOR VIBE CODING + READABILITY + LOW RESOURCES)

### Frontend (locked)

- Vue 3 + Vite + TypeScript
- Vue Router, Pinia
- Tailwind CSS
- Vitest + @vue/test-utils (unit tests)
- Playwright (E2E tests)

### Backend (default recommendation)

- TypeScript API using Hono (minimal, readable)
- Deploy backend on Cloudflare Workers (serverless, low ops, low resources)

**Fallback if Workers is unsuitable for a given project:**
- Node.js (TypeScript) + Fastify

### Database (default recommendation; free-friendly)

- Postgres on Supabase or Neon (free tiers when possible)
- Drizzle ORM (lightweight, readable, TS-first)

### Infra / DevOps (default recommendation)

- GitHub Actions CI
- Frontend deploy: Cloudflare Pages (static Vite build)
- Backend deploy: Cloudflare Workers
- DB: Supabase or Neon
- Docker: used mainly for local dev consistency and optional service emulation; not required for production if using Pages/Workers/managed DB

### Design (default recommendation)

- Figma as the design hub
- Start with Tailwind tokens and a small consistent component pattern
- Ensure accessibility and edge cases are explicitly documented per project

---

## ROLES AND RESPONSIBILITIES (STRICT)

### General Manager (GM)

- Expands Jay's brief into bulletproof business logic, success metrics, assumptions, risks, and non-goals
- Ensures scope and business rules are coherent and testable
- Final sign-off that shipped work matches Jay's original brief and business requirements

### Project Manager (PM)

- Produces PRD and turns it into actionable tasks
- Owns Kanban hygiene: fields, dependencies, assignments, statuses
- Ensures every task has acceptance criteria and a test plan
- Verifies PRD completion before handing back to GM
- Ensures parallel execution while respecting dependencies

### UX/UI Designer–Engineer

- Produces Figma designs, flows, states, edge cases, accessibility notes
- Defines UI behavior in a testable manner (empty/error/loading states, form validation, responsive behavior)
- Prepares dev handoff docs and links in project-specific design folder

### Frontend Engineer

- Implements Vue/Vite UI per design and PRD
- Owns component patterns, state management, and frontend tests
- Validates integration with backend and documents any UI constraints

### Backend & Database Engineer

- Implements API endpoints, business logic, data model, migrations
- Ensures code readability, maintainability, and low resource usage
- Writes backend tests and documents contracts and assumptions

### QA Engineer

- Creates project testing strategy and regression/stress methodology
- Validates releases; files bugs as trackable issues
- Confirms fixes and closes the loop with evidence

### DevOps Engineer

- Sets up CI/CD, environments, secrets, deploy procedures, observability basics
- Keeps infra minimal and cost-efficient
- Ensures developer experience is smooth (scripts, docs, environment setup)

---

## REPOSITORY STRUCTURE (CLEAR SHARED VS PROJECT-SPECIFIC)

This repo is an agency workspace that can host multiple projects. Shared knowledge applies across projects; project folders contain only project-specific artifacts.

### Top-level folders

- `docs/shared/` (cross-project knowledge base, standards, skills, ways-of-working)
- `docs/projects/` (project-specific PRDs, testing, design, decisions, runbooks, notes)

### Cross-project shared documentation

```
docs/shared/
├── ways-of-working/
│   ├── AGENCY_SOP.md (this file)
│   ├── definition-of-ready.md
│   ├── definition-of-done.md
│   ├── branching-and-prs.md
│   ├── kanban-usage.md
│   └── handoffs-and-updates.md
├── skills/
│   ├── gm/
│   │   ├── business-logic-playbook.md
│   │   ├── success-metrics-library.md
│   │   └── risk-assumptions-checklist.md
│   ├── pm/
│   │   ├── prd-standard.md
│   │   ├── dependency-management.md
│   │   ├── estimation-guidelines.md
│   │   └── release-checklist.md
│   ├── ux-ui/
│   │   ├── ux-heuristics.md
│   │   ├── accessibility-checklist.md
│   │   └── figma-handoff-standard.md
│   ├── frontend/
│   │   ├── vue-style-guide.md
│   │   ├── component-patterns.md
│   │   ├── state-management-patterns.md
│   │   └── testing-frontend.md
│   ├── backend-db/
│   │   ├── api-design-guidelines.md
│   │   ├── database-schema-guidelines.md
│   │   ├── migrations-and-seeding.md
│   │   └── testing-backend.md
│   ├── qa/
│   │   ├── qa-methodology.md
│   │   ├── regression-checklist.md
│   │   ├── stress-testing-playbook.md
│   │   └── bug-triage.md
│   └── devops/
│       ├── ci-cd-standard.md
│       ├── secrets-and-envs.md
│       ├── deploy-playbook.md
│       └── observability-basics.md
├── standards/
│   ├── coding/
│   │   ├── typescript.md
│   │   └── lint-format.md
│   ├── testing/
│   │   ├── unit-testing-standard.md
│   │   └── e2e-testing-standard.md
│   └── security/
│       ├── auth-basics.md
│       └── secrets-handling.md
└── decisions/
    ├── adr-0000-agency-os.md
    └── adr-0001-default-stack.md
```

### Project-specific documentation

```
docs/projects/
├── _template/
│   ├── prd/
│   │   └── prd.md
│   ├── testing/
│   │   ├── test-strategy.md
│   │   └── test-cases.md
│   ├── design/
│   │   ├── design-notes.md
│   │   └── figma-links.md
│   ├── decisions/
│   │   └── adr-0001-project-scope.md
│   ├── runbooks/
│   │   ├── local-setup.md
│   │   └── deployment.md
│   └── notes/
│       └── meeting-notes.md
└── <project-slug>/
    ├── prd/
    ├── testing/
    ├── design/
    ├── decisions/
    ├── runbooks/
    └── notes/
```

### Rules for documentation placement

- If it applies to more than one project, it must go under `docs/shared/`
- If it is unique to one project, it must go under `docs/projects/<project-slug>/`
- Every new project begins by copying `docs/projects/_template/` to `docs/projects/<project-slug>/`

---

## GITHUB PROJECTS (KANBAN) SETUP

Create a GitHub Project (v2) named: **"Vibe Unit – Kanban"**

### Custom fields

- **Status** (single select): Backlog, Ready, In Progress, In Review, QA, Waiting for Human, Blocked, Done
- **Priority** (single select): P0, P1, P2, P3
- **Owner (Role)** (single select): GM, PM, UX/UI, Frontend, Backend/DB, QA, DevOps
- **Area** (single select): Product, Design, Frontend, Backend, Data, Infra, QA, Docs
- **Effort** (number): 1–8

### Enable built-in fields

- Parent issue
- Sub-issue progress

### Views

- **Board view "Execution"** grouped by Status, showing Priority, Owner(Role), Area, Effort, Sub-issue progress
- **Table view "Backlog & Ready"** filtered to Status = Backlog or Ready, sorted by Priority then Effort
- **Table view "Waiting for Human"** filtered to Status = Waiting for Human, sorted by Priority

### Automation

- Auto-add any issue/PR labeled "track" to the project
- When issue/PR is closed/merged, move item to Done

---

## LABELS (STRICT VOCABULARY)

Create these labels and use them consistently.

### Tracking/Type

- `track`
- `type:brief`
- `type:prd`
- `type:task`
- `type:bug`
- `type:infra`
- `type:docs`

### Role

- `role:gm`
- `role:pm`
- `role:ux`
- `role:frontend`
- `role:backend`
- `role:qa`
- `role:devops`

### State

- `blocked`
- `needs-jay`
- `ready`

**Rule:** Anything that should appear on the Kanban must include "track".

---

## REPO GUARDRAILS

### Branch protection on main

- Require PR to merge
- Require at least 1 approval
- Require status checks once CI exists
- Require resolving conversations
- No force pushes

### CODEOWNERS

- Add CODEOWNERS so docs and relevant areas have clear ownership (PM+GM own shared process docs; PM owns project docs; code owners added when code folders exist)

---

## TEMPLATES (MUST EXIST IN REPO)

Add these files:

- `.github/ISSUE_TEMPLATE/brief.yml` (Jay -> GM)
- `.github/ISSUE_TEMPLATE/prd.yml` (PM)
- `.github/ISSUE_TEMPLATE/task.yml` (Engineering)
- `.github/ISSUE_TEMPLATE/bug.yml` (QA)
- `.github/PULL_REQUEST_TEMPLATE.md`

---

## TASK STRUCTURE AND SUBTASK POLICY

- Every meaningful unit of work is an Issue
- Every meaningful Issue should be delivered via a PR
- Use sub-issues for work that can be parallelized, needs its own PR, or should be independently tracked
- Use small checklists inside an issue only for tiny steps that do not warrant separate ownership or PRs

---

## STANDARD OPERATING LOOP (FROM JAY TO SHIPPED)

1. Jay creates a Brief issue (`type:brief`, `role:gm`, `track`)
2. GM expands the brief into:
   - business logic and rules
   - success metrics
   - assumptions, risks, non-goals
   - high-level acceptance criteria
3. PM creates a PRD issue (`type:prd`, `role:pm`, `track`) and produces the PRD document in `docs/projects/<project-slug>/prd/`
4. PM decomposes PRD into tasks as sub-issues and assigns Owner(Role), Priority, Area, Effort, Status=Ready; dependencies are explicit in issue bodies
5. Implementers execute tasks via branch + early draft PR, update issues with structured comments
6. QA runs validation, regression, and stress checks per the project testing strategy; bugs are filed as bug issues
7. PM verifies all PRD acceptance criteria are met and PRDs/testing/docs are updated
8. GM performs final validation against Jay's original brief and business requirements
9. Merge PRs; issues close; project automation moves items to Done

---

## STATUS RULES (STRICT)

### Ready

- Acceptance criteria exists
- Test plan exists
- Owner(Role) is set
- Dependencies listed

### In Progress

- Branch exists
- Draft PR opened early

### In Review

- PR includes "Closes #<issue-id>"
- Evidence of tests run is included in PR description or comments

### QA

- QA is actively validating; any failures become bug issues

### Waiting for Human

- Blocked on Jay's input; must include `needs-jay` label and a structured question comment

### Blocked

- Blocked on non-Jay dependencies (e.g., another task not completed); must explain and link blockers

### Done

- PR merged (preferred) or issue closed with justification; testing evidence exists; docs updated if needed

---

## WAITING FOR HUMAN PROTOCOL (NEEDS JAY)

When any agent needs Jay's input (API keys, credits, a decision):

1. Set Status to "Waiting for Human"
2. Add label "needs-jay"
3. Add a comment with:

```
Need from Jay: one sentence
Options: A/B/C (2–3 max)
Recommendation: pick one and why
Blocked tasks: list issue numbers
```

Parallelize other work where possible; do not stall unrelated tasks.

---

## AGENT UPDATE FORMAT (USE IN ISSUE COMMENTS)

```
Progress: ✅ / 🔄 / ⛔
What changed: 2–5 bullets
Proof: PR link, tests run, screenshots/logs
Next: 1–3 bullets
Handoff: anything the next agent must know
```

---

## PR RULES

- Open a draft PR immediately when starting work
- PR must reference issue and include "Closes #ID"
- PR must include test plan and evidence of test execution
- Keep PRs small and reviewable when possible
- No direct commits to main

---

## TESTING POLICY (EVERYONE TESTS BEFORE HANDOFF)

- **UX/UI:** accessibility and edge case behavior documented in project design docs
- **Frontend:** unit tests for logic + E2E tests for critical flows
- **Backend:** unit tests for business rules + API contract checks
- **DevOps:** CI validates lint/test/build; deploy steps documented
- **QA:** regression + stress testing; bugs tracked as issues

Project-specific testing artifacts live in `docs/projects/<project-slug>/testing/`
Cross-project testing standards live in `docs/shared/standards/testing/`

---

## KNOWLEDGE BASE AND CONTINUOUS LEARNING

- Each role maintains its skill playbooks under `docs/shared/skills/<role>/`
- Reusable learnings go to `docs/shared/`
- Project-specific quirks, constraints, and decisions go to `docs/projects/<project-slug>/decisions/` and `notes/`
- Any improvement to process should update this SOP and/or related shared docs via PR

---

## REPORTING CADENCE (GM -> JAY)

GM communicates with Jay:
- After each major milestone, OR
- Whenever blocked and needs Jay

**Format:**

```
Milestone:
Outcome:
Proof: links to PRs/issues/docs
Risks: 1–3 bullets
Needs Jay: only if applicable
```

---

## TOKEN/MODEL USAGE POLICY

- GM and PM use high-reasoning capability for briefs/PRDs/architecture/critical decisions
- Engineers use high capability for architecture or tricky work; smaller models permitted only for low-risk chores (formatting, boilerplate, doc cleanup) when quality is not impacted
- If uncertainty or regression risk appears, immediately switch back to high capability
- Quality wins over token savings

---

## SETUP PHASE CHECKLIST (AGENT DOES THIS FIRST)

1. ☐ Create GitHub repo (once Jay provides PAT)
2. ☐ Add folder structure (docs/shared and docs/projects template)
3. ☐ Commit this file as `docs/shared/ways-of-working/AGENCY_SOP.md`
4. ☐ Add labels
5. ☐ Add issue templates and PR template
6. ☐ Create GitHub Project (fields, views, automation)
7. ☐ Enable branch protections
8. ☐ Confirm readiness: "Agency OS ready; waiting for first Brief from Jay."


---

## KANBAN OWNERSHIP RULES (STRICT — added 2026-03-01)

These rules clarify exactly who moves cards and when. Violations will be caught in GM review.

### Who owns what

| Transition | Owner | Trigger |
|-----------|-------|---------|
| Backlog → Ready | **PM** | After verifying AC + test plan + owner assigned + dependencies clear |
| Ready → In Progress | **Implementing agent** | When they pick up the task and open a branch/draft PR |
| In Progress → In Review | **Implementing agent** | When PR is up and they believe it's complete |
| In Review → QA | **QA Engineer** | When they begin validation |
| In Review → In Progress | **Implementing agent** | If reviewer sends it back with changes needed |
| QA → Done | **QA Engineer** | After all acceptance criteria verified and passing |
| Any → Waiting for Human | **Any agent** | When blocked on Jay; must include step-by-step instructions |
| Any → Blocked | **Any agent** | When blocked on non-Jay dependency; must link the blocking item |
| Waiting for Human → previous | **GM/PM** | After Jay unblocks |

### PM Kanban responsibility (explicit)

After creating tasks, PM MUST:
1. Verify each task has: AC, test plan, owner role, priority, effort — then and only then move to **Ready**
2. Tasks with unresolved dependencies stay in **Backlog** until the blocker is resolved
3. PM monitors the board and moves Backlog → Ready as dependencies clear

### Waiting for Human — mandatory content

Every card moved to "Waiting for Human" MUST have a comment containing:
1. One-line summary of what's needed
2. **Step-by-step instructions** Jay can follow without asking questions
3. Estimated time to complete
4. List of tasks blocked while waiting
5. What to do when done (e.g. "Reply on this issue with 'Done'")

### Agent self-service Kanban updates

Every agent receives the project item ID for their tasks and the status option IDs. They MUST call the GitHub Projects GraphQL API to move their own cards. No manual updates by GM except for setup or corrections.


---

## SLACK NOTIFICATION PROTOCOL (added 2026-03-01)

Whenever ANY card is moved to "Waiting for Human":

1. Move the GitHub card to "Waiting for Human" status
2. Add `needs-jay` label to the issue
3. Post a detailed comment on the issue with step-by-step instructions
4. **IMMEDIATELY send a Slack message to #vibe-briefs** with the same instructions

### Slack message format for blocked items

```
🔴 *Action Required — [Project] #[issue] [title]*

*What's needed:* One sentence
*Estimated time:* X minutes

*Step-by-step:*
1. ...
2. ...
3. ...

*Blocked tasks:* list
*GitHub issue:* https://github.com/TMA-OC/war-dashboard/issues/[N]
```

### Who sends it
The agent that hits the blocker sends the Slack message before stopping work on that task. GM sends it if the agent failed to. No blocked item should ever sit silently — Jay must be informed on Slack.
