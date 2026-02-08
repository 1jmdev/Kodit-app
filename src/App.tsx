import { useEffect, useReducer } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppContext, appReducer, initialState } from "@/store/app-store";
import { AppSidebar } from "@/components/app/AppSidebar";
import { TitleBar } from "@/components/app/TitleBar";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { loadStoredSettings } from "@/lib/settings-storage";
import { DEFAULT_PROVIDER_ID } from "@/lib/ai/providers";
import { fetchProviderModels, validateProviderApiKey } from "@/lib/ai";
import { loadAuthApiKeys } from "@/lib/auth/auth-storage";
import {
  initializeStorage,
  listProjects,
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
        const projects = await listProjects();

        if (cancelled) return;

        dispatch({ type: "SET_PROJECTS", projects });
        if (projects.length > 0) {
          dispatch({ type: "SET_ACTIVE_PROJECT", projectId: projects[0].id });
        }
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
    if (state.projects.length === 0) {
      dispatch({ type: "SET_THREADS", threads: [] });
      return;
    }

    let cancelled = false;

    async function loadAllProjectThreads() {
      try {
        const projectThreadGroups = await Promise.all(
          state.projects.map(async (project) => {
            const threads = await listThreads(project.id);
            return Promise.all(
              threads.map(async (thread) => {
                const messages = await listMessages(thread.id);
                return {
                  ...thread,
                  messages,
                  updatedAt: messages.length > 0 ? messages[messages.length - 1].timestamp : thread.updatedAt,
                };
              }),
            );
          }),
        );

        const hydratedThreads = projectThreadGroups
          .flat()
          .sort((a, b) => b.updatedAt - a.updatedAt);

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

    void loadAllProjectThreads();

    return () => {
      cancelled = true;
    };
  }, [state.projects]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSettings() {
      const stored = loadStoredSettings();
      const authKeys = await loadAuthApiKeys();

      if (cancelled) {
        return;
      }

      const mergedKeys = {
        ...stored.apiKeys,
        ...authKeys,
      };

      for (const [providerId, apiKey] of Object.entries(mergedKeys)) {
        if (apiKey.trim()) {
          dispatch({ type: "SET_PROVIDER_API_KEY", providerId, apiKey: apiKey.trim() });
        }
      }

      if (stored.window) {
        dispatch({ type: "SET_WINDOW_SETTINGS", settings: stored.window });
      }
    }

    void bootstrapSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const activeProviderApiKey = state.settings.apiKeys[DEFAULT_PROVIDER_ID] ?? "";
    const validation = validateProviderApiKey(DEFAULT_PROVIDER_ID, activeProviderApiKey);
    if (!validation.success) {
      return;
    }

    let cancelled = false;

    async function loadModels() {
      dispatch({ type: "SET_MODELS_LOADING", loading: true });
      dispatch({ type: "SET_MODELS_ERROR", error: null });

      try {
        const models = await fetchProviderModels(DEFAULT_PROVIDER_ID, activeProviderApiKey);
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
  }, [state.settings.apiKeys]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppContext.Provider value={{ state, dispatch }}>
        <BrowserRouter>
          <div className="flex h-screen w-screen flex-col overflow-hidden bg-sidebar">
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <AppSidebar />
              
              {/* Main content area with custom title bar shape */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Custom shaped title bar - thin bar flowing to wider controls area */}
                <TitleBar />
                
                {/* Content */}
                <main className="flex flex-1 flex-col overflow-hidden rounded-tl-2xl bg-background">
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
          </div>
        </BrowserRouter>
      </AppContext.Provider>
    </ThemeProvider>
  );
}

export default App;
