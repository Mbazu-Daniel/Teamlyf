import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { projectsApi, type Project } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";

type CreateProjectInput = { name: string; identifier: string; description?: string };

export function useProjects(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const organizationKey = organizationId ?? "";
  const projectsKey = queryKeys.projects(organizationKey);

  const projectsQuery = useQuery({
    queryKey: projectsKey,
    queryFn: () => projectsApi.getProjects(organizationKey),
    enabled: Boolean(organizationId),
    retry: false,
  });

  const createProjectMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(organizationKey, input),
    onSuccess: (project) => {
      setName("");
      setIdentifier("");
      setDescription("");
      setCreatedProject(project);
      queryClient.setQueryData<Project[]>(projectsKey, (current) => [project, ...(current ?? [])]);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  });

  function createProject(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !isProjectFormValid(name, identifier)) return;
    createProjectMutation.mutate({
      name: name.trim(),
      identifier: identifier.trim(),
      description: description.trim() || undefined,
    });
  }

  const error =
    getErrorMessage(createProjectMutation.error, "Unable to create project") ??
    getErrorMessage(projectsQuery.error, "Unable to load projects");

  return {
    projects: projectsQuery.data ?? [],
    createdProject,
    name,
    identifier,
    description,
    loading: createProjectMutation.isPending,
    projectsLoading: projectsQuery.isLoading,
    error,
    setName,
    setIdentifier,
    setDescription,
    createProject,
  };
}

function isProjectFormValid(name: string, identifier: string) {
  return Boolean(name.trim() && identifier.trim());
}
