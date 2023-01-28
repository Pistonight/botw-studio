import React, { ReactPortal, useContext } from "react";
import { Layout } from "react-grid-layout";
import { LoggerLevel, LoggerSource, LogFunction } from "data/log";
import { useLayoutApi, useMenuApi, usePromptApi, useServerApi, useSessionApi, useWidgetApi, usePersistSetting } from "./api";
import { ConnectionSessionId, DefaultConsoleSessionName, HelpSessionId, newConnectionDataSession, newConsoleSession, newHelpSession, Session, Widget } from "./type";
import { ModuleId, Packet } from "data/server";
import { getUniqueSessionId } from "data/id";
import { Prompt } from "ui/Prompt";

const Defaults = (() => {
    const consoleId = getUniqueSessionId();
    return {
        sessions: {
            [consoleId]: newConsoleSession(DefaultConsoleSessionName),
            [ConnectionSessionId]: newConnectionDataSession(),
            [HelpSessionId]: newHelpSession()
        },
        widgets: [
            {
                theme: "monokai",
                layout: { x: 0, y: 0, w: 32, h: 24 },
                sessionId: ConnectionSessionId
            },
            {
                theme: undefined,
                layout: { x: 0, y: 24, w: 32, h: 8 },
                sessionId: consoleId
            }
        ]
    }
})();

// The global context api
type AppGlobalApi = {
    // List of session names
    //sessionIds: string[],
    // List of sessions
    sessions: Record<string, Session>,
    // Active output sessions
    activeOutputSessionIds: string[],
    // Log message to all console (-2) sessions
    log: LogFunction,
    // Open a console session. Returns session id
    createConsoleSession: (name: string) => string,
    // Open a JSON session. Returns session id
    createDataSession: (name: string) => string,
    // Can a session be closed.
    canCloseSession: (sessionId: string) => boolean,
    // Close a session and associated widgets
    closeSession: (sessionId: string) => void,
    // Close all sessions and widgets, and open default sessions
    closeAllSessions:() => void,
    // Rename session
    setSessionName: (sessionId: string, newName: string) => void,
    // Edit Data
    editData: (sessionId: string, newData: Record<string, unknown>) => void,
    // Edit Console
    setConsoleLogLevel: (sessionId: string, level: LoggerLevel) => void,
    setConsoleLogSource: (sessionId: string, source: LoggerSource, enable: boolean) => void,
    // Add serial to tracker
    setSerial: (sessionId: string, serialId: number) => void,


    // Widget data for rendering
    widgets: Widget[],
    // Connect a widget to a different session
    setWidgetSession: (widgetId: number, sessionId: string) => void,
    // Split a widget to create a new widget and connect to a session
    splitWidget: (widgetId: number, sessionId: string) => void,
    // Close a widget but keep the session open
    closeWidget: (widgetId: number) => void,
    
    // React-grid-layout layouts for the widgets
    layouts: Layout[],
    // Is in Layout Edit Mode
    isEditingLayout: boolean,
    // Start/End editing layout,
    setEditingLayout: (editing: boolean) => void,
    // Set the layout.
    setLayouts: (layouts: Layout[]) => void

    // The menu
    menu: ReactPortal | null,
    // Open Context Menu on a widget or in empty space
    openMenu: (widgetId: number | undefined, event: React.MouseEvent) => void
    // The prompt
    prompt: ReactPortal | null,
    // Open Prompt for input
    openPrompt: (prompt: string, defaultValue: string, onEnter: (value: string) => void, onCancel?: ()=>void) => void,

    // Interaction with server
    sendPacket: (p: Packet) => void

}

const AppGlobalApiContext = React.createContext<AppGlobalApi>({} as unknown as AppGlobalApi);
export const AppGlobal: React.FC = ({children}) => {
	const sessionApi = useSessionApi(Defaults.sessions);
	const widgetApi = useWidgetApi(sessionApi, Defaults.widgets);
	const layoutApi = useLayoutApi(widgetApi, sessionApi);
    const serverApi = useServerApi(sessionApi);
    const promptApi = usePromptApi(100 /* zIndex */, Prompt);
    const menuApi = useMenuApi(sessionApi, widgetApi, layoutApi, serverApi, promptApi);
    
    usePersistSetting(sessionApi, widgetApi, serverApi);

	return (
		<AppGlobalApiContext.Provider value={{
			...sessionApi,
			...widgetApi,
			...layoutApi,
            ...menuApi,
            ...serverApi,
            ...promptApi
		}}>
			{children}
		</AppGlobalApiContext.Provider>
	);
};

export const useGlobal = () => useContext(AppGlobalApiContext);