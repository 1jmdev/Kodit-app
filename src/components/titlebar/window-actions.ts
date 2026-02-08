import { getCurrentWindow } from "@tauri-apps/api/window";

async function runWindowAction(action: (window: ReturnType<typeof getCurrentWindow>) => Promise<void>, errorMessage: string) {
  try {
    const appWindow = getCurrentWindow();
    await action(appWindow);
  } catch (error) {
    console.error(errorMessage, error);
  }
}

export function minimizeWindow() {
  return runWindowAction((window) => window.minimize(), "Failed to minimize window");
}

export function toggleMaximizeWindow() {
  return runWindowAction((window) => window.toggleMaximize(), "Failed to toggle maximize");
}

export function closeWindow() {
  return runWindowAction((window) => window.close(), "Failed to close window");
}
