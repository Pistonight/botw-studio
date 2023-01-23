import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { Layout } from "react-grid-layout";
import { canLog, appendLog, LoggerLevel, LoggerSource, LoggerSourceEnableMap, LogFunction } from "data/log";
import produce from "immer";
import { useLayoutApi, useMenuApi, useSessionApi, useWidgetApi } from "./api";
import { DefaultConnectionSessionName, DefaultConsoleSessionName, newConnectionDataSession, newConsoleSession, Session, Widget } from "./type";

const getDefaultSessions = () => ({
	[DefaultConsoleSessionName]: newConsoleSession(),
	[DefaultConnectionSessionName]: newConnectionDataSession()
});

const getDefaultWidgets = () => [
	{
		theme: "monokai",
		layout: { x: 0, y: 0, w: 32, h: 24 },
		sessionName: DefaultConnectionSessionName
	},
	{
		theme: undefined,
		layout: { x: 0, y: 24, w: 32, h: 8 },
		sessionName: DefaultConsoleSessionName
	}
];

// The global context api
type AppGlobalApi = {
    // List of session names
    sessionNames: string[],
    // List of sessions
    sessions: Record<string, Session>,
    // Next available names
    nextConsoleSessionName: string,
    nextDataSessionName: string,
    // Log message to all console (-2) sessions
    log: LogFunction,
    // Open a console session. Returns session name
    createConsoleSession: (name: string) => void,
    // Open a JSON session. Returns session name
    createDataSession: (name: string) => void,
    // Close a session and associated widgets
    closeSession: (sessionName: string) => void,
    // Close all sessions and widgets, and open default sessions
    closeAllSessions:() => void,
    // Edit Data
    editData: (sessionName: string, newData: Record<string, unknown>) => void,
    // Edit Console
    setConsoleLogLevel: (sessionName: string, level: LoggerLevel) => void,
    setConsoleLogSource: (sessionName: string, source: LoggerSource, enable: boolean) => void,

    // Widget data for rendering
    widgets: Widget[],
    // Connect a widget to a different session
    setWidgetSession: (widgetId: number, sessionName: string) => void,
    // Split a widget to create a new widget and connect to a session
    splitWidget: (widgetId: number, sessionName: string) => void,
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
    menu: JSX.Element,
    // Open Context Menu on a widget or in empty space
    openMenu: (widgetId: number | undefined, event: React.MouseEvent) => void

}

const AppGlobalApiContext = React.createContext<AppGlobalApi>({} as unknown as AppGlobalApi);
export const AppGlobal: React.FC<PropsWithChildren> = ({children}) => {

	const sessionApi = useSessionApi(getDefaultSessions);
	const widgetApi = useWidgetApi(sessionApi, getDefaultWidgets);
	const layoutApi = useLayoutApi(widgetApi, sessionApi);
    const menuApi = useMenuApi(sessionApi, widgetApi, layoutApi);

	return (
		<AppGlobalApiContext.Provider value={{
			...sessionApi,
			...widgetApi,
			...layoutApi,
            ...menuApi

		}}>
			{children}
		</AppGlobalApiContext.Provider>
	);
};

export const useGlobal = () => useContext(AppGlobalApiContext);