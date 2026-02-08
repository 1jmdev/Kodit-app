import { createContext, useContext } from "react";
import type { AppState } from "../../types";
import type { AppAction } from "../core/action";
import { initialState } from "../core/state";

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType>({
    state: initialState,
    dispatch: () => {},
});

export function useAppStore() {
    return useContext(AppContext);
}
