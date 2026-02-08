import type { Dispatch } from "react";
import type { NavigateFunction } from "react-router-dom";

import {
    getProviderApiKeyHint,
    streamProviderText,
    validateProviderApiKey,
} from "@/lib/ai";
import { clearPendingQuestions } from "@/lib/ai/question-bridge";
import { getProviderPreset } from "@/lib/ai/providers";
import { buildThreadDiffStats } from "@/lib/diff-utils";
import {
    addMessage,
    createProject,
    createThread,
    listDiffs,
} from "@/lib/tauri-storage";
import type { AppAction } from "@/store/app-store";
import type { AppState, Message } from "@/store/types";

import type { PendingProject } from "./types";

interface SubmitPromptParams {
    input: string;
    isGenerating: boolean;
    state: AppState;
    dispatch: Dispatch<AppAction>;
    navigate: NavigateFunction;
    pendingProject?: PendingProject | null;
    onPendingProjectSaved?: () => void;
    setInput: (value: string) => void;
    setIsGenerating: (value: boolean) => void;
}

export async function submitPrompt({
    input,
    isGenerating,
    state,
    dispatch,
    navigate,
    pendingProject,
    onPendingProjectSaved,
    setInput,
    setIsGenerating,
}: SubmitPromptParams): Promise<void> {
    if (!input.trim() || isGenerating) return;

    const userInput = input.trim();
    let activeProjectId = state.activeProjectId;
    let activeWorkspacePath =
        state.projects.find((project) => project.id === activeProjectId)
            ?.workspacePath ?? null;

    if (!activeProjectId && !pendingProject) return;

    const currentThread = state.threads.find(
        (thread) => thread.id === state.activeThreadId,
    );
    const previousMessages: Message[] = currentThread?.messages ?? [];
    setInput("");

    let threadId = state.activeThreadId;
    if (!threadId) {
        if (pendingProject) {
            const project = await createProject({
                name: pendingProject.name,
                workspacePath: pendingProject.workspacePath,
            });
            dispatch({
                type: "SET_PROJECTS",
                projects: [
                    project,
                    ...state.projects.filter((p) => p.id !== project.id),
                ],
            });
            dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id });
            activeProjectId = project.id;
            activeWorkspacePath = project.workspacePath;
            onPendingProjectSaved?.();
        }

        if (!activeProjectId) return;

        const createdThread = await createThread({
            projectId: activeProjectId,
            title:
                userInput.slice(0, 50) + (userInput.length > 50 ? "..." : ""),
        });
        dispatch({ type: "UPSERT_THREAD", thread: createdThread });
        dispatch({ type: "SET_ACTIVE_THREAD", threadId: createdThread.id });
        threadId = createdThread.id;
        navigate(`/chat/${threadId}`);
    }

    if (!threadId) return;

    if (!activeWorkspacePath) {
        const savedAgentMessage = await addMessage({
            threadId,
            role: "agent",
            content:
                "Missing active workspace path. Create or select a project with a valid workspace.",
            mode: "build",
            model: state.selectedModel.id,
            provider: state.selectedModel.provider,
        });
        dispatch({ type: "ADD_MESSAGE", threadId, message: savedAgentMessage });
        return;
    }

    const userMessage = await addMessage({
        threadId,
        role: "user",
        content: userInput,
        mode: "build",
    });
    dispatch({ type: "ADD_MESSAGE", threadId, message: userMessage });

    const assistantMessageId = `temp-agent-${Date.now()}`;
    dispatch({
        type: "ADD_MESSAGE",
        threadId,
        message: {
            id: assistantMessageId,
            role: "agent",
            content: "",
            reasoning: "",
            timestamp: Date.now(),
            isStreaming: true,
            model: state.selectedModel.id,
            provider: state.selectedModel.provider,
            mode: "build",
        },
    });

    const providerId = state.selectedModel.providerId;
    const providerApiKey = state.settings.apiKeys[providerId] ?? "";
    const providerLabel = getProviderPreset(providerId).label;
    const keyValidation = validateProviderApiKey(providerId, providerApiKey);
    if (!keyValidation.success) {
        const savedAgentMessage = await addMessage({
            threadId,
            role: "agent",
            content: `Missing ${providerLabel} key. Open Settings and add your key.\n\n${getProviderApiKeyHint(providerId)}`,
            mode: "build",
            model: state.selectedModel.id,
            provider: state.selectedModel.provider,
            parentId: userMessage.id,
        });
        dispatch({
            type: "REPLACE_MESSAGE",
            threadId,
            messageId: assistantMessageId,
            nextMessage: savedAgentMessage,
        });
        return;
    }

    setIsGenerating(true);
    try {
        let completedEditCount = 0;
        const refreshThreadDiffs = async (targetThreadId: string) => {
            const diffs = await listDiffs(targetThreadId);
            const stats = buildThreadDiffStats(diffs);
            dispatch({
                type: "SET_THREAD_DIFF_STATE",
                threadId: targetThreadId,
                fileChanges: stats.fileChanges,
                totalAdditions: stats.totalAdditions,
                totalDeletions: stats.totalDeletions,
                unstagedCount: stats.unstagedCount,
                stagedCount: stats.stagedCount,
            });
        };

        const streamResult = await streamProviderText({
            providerId,
            apiKey: providerApiKey,
            modelId: state.selectedModel.id,
            messages: [...previousMessages, userMessage],
            workspacePath: activeWorkspacePath,
            threadId,
            initialTodos: currentThread?.todos ?? [],
            onChunk: (chunk) =>
                dispatch({
                    type: "UPDATE_MESSAGE",
                    threadId,
                    messageId: assistantMessageId,
                    content: chunk,
                    isStreaming: true,
                }),
            onReasoning: (reasoning) =>
                dispatch({
                    type: "UPDATE_MESSAGE",
                    threadId,
                    messageId: assistantMessageId,
                    reasoning,
                    isStreaming: true,
                }),
            onTodos: (todos) =>
                dispatch({ type: "SET_THREAD_TODOS", threadId, todos }),
            onToolCalls: (toolCalls) => {
                dispatch({
                    type: "UPDATE_MESSAGE",
                    threadId,
                    messageId: assistantMessageId,
                    toolCalls,
                    isStreaming: true,
                });
                const nextCompleted = toolCalls.filter(
                    (toolCall) =>
                        toolCall.status === "completed" &&
                        toolCall.name.startsWith("Edited "),
                ).length;
                if (nextCompleted > completedEditCount) {
                    completedEditCount = nextCompleted;
                    void refreshThreadDiffs(threadId);
                }
            },
        });

        const savedAgentMessage = await addMessage({
            threadId,
            role: "agent",
            content: streamResult.text || "No response received from model.",
            reasoning: streamResult.reasoning,
            toolCalls: streamResult.toolCalls,
            todos: streamResult.todos,
            mode: "build",
            model: state.selectedModel.id,
            provider: state.selectedModel.provider,
            parentId: userMessage.id,
        });

        dispatch({
            type: "SET_THREAD_TODOS",
            threadId,
            todos: streamResult.todos,
        });
        dispatch({
            type: "REPLACE_MESSAGE",
            threadId,
            messageId: assistantMessageId,
            nextMessage: savedAgentMessage,
        });
        await refreshThreadDiffs(threadId);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Failed to stream response.";
        const savedAgentMessage = await addMessage({
            threadId,
            role: "agent",
            content: `Error: ${message}`,
            mode: "build",
            model: state.selectedModel.id,
            provider: state.selectedModel.provider,
            parentId: userMessage.id,
        });
        dispatch({
            type: "REPLACE_MESSAGE",
            threadId,
            messageId: assistantMessageId,
            nextMessage: savedAgentMessage,
        });
    } finally {
        setIsGenerating(false);
        clearPendingQuestions();
    }
}
