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

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/chat/:threadId" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </AppContext.Provider>
    </ThemeProvider>
  );
}

export default App;
