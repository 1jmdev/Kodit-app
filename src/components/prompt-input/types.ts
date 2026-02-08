export interface PendingProject {
    name: string;
    workspacePath: string;
}

export interface PromptInputProps {
    variant?: "home" | "chat";
    placeholder?: string;
    pendingProject?: PendingProject | null;
    onPendingProjectSaved?: () => void;
}
