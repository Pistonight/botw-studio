import { LoggerLevel, LoggerSourceEnableMap } from "data/log";
import { Theme } from "react-base16-styling";

// A Session is a connection between the Client and a running module on the Switch
export type Session = {
    // The unique index of the session. Used to identify the session on the Switch.
    // -1 if not connected to the Switch, -2 for console, -3 for connection settings
    uidx: number,
}

const ConsoleUidx = -2 as const;

const ConnectionUidx = -3 as const;

export type ConsoleSession = Session & {
    uidx: typeof ConsoleUidx,
    // Text in the console
    data: string,
    // Logger Level
    level: LoggerLevel,
    // Enabled Logger Sources
    enabled: LoggerSourceEnableMap
}

export const isConsoleSession = (session: Session): session is ConsoleSession => session && session.uidx === ConsoleUidx;

export const newConsoleSession = (): ConsoleSession => {
	return {
		uidx: ConsoleUidx,
		data: "Welcome to botw-gametools Client. Right click on a Widget or on empty space to see options\n",
		level: "I",
		enabled: {
			"client": true,
			"switch": true,
			"server": true
		}
	};
};

export type DataSession = Session & {
    // Data object
    obj: Record<string, unknown>
}

export const isDataSession = (session: Session): session is DataSession => session && session.uidx !== ConsoleUidx;

export const newDataSession = (): DataSession => {
    return {
        uidx: -1,
        obj: {}
    };
}

export type ConnectionDataSession = DataSession & {
    uidx: typeof ConnectionUidx,
    obj: {
        "SwitchHost": string,
        "SwitchPort": number,
        "Connected": boolean
    }
}

export const newConnectionDataSession = (): ConnectionDataSession => {
	return {
		uidx: ConnectionUidx,
		obj: {
			"SwitchHost": "192.168.0.0",
			"SwitchPort": 65433,
			"Connected": false
		}
	};
};

// A Widget is a panel in the UI.

export type WidgetView = { x: number, y: number, w: number, h: number };

export type Widget = {
    // Theme of the widget
    theme: Theme | undefined,
    // Layout of the widget
    layout: WidgetView,
    // The session it's connected to
    sessionName: string,
}

export type GlobalContext = {
    // Mapping from session name to session data
    sessions: Record<string, Session>,
    // Mapping from session uidx to session name
    openSessions: string[],
    // Displayed widgets
    widgets: Widget[],
}

export const DefaultConsoleSessionName = "Console 1";
export const DefaultConnectionSessionName = "Connection";