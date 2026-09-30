import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ProjectMember } from "@/features/chat/types/projects/types";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { useMemo, useState } from "react";
import { TenantMemberAvatar } from "@/components/tenant-members/tenant-member-avatar";
import { getMemberDisplayName } from "@/lib/tenant-members/member-display";
import { cn } from "@/lib/utils";
import { IconSearch, IconX } from "@tabler/icons-react";

export default function AddMemberDialogContent({
  users = [],
  onClose,
  onConfirm,
  selectedUsers = [],
  isPending = false,
  availableMembers = [],
}: {
  users: TenantMember[];
  onClose: () => void;
  onConfirm: (users: TenantMember[]) => void;
  selectedUsers?: TenantMember[];
  isPending?: boolean;
  availableMembers?: ProjectMember[];
}) {
  const [selected, setSelected] = useState<TenantMember[]>(selectedUsers);
  const [searchMember, setSearchMember] = useState("");

  const alreadyOnProject = useMemo(
    () => new Set(availableMembers.map((m) => String(m.id))),
    [availableMembers],
  );

  const toggle = (user: TenantMember) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  const filteredUsers = useMemo(() => {
    const q = searchMember.trim().toLowerCase();
    return users
      .filter((user) => !alreadyOnProject.has(String(user.id)))
      .filter((user) => {
        if (!q) return true;
        const haystack = [getMemberDisplayName(user), user.email, user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
  }, [users, alreadyOnProject, searchMember]);

  const isAllSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selected.some((s) => s.id === u.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelected((prev) => prev.filter((p) => !filteredUsers.some((f) => f.id === p.id)));
      return;
    }
    setSelected((prev) => {
      const next = [...prev];
      filteredUsers.forEach((user) => {
        if (!next.some((s) => s.id === user.id)) next.push(user);
      });
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-4 px-5 pt-12 sm:px-6">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            size="search"
            decor="filled"
            className=""
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            autoFocus
          />
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-0.5 pl-0.5 pr-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
              >
                <TenantMemberAvatar member={user} className="h-5 w-5" fallbackSize="8px" />
                <span className="truncate">{getMemberDisplayName(user)}</span>
                <IconX className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {filteredUsers.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-slate-50"
            onClick={handleSelectAll}
          >
            <Checkbox checked={isAllSelected} />
            <span className="text-xs font-semibold text-muted-foreground">
              {isAllSelected ? "Clear selection" : "Select all"}
            </span>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-4 sm:px-6">
        {filteredUsers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {searchMember.trim() ? "No matching members." : "No members left to add."}
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id);
            return (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  isSelected ? "bg-primary/5" : "hover:bg-slate-50",
                )}
                onClick={() => toggle(user)}
              >
                <Checkbox checked={isSelected} />
                <TenantMemberAvatar member={user} className="h-8 w-8" fallbackSize="10px" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getMemberDisplayName(user)}
                  </p>
                  {user.email ? (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            disabled={isPending || selected.length === 0}
            size="sm"
            variant="primary-button-white"
            className=""
            onClick={() => onConfirm(selected)}
          >
            {isPending ? "Adding…" : selected.length > 0 ? `Add ${selected.length}` : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
