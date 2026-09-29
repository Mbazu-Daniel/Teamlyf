# Implementation preview stack

Each branch contains at most 50 changed files **relative to the preceding branch**,
including added and deleted files. A branch inherits the earlier commits; do not
open every PR against `dev`, which would show cumulative changes.

| Branch | PR base | Conventional commit |
| --- | --- | --- |
| `fix/ui-fixes-task` (existing) | `dev` | Existing authentication/theme commits |
| `chore/preview-stack-workflow` | `fix/ui-fixes-task` | `chore(git): support parent-based preview stack checks` |
| `feat/preview-database-storage` | `chore/preview-stack-workflow` | `feat(storage): extend workspace schemas and content persistence` |
| `feat/preview-api-workflows` | `feat/preview-database-storage` | `feat(api): complete workspace workflows and realtime authorization` |
| `feat/preview-shared-interface` | `feat/preview-api-workflows` | `feat(ui): unify workspace shell typography and shared controls` |
| `feat/preview-project-workflows` | `feat/preview-shared-interface` | `feat(projects): complete project boards tasks and sprint workflows` |
| `feat/preview-knowledge-workflows` | `feat/preview-project-workflows` | `feat(knowledge): add document note and schedule workflows` |
| `feat/preview-people-administration` | `feat/preview-knowledge-workflows` | `feat(workspace): complete people account access and billing screens` |
| `feat/preview-connected-workspace` | `feat/preview-people-administration` | `feat(workspace): connect dashboard notifications and chat experience` |

## Push in stack order

Push the existing base first if it is not already on the remote:

```sh
git switch fix/ui-fixes-task
git push -u origin HEAD
```

Then, from a clean working tree, push each new branch one at a time. This also
restores the parent configuration in another clone. It stops on a hook or push
failure; no hooks are bypassed and no force-push is used.

```sh
(
  set -e
  parent=fix/ui-fixes-task
  for branch in \
    chore/preview-stack-workflow \
    feat/preview-database-storage \
    feat/preview-api-workflows \
    feat/preview-shared-interface \
    feat/preview-project-workflows \
    feat/preview-knowledge-workflows \
    feat/preview-people-administration \
    feat/preview-connected-workspace
  do
    git switch "$branch"
    git config "branch.$branch.preview-base" "$parent"
    git push -u origin HEAD
    parent="$branch"
  done
)
```

Use the PR bases in the table and review/merge bottom-up. Each PR's title can use
its conventional commit message. Retarget/restack remaining PRs if earlier
branches are squash-merged; do not delete parent branches before dependants are
retargeted. Use the top branch for the complete application preview.

## Checks

Husky still validates branch names, conventional commit messages, the 50-file
staging limit, the 50-file branch diff, and the Fallow audit. The pre-push audit
uses the configured preview parent rather than a cumulative default-branch diff.
Always check out the branch being pushed so the audit runs on that branch's files.

```sh
parent=$(git config --get "branch.$(git branch --show-current).preview-base")
git diff --name-only "$parent"...HEAD
FALLOW_AUDIT_BASE="$parent" pnpm fallow:audit
```

Do not infer live integration readiness from a push: email delivery, payment
provider checkout, AI providers, and real audio/video require configured services.
See [functional verification](../functional-parity/README.md) on the completed stack.
