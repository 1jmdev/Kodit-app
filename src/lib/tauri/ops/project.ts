import { invoke } from "@tauri-apps/api/core";
import { mapProject } from "../code/map";
import type { BackendProject, Project } from "../types/model";

export async function listProjects(): Promise<Project[]> {
    const projects = await invoke<BackendProject[]>("list_projects");
    return projects.map(mapProject);
}

export async function createProject(params: {
    name: string;
    workspacePath: string;
}): Promise<Project> {
    const created = await invoke<BackendProject>("upsert_project", {
        input: {
            name: params.name,
            workspace_path: params.workspacePath,
        },
    });
    return mapProject(created);
}

export async function createDefaultProjectIfNeeded(): Promise<Project> {
    return createProject({
        name: "Default Project",
        workspacePath: "default-workspace",
    });
}
