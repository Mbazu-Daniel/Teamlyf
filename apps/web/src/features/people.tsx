import { useState } from "react";
import { IconLayoutGrid, IconList } from "@tabler/icons-react";
import { HrmSidebar } from "./people/hrm-sidebar";
import { EmployeeList } from "./people/employee-list";
import { DepartmentTable } from "./people/department-table";
import { LeaveTable } from "./people/leave-table";
import { EmployeeCard, type Employee } from "./people/employee-card";

export function PeoplePage({ organizationSlug }: { organizationSlug: string }) {
  const [view, setView] = useState<"board" | "list">("board");
  const employees: Employee[] = [];
  return <div className="flex h-full min-h-0 gap-4 overflow-hidden p-3 md:p-4"><HrmSidebar organizationSlug={organizationSlug}/><main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-[1440px]"><header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold">People & HR</h1><p className="mt-1 text-sm text-muted-foreground">Employees, departments and leave management.</p></div><div className="flex items-center rounded-lg bg-muted p-1"><button onClick={()=>setView("board")} className={"rounded-md p-2 "+(view==="board"?"bg-background shadow-sm":"")}><IconLayoutGrid className="size-4"/></button><button onClick={()=>setView("list")} className={"rounded-md p-2 "+(view==="list"?"bg-background shadow-sm":"")}><IconList className="size-4"/></button></div></header>{view==="board" ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{employees.map(e=><EmployeeCard key={e.id} employee={e}/>)}</div> : <EmployeeList employees={employees}/>}<div className="mt-6"><DepartmentTable departments={[]}/></div><div className="mt-6"><LeaveTable requests={[]}/></div></div></main></div>;
}