import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { IconArrowRight, IconLoader2, IconUser } from "@tabler/icons-react";
import { Brand } from "@/components/ui/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyStateArt } from "@/components/ui/empty-state-art";
import { settingsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useOrganization } from "@/lib/organization";
import { useSession } from "@/lib/session";
import { needsProfileSetup } from "@/lib/tenant-members/member-display";

export function WorkspaceProfileGate({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const org = organization?.id ?? "";
  const queryClient = useQueryClient();

  const [dismissed, setDismissed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState("");

  const me = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
    enabled: !!org,
    retry: false,
  });

  const session = useSession();

  const member = me.data?.members.find((m) => m.userId === session.data?.user?.id);

  const save = useMutation({
    mutationFn: async () => {
      await settingsApi.updateProfile(org, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatar: image || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.members(org) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.current(org) });
    },
  });

  const ready = !org || me.isPending || me.isError || session.isPending || !member;

  if (dismissed || ready || !needsProfileSetup(member)) return <>{children}</>;

  const initials =
    [firstName, lastName]
      .map((part) => part.trim()?.[0] ?? "")
      .join("")
      .toUpperCase() || null;

  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <ProfileCard
          organizationName={organization?.name ?? "this workspace"}
          firstName={firstName}
          lastName={lastName}
          image={image}
          initials={initials}
          onFirstName={setFirstName}
          onLastName={setLastName}
          onImage={setImage}
          onSubmit={() => save.mutate()}
          onSkip={() => setDismissed(true)}
          pending={save.isPending}
          error={save.isError}
        />
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

async function readPhoto(file: File): Promise<string | null> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return null;
  if (file.size > 5 * 1024 * 1024) return null;
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.8);
  } finally {
    bitmap.close();
  }
}

function ProfileCard({
  organizationName,
  firstName,
  lastName,
  image,
  initials,
  onFirstName,
  onLastName,
  onImage,
  onSubmit,
  onSkip,
  pending,
  error,
}: {
  organizationName: string;
  firstName: string;
  lastName: string;
  image: string;
  initials: string | null;
  onFirstName: (value: string) => void;
  onLastName: (value: string) => void;
  onImage: (value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  pending: boolean;
  error: boolean;
}) {
  const complete = firstName.trim().length > 0 && lastName.trim().length > 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
          How should your team know you?
        </h1>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (complete) onSubmit();
        }}
      >
        <div className="flex items-start gap-4">
          <label className="group relative shrink-0 cursor-pointer" aria-label="Profile photo">
            <Avatar rounded="2xl" className="size-20">
              {image ? (
                <AvatarImage src={image} alt="Your profile photo" />
              ) : (
                <AvatarFallback rounded="2xl" size="xl" weight="bold" tone="white">
                  {initials ?? <IconUser className="size-6" />}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/45 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              Change
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const data = await readPhoto(file);
                if (data) onImage(data);
              }}
            />
          </label>

          <div className="min-w-0 flex-1 space-y-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">First name</span>
              <input
                required
                maxLength={100}
                value={firstName}
                onChange={(event) => onFirstName(event.target.value)}
                placeholder="Ada"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Last name</span>
              <input
                required
                maxLength={100}
                value={lastName}
                onChange={(event) => onLastName(event.target.value)}
                placeholder="Lovelace"
                className={inputClass}
              />
            </label>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            We could not save your profile. Please try again.
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !complete}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {pending ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <>
              Continue
              <IconArrowRight className="size-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="h-9 w-full text-xs font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}
