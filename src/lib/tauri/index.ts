export type {
    AuthConfig,
    DiffRecord,
    FileChangeType,
    FileSnapshotChange,
} from "./types/model";
export { init as initializeStorage, folder as pickFolder } from "./ops/base";
export {
    createDefaultProjectIfNeeded,
    createProject,
    listProjects,
} from "./ops/project";
export { addMessage, createThread, listMessages, listThreads } from "./ops/thread";
export { clearDiffs, listDiffs, saveDiff } from "./ops/diff";
export {
    agentDeleteFile,
    agentReadFile,
    agentRunCommand,
    agentWriteFile,
} from "./ops/agent";
export type {
    AgentDeleteFileResult,
    AgentReadFileResult,
    AgentRunCommandResult,
    AgentWriteFileResult,
} from "./ops/agent";
export { readAuthConfig, writeAuthConfig } from "./ops/auth";
