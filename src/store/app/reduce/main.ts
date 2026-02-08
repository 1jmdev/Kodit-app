import type { AppState } from "../../types";
import type { AppAction } from "../core/action";
import { appReducer2 } from "./ui";

export function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case "SET_STORAGE_LOADING":
            return { ...state, storageLoading: action.loading };
        case "SET_STORAGE_ERROR":
            return { ...state, storageError: action.error };
        case "SET_PROJECTS":
            return { ...state, projects: action.projects };
        case "SET_THREADS":
            return { ...state, threads: action.threads };
        case "SET_THREAD_MESSAGES":
            return {
                ...state,
                threads: state.threads.map((thread) =>
                    thread.id === action.threadId
                        ? {
                              ...thread,
                              messages: action.messages,
                              updatedAt:
                                  action.messages.length > 0
                                      ? action.messages[action.messages.length - 1].timestamp
                                      : thread.updatedAt,
                          }
                        : thread,
                ),
            };
        case "SET_THREAD_DIFF_STATE":
            return {
                ...state,
                threads: state.threads.map((thread) =>
                    thread.id === action.threadId
                        ? {
                              ...thread,
                              fileChanges: action.fileChanges,
                              totalAdditions: action.totalAdditions,
                              totalDeletions: action.totalDeletions,
                              unstagedCount: action.unstagedCount,
                              stagedCount: action.stagedCount,
                          }
                        : thread,
                ),
            };
        case "UPSERT_THREAD": {
            const existing = state.threads.find((t) => t.id === action.thread.id);
            if (!existing) return { ...state, threads: [action.thread, ...state.threads] };
            return {
                ...state,
                threads: state.threads.map((thread) =>
                    thread.id === action.thread.id ? action.thread : thread,
                ),
            };
        }
        case "REPLACE_MESSAGE":
            return {
                ...state,
                threads: state.threads.map((thread) =>
                    thread.id === action.threadId
                        ? {
                              ...thread,
                              messages: thread.messages.map((message) =>
                                  message.id === action.messageId
                                      ? {
                                            ...action.nextMessage,
                                            toolCalls:
                                                action.nextMessage.toolCalls ??
                                                message.toolCalls,
                                        }
                                      : message,
                              ),
                              updatedAt: action.nextMessage.timestamp,
                          }
                        : thread,
                ),
            };
        case "SET_ACTIVE_THREAD":
            return { ...state, activeThreadId: action.threadId };
        case "DELETE_THREAD":
            return {
                ...state,
                threads: state.threads.filter((t) => t.id !== action.threadId),
                activeThreadId:
                    state.activeThreadId === action.threadId ? null : state.activeThreadId,
            };
        case "ADD_MESSAGE":
            return {
                ...state,
                threads: state.threads.map((t) =>
                    t.id === action.threadId
                        ? {
                              ...t,
                              messages: [...t.messages, action.message],
                              updatedAt: action.message.timestamp,
                          }
                        : t,
                ),
            };
        case "SET_THREAD_TODOS":
            return {
                ...state,
                threads: state.threads.map((t) =>
                    t.id === action.threadId ? { ...t, todos: action.todos } : t,
                ),
            };
        case "UPDATE_MESSAGE":
            return {
                ...state,
                threads: state.threads.map((t) =>
                    t.id === action.threadId
                        ? {
                              ...t,
                              messages: t.messages.map((m) =>
                                  m.id === action.messageId
                                      ? {
                                            ...m,
                                            content: action.content ?? m.content,
                                            reasoning: action.reasoning ?? m.reasoning,
                                            isStreaming: action.isStreaming ?? m.isStreaming,
                                            toolCalls: action.toolCalls ?? m.toolCalls,
                                            todos: action.todos ?? m.todos,
                                            questions: action.questions ?? m.questions,
                                        }
                                      : m,
                              ),
                          }
                        : t,
                ),
            };
        default:
            return appReducer2(state, action);
    }
}
