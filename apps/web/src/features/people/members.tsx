import { useState, type FormEventHandler } from "react";
import { IconLayoutGrid, IconList, IconUserPlus } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolbarSearch, ViewToggle, pageSecondaryAction } from "@/components/workspace/page-layout";
import type { OrganizationMember } from "@/lib/api";
import { HrSection } from "./hr-section";
import { MemberActions, MemberIdentity } from "./member-row";
import { OWNER_ROLE, initialsOf, memberEmail, memberName } from "./member-utils";

const PAGE_SIZE = 5;

type MemberProfileLike = { jobTitle?: string | null };

export type MembersSectionProps = {
  members: OrganizationMember[];
  loadingMembers: boolean;
  inviteEmail: string;
  inviteRole: string;
  busyMember: string | null;
  roles?: string[];
  error?: unknown;
  profileByMember?: ReadonlyMap<string, MemberProfileLike>;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: string) => void;
  onInvite: FormEventHandler;
  onRoleChange: (memberId: string, role: string) => void;
  onRemove: (memberId: string) => void;
  /** Opens the HR profile for one person. */
  onOpenProfile: (memberId: string) => void;
};

export function MembersSection({
  members,
  loadingMembers,
  inviteEmail,
  inviteRole,
  busyMember,
  roles = ["member", "admin"],
  error,
  profileByMember,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
  onRoleChange,
  onRemove,
  onOpenProfile,
}: MembersSectionProps) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const inviteRoles = [...new Set(roles)].filter((role) => role !== OWNER_ROLE);
  const filtered = members.filter((member) =>
    `${memberName(member)} ${memberEmail(member)} ${profileByMember?.get(member.id)?.jobTitle ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);
  return (
    <HrSection
      error={error}
      loading={loadingMembers}
      loadingLabel="Loading members..."
      toolbar={
        <>
          <ToolbarSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search name or email"
            label="Search members"
          />
          <ViewToggle
            value={view}
            onChange={setView}
            ariaLabel="Member view"
            options={[
              { value: "cards", label: "Cards", icon: IconLayoutGrid },
              { value: "list", label: "List", icon: IconList },
            ]}
          />
        </>
      }
    >
      <div className="space-y-5">
        <section className="rounded-[16px] border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <IconUserPlus className="mt-0.5 size-5" />
            <div>
              <h2 className="text-sm font-semibold">Invite members</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Send an invite by email and choose their role in this workspace.
              </p>
            </div>
          </div>
          <form onSubmit={onInvite} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              type="email"
              required
              placeholder="member@example.com"
              aria-label="Member email"
              className="h-control min-w-0 flex-1 rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm outline-none focus:border-primary/50"
            />
            <Select
              value={inviteRole}
              items={Object.fromEntries(inviteRoles.map((role) => [role, role]))}
              onValueChange={onInviteRoleChange}
            >
              <SelectTrigger aria-label="Role to invite" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inviteRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="submit"
              disabled={busyMember === "invite"}
              className="h-control rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busyMember === "invite" ? "Inviting..." : "Invite"}
            </button>
          </form>
        </section>

        {filtered.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-border/80 bg-card p-6 text-center text-sm text-muted-foreground">
            {members.length === 0
              ? "No members yet. Send an invite above to grow your team."
              : "No members match that search."}
          </p>
        ) : (
          <>
            {view === "list" ? (
              <ul
                aria-label="Member list"
                className="divide-y overflow-hidden rounded-xl border border-border/70 bg-card"
              >
                {visible.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProfile(member.id)}
                      className="min-w-0 flex-1 rounded-[8px] text-left transition-colors hover:text-primary"
                    >
                      <MemberIdentity
                        member={member}
                        jobTitle={profileByMember?.get(member.id)?.jobTitle}
                      />
                    </button>
                    <MemberActions
                      member={member}
                      roles={roles}
                      busy={busyMember === member.id}
                      onRoleChange={onRoleChange}
                      onRemove={onRemove}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div
                role="list"
                aria-label="Member cards"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              >
                {visible.map((member) => {
                  const jobTitle = profileByMember?.get(member.id)?.jobTitle;
                  return (
                    <div
                      key={member.id}
                      role="listitem"
                      className="flex min-h-[150px] flex-col rounded-2xl border border-border/70 bg-card p-4"
                    >
                      {/* Only the identity opens the profile; the role and
                          remove controls below stay separate targets. */}
                      <button
                        type="button"
                        onClick={() => onOpenProfile(member.id)}
                        className="flex items-center gap-3 rounded-[8px] text-left transition-colors hover:text-primary"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initialsOf(memberName(member))}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {memberName(member)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {memberEmail(member)}
                          </span>
                        </span>
                      </button>
                      {jobTitle && (
                        <button
                          type="button"
                          onClick={() => onOpenProfile(member.id)}
                          className="mt-3 block w-full truncate text-left text-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          {jobTitle}
                        </button>
                      )}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                        <MemberActions
                          member={member}
                          roles={roles}
                          busy={busyMember === member.id}
                          onRoleChange={onRoleChange}
                          onRemove={onRemove}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {rangeStart} to {rangeEnd} of {filtered.length}{" "}
                {filtered.length === 1 ? "member" : "members"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={pageSecondaryAction}
                  disabled={!currentPage}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={pageSecondaryAction}
                  disabled={currentPage >= lastPage}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </HrSection>
  );
}
