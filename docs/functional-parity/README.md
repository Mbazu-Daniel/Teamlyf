# Functional parity delivery

Comparison source: the local `teamlyf-client` project. Existing application
functionality and shared controls were retained. Reference mock controls are
not counted as working integrations.

## Implemented

- Projects: status/code/leads, sorting and real task totals; corrected nested
  project routes. Tasks: richer creation, member/agent assignment, labels,
  subtasks and workspace scope/filters. Task relation changes are transactional.
- Sprints: create/edit/start/complete, task assignment/removal and progress.
  Cross-project sprint/task relationships are rejected.
- HR: employee/emergency-contact profiles, departments and membership, department
  org-chart tree, leave policies/balances/request/review/cancellation. Rejections
  require reasons. The tree represents departments, not reporting-manager lines.
- Notes: nested/private/archived/favorite/duplicated notes, rich-text editing,
  task linking, autosave, presence and snapshot restore. Revision checks protect
  concurrent edits; this is polling/presence plus conflict detection, not CRDT
  simultaneous-character merging.
- Documents: folders, real uploads/downloads, supported image/PDF preview,
  text editing, file-specific sharing, move, trash/restore and permanent deletion.
  Uploaded-file replacement and binary/text version restore retain history.
  Folder sharing does not implicitly grant access to children.
- Schedule: persisted events, editing/deletion, month/week views and range/date
  validation; dashboard upcoming events use live data.
- Notifications: task-activity inbox, workspace activity and persisted read state;
  periodic refresh and task links. This is not a universal all-module event feed.
- Administration: bulk invitations with per-recipient results, management and
  acceptance links; custom permission roles and member role filters/pagination;
  profile/avatar and workspace-logo uploads; workspace deletion and guarded
  account deletion. `/account` remains accessible without workspace membership.
- Chat: connected the profile's add-to-project action to a persistent form.
  Existing chat, threads, reactions and calls remain in place.
- Appearance: custom accent color with validated input, persistence and contrast
  handling. Public `/pricing` and in-app plan comparison use the plan catalog.
- Billing: current entitlement summary and plan confirmation/checkout handoff,
  with an explicit unavailable state when the provider is not configured.
- Integration fixes: auth-proxy HTTP errors retain their status, custom role
  assignment validation accepts configured roles, member query cache shapes agree.

## Still needs external input or integration

- Email delivery: configure a transactional sender and verified sending domain;
  wire invitation, verification and password-reset delivery callbacks. Invitations
  can currently be shared using their links. The received-invitation inbox
  requires verified email and explains that restriction.
- Billing: confirm the Bachs invoice/payment-method/portal API contract and
  provide test credentials, webhook secret and approved prices/trial rules.
  Invoice lists, payment-method management and trial provisioning are not
  implemented. Checkout and webhook behavior have not been provider-tested.
- Calls: existing LiveKit UI/token flow requires `LIVEKIT_URL`,
  `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` for real multi-user verification.
- Legal pages: approved terms/privacy/GDPR content and legal entity details are
  needed. Reference policy claims were not published as production commitments.
- Real AI provider credentials and production storage deployment were not
  validated by this local parity pass. Agent execution was exercised with a
  deterministic local model double, not a real LLM. The API now polls queued
  runs with bounded concurrency, checks tool grants, validates task mutations,
  times out model requests and preserves cancellation. This in-process runner
  still needs crash recovery/leases before it is a durable production worker.

## Verification (2026-09-29)

- 117 API request assertions passed against an isolated disposable PostgreSQL
  database on an API bound to localhost:3199. Covers permissions, workspace
  isolation, tasks/sprints/rollback, notes/conflicts, text and binary version
  restore, upload/download/trash, HR, roles and account deletion guards.
- 173 web tests passed (29 suites). Two workers are now the default to avoid
  resource-contention timeouts. The keyboard-select test waits for the initial
  popup highlight before sending its navigation key; assertions were retained.
- 27 realtime/agent integration scenarios passed with four independent sessions:
  channel and direct messages, threads, typing, reactions, attachments, private
  mention/reaction isolation, channel leave, live role restrictions, call
  signalling/history and missing-provider behavior. Agent checks cover missing
  provider, missing/read-only grants, a successful task update, invalid tool
  fields and cancellation while a local model response is pending.
- Web typecheck, repository lint, database/API builds and production web build
  passed. Fallow exited successfully with warnings, not a clean warning-free
  report; existing complexity policy was not weakened.
- Browser checked workspace/project/task creation and navigation, rich note
  autosave and persistence after reload, and calendar event creation.
- Additional browser checks covered sign-in, channel messages and thread replies
  persisted after navigation, department membership persisted after reload,
  org-chart membership, document creation/edit/history, settings and unavailable
  billing. At 390×844, verified the mobile drawer opens/closes on navigation and
  light/dark themes update the actual page. This is a selected browser smoke
  pass, not exhaustive coverage of every control or device/browser combination.
- Your `teamlyf_dev` database was not modified by these tests.

### Defects fixed during verification

- Channel/thread DTOs were type-only imports, breaking Nest's runtime validation.
- UUID-backed chat routes were rejected by a legacy public-ID parser.
- Private DM reactions/mentions lacked participant checks; mention inboxes could
  be requested for other members. Added access checks and regression scenarios.
- Existing sockets could send after losing write permission; channel delivery
  continued after leaving. Permissions are checked on incoming events and
  channel broadcasts resolve current membership.
- Agent runs stayed queued because the processor was never started. Added the
  guarded local runner described above.
- A failed LiveKit join persisted a joined participant before token validation.
- The desktop sidebar squeezed mobile pages instead of using a drawer. Mobile
  navigation now uses the shared sheet, and the header account control compacts.

## Run locally

```sh
pnpm install
pnpm db:migrate
pnpm dev
```

Migrations through `0025_document_file_versions` are included. Do not regenerate
or reset an existing database just to apply them.

```sh
pnpm --filter @teamlyf/web test
pnpm --filter @teamlyf/web typecheck
pnpm --filter @teamlyf/api build
pnpm --filter @teamlyf/web build
pnpm lint
pnpm fallow:audit
```

The API smoke test creates accounts and data. Run it only after starting a
separate API on port 3199 with `DATABASE_URL` pointing at a disposable database,
running migrations, and setting `BETTER_AUTH_URL=http://localhost:3199`,
`WEB_ORIGIN=http://localhost:3100` and a disposable `STORAGE_LOCAL_DIR`.

```sh
PARITY_API_URL=http://localhost:3199 pnpm --filter @teamlyf/api test:parity
```

For realtime/agent tests, start that isolated API with
`WEB_ORIGIN=http://localhost:3100,http://localhost:3198`,
`AGENT_OPENAI_BASE_URL=http://127.0.0.1:3197/v1` and
`AGENT_MANAGED_API_KEY=local-test-double-only`. Leave LiveKit and Bachs settings
unset for the missing-provider assertions. Port 3197 must be free: the suite
starts and closes a local deterministic model double there. Never point this
test at production or at a paid provider.

```sh
PARITY_API_URL=http://localhost:3199 pnpm --filter @teamlyf/web test:realtime
```

No commits or pushes were made during this implementation pass.
