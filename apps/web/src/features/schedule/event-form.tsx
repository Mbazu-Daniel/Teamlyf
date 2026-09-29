import { useState } from "react";
import { scheduleApi, type CalendarEvent } from "@/lib/api/schedule";
import { WorkflowSheet, WorkflowField, WorkflowError, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";
import { pageInput, pageSecondaryAction } from "@/components/workspace/page-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function localDateTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function EventForm({ org, event, day, onClose }: { org: string; event?: CalendarEvent; day: Date; onClose: () => void }) {
  const start = new Date(day); start.setHours(9, 0, 0, 0);
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [startsAt, setStartsAt] = useState(localDateTime(event ? new Date(event.startsAt) : start));
  const [endsAt, setEndsAt] = useState(localDateTime(event ? new Date(event.endsAt) : new Date(start.getTime() + 3600000)));
  const [color, setColor] = useState(event?.color ?? "violet");
  const save = useWorkflowMutation([["events", org]], onClose);
  return <WorkflowSheet title={event ? "Edit event" : "Create event"} description="Workspace events are visible to members with project access. Times use your local timezone." onClose={onClose}><form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save.mutate(async () => {
    if (new Date(endsAt) <= new Date(startsAt)) throw new Error("The end must be after the start.");
    return scheduleApi.save(org, { title: title.trim(), description, location, color, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() }, event?.id);
  }); }}><WorkflowField label="Title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /><WorkflowField label="Starts" required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /><WorkflowField label="Ends" required type="datetime-local" min={startsAt} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /><WorkflowField label="Location or meeting link" maxLength={500} value={location} onChange={(e) => setLocation(e.target.value)} /><label className="block space-y-2 text-sm"><span>Description</span><textarea className={`${pageInput} h-auto py-3`} rows={4} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} /></label><label className="block space-y-2 text-sm"><span>Color</span><select className={pageInput} value={color} onChange={(e) => setColor(e.target.value)}>{["violet", "blue", "green", "amber", "rose"].map((value) => <option key={value}>{value}</option>)}</select></label><WorkflowError error={save.error} /><div className="flex gap-3"><WorkflowSubmit pending={save.isPending} />{event && <ConfirmDialog title="Delete event?" description="This removes the event for everyone in the workspace." confirmLabel="Delete" destructive onConfirm={() => save.mutate(() => scheduleApi.delete(org, event.id))} trigger={<button type="button" disabled={save.isPending} className={pageSecondaryAction}>Delete</button>} />}</div></form></WorkflowSheet>;
}
