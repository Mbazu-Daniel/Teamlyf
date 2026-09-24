# Organization Isolation Audit

## Scope

This audit covers organization ownership, child-resource relationships, and authorization boundaries across the current Teamlyf data model.

## Verified database ownership

| Domain | Resource | Organization ownership | Current protection |
| --- | --- | --- | --- |
| Projects | Project | `project.organization_id` | FK to organization + application authorization |
| Projects | Status | inherited through `project_id` | FK to project; parent project must be checked by service |
| Projects | Task | inherited through `project_id` | FK to project; project/status integrity is hardened in the stacked database PR |
| Chat | Channel | `channel.organization_id` | FK to organization + application authorization |
| Documents | Document | organization-scoped | FK/application boundary requires endpoint-level verification |
| Notes | Note | organization-scoped | FK/application boundary requires endpoint-level verification |
| HR | Employee/leave resources | organization-scoped | FK/application boundary requires endpoint-level verification |
| Billing | Subscription | organization-scoped | organization FK + billing authorization |
| AI | Agent/AgentRun/usage | organization-scoped | organization FK/application authorization |

## Findings

### Project child relationships

The task/status relationship requires a composite database constraint so a task cannot point at a status owned by another project. The stacked database PR adds that constraint and repairs existing mismatched task/status pairs deterministically before applying it.

The same relationship should be reviewed for labels, milestones, comments, activities, and assignees.

### Member references

Resources that reference a member by `member_id` can technically reference a member from another organization unless the service layer validates the relationship. This requires explicit cross-organization integration coverage.

### Authorization boundary

Organization foreign keys provide a useful database boundary, but indirect child relationships still depend on API authorization. The existing organization access and permission services must remain the authoritative API boundary.

## Verification matrix

Every organization-scoped endpoint should cover:

- member of organization A can access organization A resources
- member of organization A cannot access organization B resources
- organization A cannot attach a resource from organization B
- organization A cannot assign organization B members to organization A resources
- role-restricted operations reject unauthorized members
- billing and AI resources cannot cross organization boundaries

## Implementation order

1. Complete the project relationship audit and add deterministic database constraints.
2. Validate existing task/status pairs and validate the composite constraint after any required data repair.
3. Add reusable cross-organization integration fixtures.
4. Cover member and role authorization.
5. Cover project and resource ownership.
6. Extend the matrix to chat, documents, notes, HR, billing, calls, and AI.
