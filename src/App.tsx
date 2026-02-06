import { useReducer } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppContext, appReducer, initialState } from "@/store/app-store";
import { AppSidebar } from "@/components/app/AppSidebar";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
