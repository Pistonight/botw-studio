import { LoggerLevel, LoggerSourceEnableMap } from "data/log";
import { Theme } from "react-base16-styling";

// A Session is a connection between the Client and a running module on the Switch
export type Session = {
    // name of the session
    name: string,
    // The unique index of the session. Used to identify the session on the Switch.
    // -1 if not connected to the Switch
    // -2 for console
    // -3 for connection settings
    // -4 for output data
    // -5 for help
    uidx: number,
}

const ConsoleUidx = -2 as const;
const ConnectionUidx = -3 as const;
export const OutputUidx = -4 as const;
const HelpUidx = -5 as const;
export const DefaultConsoleSessionName = "Console 1";
export const DefaultConnectionSessionName = "Connection";
export const ConnectionSessionId = "connection";
export const HelpSessionId = "help";

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

export const newConsoleSession = (name: string): ConsoleSession => {
	return {
        name,
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
export const isOutputSession = (session: Session): session is DataSession & {uidx: typeof OutputUidx} => session && session.uidx === OutputUidx;
export const newDataSession = (name: string): DataSession => {
    return {
        name, 
        uidx: -1,
        obj: {}
    };
}

export const newOutputSession = (name: string): DataSession => {
    return {
        name,
        uidx: OutputUidx,
        obj: {}
    }
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
        name: DefaultConnectionSessionName,
		uidx: ConnectionUidx,
		obj: {
			"SwitchHost": "192.168.0.0",
			"SwitchPort": 65433,
			"Connected": false
		}
	};
};

export const newHelpSession = (): DataSession => {
    return {
        name: "Help",
        uidx: HelpUidx,
        obj: {}
    };
}

// A Widget is a panel in the UI.

export type WidgetView = { x: number, y: number, w: number, h: number };
// string - binding to a session
// type literal - prefer to be binded to that session type
// undefined - need to be binded to any session
export type Widget = {
    // Theme of the widget
    theme: Theme | undefined,
    // Layout of the widget
    layout: WidgetView,
    // The session it's connected to.
    sessionId: string,
}
