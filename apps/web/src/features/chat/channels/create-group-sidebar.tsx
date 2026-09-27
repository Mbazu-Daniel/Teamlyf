import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddMemberDialogContent from "./add-member-dialog";
import { useCreateChannel } from "@/features/chat/data/mutations/channel/use-create-channel-hook";
import { useTenantStore } from "@/lib/store/tenant-store";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import { IconPlus, IconX } from "@tabler/icons-react";

interface CreateGroupSidebarProps {
  open: boolean;
  onClose: () => void;
  users: TenantMember[]; // list of all users you can chat with
}



export default function CreateGroupSidebar({
  open,
  onClose,
  users
}: CreateGroupSidebarProps) {
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [members, setMembers] = useState<TenantMember[]>([]);
    const [addMemberOpen, setAddMemberOpen] = useState(false);

    const { tenantId } = useTenantStore();


    const updateMember = (
        index: number,
        field: "email" | "role",
        value: string
    ) => {
        setMembers((prev) => 
            prev.map((member, i) =>
                i === index ? { ...member, [field]: value } : member
            )
        );
    };

    const { mutate: createChannel, isPending: isCreatingChannel } = useCreateChannel(tenantId!);

    const onCreateGroup = () => {
        // Create channel logic here
        createChannel({
            name: groupName,
            description: description
        });
        onClose();
    }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="right"
          variant="flushRoundedLeft"
          className="w-full sm:max-w-[30rem] flex flex-col"
        >
          {/* Header */}
          <SheetHeader
            variant="padded"
            className="flex flex-row items-center justify-between"
          >
            <SheetTitle>Create Group</SheetTitle>
          </SheetHeader>

            {/* Body */}
            <div className="flex-1">
                <div className="flex flex-col overflow-y-auto px-4 py-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Group name</label>
                        <Input 
                            placeholder="Sprint 1"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">
                            Group description <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Textarea 
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="space-y-2 border-t px-4 py-4 flex flex-col">
                    <label className="text-xs">Group Member</label>
                        

                    {members.map((member, index) => (
                        <div key={index}>
                            <div className="grid grid-cols-[7fr_2.5fr_0.2fr] gap-2 items-center">
                                <Input
                                    id="member-email"
                                    value={member.firstName + ' ' + member.lastName}
                                    readOnly
                                />

                                <Select
                                    value={member.role || "member"}
                                    onValueChange={(value) => {
                                      if (value) updateMember(index, "role", value)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>

                                <IconX
                                    className={`h-4 w-4 font-bold cursor-pointer text-muted-foreground hover:text-red-500 ${members.length === 1 ? "hidden": ''}`}
                                    onClick={() => {
                                        if (members.length > 1) {
                                            setMembers((prev) => prev.filter((_, i) => i !== index));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                        No members added yet
                        </p>
                    )}

                    <div className="flex justify-between items-center">
                        <div onClick={() => setAddMemberOpen(true)} className="cursor-pointer justify-start flex items-center text-xs font-medium text-primary-button">
                            <IconPlus className="inline-block mr-2 h-4 w-4" />
                            Add member
                        </div>

                        {members.length > 0 && (
                            <p className="cursor-pointer flex items-center justify-start text-xs font-medium text-destructive" onClick={() => setMembers([])}>
                                <IconX className="inline-block mr-2 h-4 w-4" />
                                Cancel all
                            </p>
                        )}
                    </div>
                </div>
            </div>

          {/* Footer */}
          <div className="border-t px-4 py-4 flex justify-end gap-2">
            <Button variant="outline-destructive" onClick={onClose}>
              Discard
            </Button>
            <Button variant="primary-button" disabled={isCreatingChannel} className="disabled:cursor-not-allowed" onClick={onCreateGroup}>
              {isCreatingChannel ? "Creating..." : "Create Group"}
            </Button>
          </div>
          {/* Add Member Modal */}
        </SheetContent>
      </Sheet>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent variant="flush" className="w-full sm:max-w-[30rem]">
          <DialogTitle className="sr-only">Add group members</DialogTitle>
          <AddMemberDialogContent
            users={users}
            onClose={() => setAddMemberOpen(false)}
            onConfirm={(selected) => {
              setMembers(
                selected.map((u) => ({ ...u, role: "member" }))
              );
              setAddMemberOpen(false);
            }}
            selectedUsers={members}
          />
        </DialogContent>
      </Dialog>

    </>
  );
}
