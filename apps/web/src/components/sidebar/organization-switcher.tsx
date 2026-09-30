import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconPlus, IconSelector } from "@tabler/icons-react";
import { getOrganizations, type Organization } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useOrganization } from "@/lib/organization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function organizationInitial(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function OrganizationBadge({
  name,
  logo,
  tint,
  className,
}: Readonly<{
  name: string;
  logo?: string | null;
  /** Applied only while there is no logo; a real image must not sit on a tint. */
  tint: string;
  className: string;
}>) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden", !logo && tint, className)}
    >
      {logo ? (
        <img src={logo} alt="" className="size-full object-cover" />
      ) : (
        organizationInitial(name)
      )}
    </span>
  );
}

type OrganizationSwitcherProps = Readonly<{ collapsed: boolean }>;

export function OrganizationSwitcher({ collapsed }: OrganizationSwitcherProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { organization, selectOrganization } = useOrganization();
  const { data: organizations, isPending } = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
    staleTime: 30_000,
  });

  if (!organization) return null;
  const activeOrganization = organization;

  function choose(next: Organization) {
    if (next.id === activeOrganization.id) return;
    selectOrganization(next);
    void queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    const segments = pathname.split("/").filter(Boolean);
    const section = segments[1] ?? "";
    const target = section ? `/${next.slug || next.id}/${section}` : `/${next.slug || next.id}`;
    if (target !== pathname) void navigate({ to: target });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title={collapsed ? activeOrganization.name : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left transition-colors duration-150 hover:bg-sidebar-accent/90",
              collapsed && "justify-center px-0",
            )}
          >
            <OrganizationBadge
              name={activeOrganization.name}
              logo={activeOrganization.logo}
              tint="bg-gradient-to-br from-primary to-primary-400"
              className="size-8 rounded-[10px] text-[10px] font-semibold text-primary-foreground"
            />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
                    {activeOrganization.name}
                  </span>
                </span>
                <IconSelector
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-52 w-(--anchor-width)">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        </DropdownMenuGroup>
        {isPending && <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>}
        {organizations?.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => choose(item)}>
            <OrganizationBadge
              name={item.name}
              logo={item.logo}
              tint="bg-primary/15"
              className="size-6 rounded-md text-[10px] font-bold text-primary"
            />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.id === activeOrganization.id && <IconCheck className="text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            void navigate({
              to: "/$organizationSlug/settings",
              params: { organizationSlug: activeOrganization.slug ?? activeOrganization.id },
            })
          }
        >
          <IconPlus />
          Organization settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
