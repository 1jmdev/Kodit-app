import { useEffect, useReducer } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppContext, appReducer, initialState } from "@/store/app-store";
import { AppSidebar } from "@/components/app/AppSidebar";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { loadStoredSettings } from "@/lib/settings-storage";
import { fetchOpenRouterModels, validateOpenRouterApiKey } from "@/lib/openrouter";
import {
  initializeStorage,
  listProjects,
  createDefaultProjectIfNeeded,
  listThreads,
  listMessages,
} from "@/lib/tauri-storage";

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapStorage() {
      dispatch({ type: "SET_STORAGE_LOADING", loading: true });
      dispatch({ type: "SET_STORAGE_ERROR", error: null });

      try {
        await initializeStorage();
        let projects = await listProjects();

        if (projects.length === 0) {
          const defaultProject = await createDefaultProjectIfNeeded();
          projects = [defaultProject];
        }

        if (cancelled) return;

        dispatch({ type: "SET_PROJECTS", projects });
        dispatch({ type: "SET_ACTIVE_PROJECT", projectId: projects[0].id });
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to initialize storage";
          dispatch({ type: "SET_STORAGE_ERROR", error: message });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "SET_STORAGE_LOADING", loading: false });
        }
      }
    }

    void bootstrapStorage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const activeProjectId = state.activeProjectId;
    if (!activeProjectId) {
      dispatch({ type: "SET_THREADS", threads: [] });
      return;
    }

    let cancelled = false;

    async function loadProjectThreads() {
      try {
        const projectThreads = await listThreads(activeProjectId!);
        const hydratedThreads = await Promise.all(
          projectThreads.map(async (thread) => {
            const messages = await listMessages(thread.id);
            return {
              ...thread,
              messages,
              updatedAt: messages.length > 0 ? messages[messages.length - 1].timestamp : thread.updatedAt,
            };
          }),
        );

        if (!cancelled) {
          dispatch({ type: "SET_THREADS", threads: hydratedThreads });
          if (
            state.activeThreadId &&
            !hydratedThreads.some((thread) => thread.id === state.activeThreadId)
          ) {
            dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load threads";
          dispatch({ type: "SET_STORAGE_ERROR", error: message });
        }
      }
    }

    void loadProjectThreads();

    return () => {
      cancelled = true;
    };
  }, [state.activeProjectId]);

  useEffect(() => {
    const stored = loadStoredSettings();
    if (stored.openRouterApiKey) {
      dispatch({ type: "SET_OPENROUTER_API_KEY", apiKey: stored.openRouterApiKey });
    }
  }, []);

  useEffect(() => {
    const validation = validateOpenRouterApiKey(state.settings.openRouterApiKey);
    if (!validation.success) {
      return;
    }

    let cancelled = false;

    async function loadModels() {
      dispatch({ type: "SET_MODELS_LOADING", loading: true });
      dispatch({ type: "SET_MODELS_ERROR", error: null });

      try {
        const models = await fetchOpenRouterModels(state.settings.openRouterApiKey);
        if (!cancelled) {
          dispatch({ type: "SET_AVAILABLE_MODELS", models });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load models";
          dispatch({ type: "SET_MODELS_ERROR", error: message });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "SET_MODELS_LOADING", loading: false });
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [state.settings.openRouterApiKey]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppContext.Provider value={{ state, dispatch }}>
        <BrowserRouter>
          <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className="flex flex-1 flex-col overflow-hidden">
                {state.storageLoading ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Loading workspace...
                  </div>
                ) : (
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chat/:threadId" element={<ChatPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                )}
              </main>
            </div>
          </div>
        </BrowserRouter>
      </AppContext.Provider>
    </ThemeProvider>
  );
}

export default App;
