import { useEffect, useState, type FormEvent } from "react";
import { projectsApi, type Project, type ProjectStatus, type ProjectTask } from "@/lib/api";

export function useProjects(organizationId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProjects([]);
    if (!organizationId) {
      setProjectsLoading(false);
      return;
    }
    let active = true;
    setError(null);
    setProjectsLoading(true);
    void projectsApi.getProjects(organizationId)
      .then((data) => { if (active) setProjects(data); })
      .catch((err: unknown) => { if (active) setError(getErrorMessage(err, "Unable to load projects")); })
      .finally(() => { if (active) setProjectsLoading(false); });
    return () => { active = false; };
  }, [organizationId]);

  function createProject(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !isProjectFormValid(name, identifier)) return;
    setLoading(true);
    setError(null);
    void projectsApi.create(organizationId, {
      name: name.trim(),
      identifier: identifier.trim(),
      description: description.trim() || undefined,
    }).then((project) => {
      setProjects((current) => [project, ...current]);
      setName("");
      setIdentifier("");
      setDescription("");
    }).catch((err: unknown) => {
      setError(getErrorMessage(err, "Unable to create project"));
    }).finally(() => setLoading(false));
  }

  return { projects, name, identifier, description, loading, projectsLoading, error, setName, setIdentifier, setDescription, createProject };
}

export function useProjectPage(organizationId: string | undefined, projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProject(null);
    setStatuses([]);
    setTasks([]);
    setStatusId("");
    if (!organizationId) return;
    let active = true;
    setError(null);
    void Promise.all([
      projectsApi.get(organizationId, projectId),
      projectsApi.getStatuses(organizationId, projectId),
      projectsApi.getTasks(organizationId, projectId),
    ]).then(([projectData, statusData, taskData]) => {
      if (!active) return;
      setProject(projectData);
      setStatuses(statusData);
      setStatusId(statusData[0]?.id ?? "");
      setTasks(taskData);
    }).catch((err: unknown) => {
      if (active) setError(getErrorMessage(err, "Unable to load project"));
    });
    return () => { active = false; };
  }, [organizationId, projectId]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !isTaskFormValid(name, statusId)) return;
    setLoading(true);
    setError(null);
    try {
      const task = await projectsApi.createTask(organizationId, projectId, { name: name.trim(), statusId });
      setTasks((current) => [...current, task]);
      setName("");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create task"));
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(task: ProjectTask, nextStatusId: string) {
    if (!organizationId || task.statusId === nextStatusId) return;
    setError(null);
    try {
      const updated = await projectsApi.moveTask(organizationId, projectId, task.id, nextStatusId);
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update task"));
    }
  }

  return { project, statuses, tasks, name, statusId, loading, error, setName, setStatusId, createTask, moveTask };
}

function isProjectFormValid(name: string, identifier: string) {
  return Boolean(name.trim() && identifier.trim());
}

function isTaskFormValid(name: string, statusId: string) {
  return Boolean(name.trim() && statusId);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
