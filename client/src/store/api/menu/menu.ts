import { getNextSerialId } from "data/id";
import { useContextMenu, MenuData } from "data/opensource";
import { ActivateModuleRequestPacket, DeactivateModulePacket, Modules } from "data/server";
import { ThemeOptions } from "data/theme";
import { useCallback, useMemo } from "react";
import { ConnectionSessionId, DataSession, HelpSessionId, isConsoleSession, isDataSession, isOutputSession, Session, Widget } from "store/type";
import { LayoutApi } from "../layout";
import { PromptApi } from "../prompt";
import { ServerApi } from "../server";
import { SessionApi } from "../session";
import { WidgetApi } from "../widget";
import { MenuItem, MenuItemProps } from "./MenuItem";
import { Separator } from "./Separator";



const createMenu = (
	widgetId: number | undefined,
	sessionApi: SessionApi,
	widgetApi: WidgetApi,
	layoutApi: LayoutApi,
	serverApi: ServerApi,
	promptApi: PromptApi
) => {
	const menu: MenuData<MenuItemProps>[] = [];
	const {widgets} = widgetApi;
	// TODO: add widget specific actions

	if(widgetId !== undefined){
		addConsoleMenuOptions(menu, widgetId, sessionApi, widgetApi);
		addDataMenuOptions(menu, widgetId, sessionApi, widgetApi, serverApi);
		addSessionMenuOptions(menu, widgetId, sessionApi, widgetApi, promptApi);
	}
	menu.push("separator");
	if(widgetId !== undefined){
		addThemeSubMenu(menu, widgetId, widgetApi);
	}
	
	addEditingLayoutOption(menu, layoutApi);
	menu.push("separator");
	addGlobalMenuOptions(menu, widgetId, widgetApi);
	return menu;
}

const getDataSessionHelper = (sessions: Record<string, Session>, sessionId: string, activeOutputSessionIds: string[]) => {
	const session = sessions[sessionId];
	
	if(isOutputSession(session)){
		for(let i=0;i<activeOutputSessionIds.length;i++){
			// find the remote session id
			if(activeOutputSessionIds[i] === sessionId){
				// find the data session that has the remote id
				for (const dataSessionId in sessions){
					const dataSession = sessions[dataSessionId];
					if(dataSession.uidx === i){
						return dataSession;
					}
				}
			}
		}
		return undefined;
	}

	return session;
}

const addDataMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	sessions,
	log,
	setSerial,
	activeOutputSessionIds
}: SessionApi, {
	widgets
}: WidgetApi, {
	sendPacket
}: ServerApi) => {
	const sessionId = widgets[widgetId].sessionId;
	if (sessionId === ConnectionSessionId){
		return;
	}
	if (sessionId === HelpSessionId){
		return;
	}
	const session = getDataSessionHelper(sessions, sessionId, activeOutputSessionIds);

	if(!session || !isDataSession(session)){
		return;
	}

	if (session.uidx < 0) {
		// unactivated session
		menu.push([
			"Activate",
			()=>{
				if (!("Module" in session.obj)) {
					log("E", "client", "Please specify the Module");
					return;
				}
				const serial = getNextSerialId();
				const module: string = session.obj.Module as string ?? "";
				if (!(module in Modules)) {
					log("E", "client", `"${module}" is not a valid module name. Please see documentation`);
					return;
				}
				const packet = new ActivateModuleRequestPacket(
					serial,
					Modules[module as keyof typeof Modules],
					session.obj
				);
				log("I", "client", `Activating module ${module}...`);
				setSerial(sessionId, serial);
				sendPacket(packet);
			},
			"Activate a module",
			{}
		]);
	}else{
		menu.push([
			"Deactivate",
			() => {
				log("I", "client", `Deactivating remote session ${session.uidx}...`);
				sendPacket(new DeactivateModulePacket(session.uidx));
			},
			"Deactivate this module",
			{}
		])
	}

	menu.push("separator");
	
}

const addConsoleMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	sessions,
	setConsoleLogLevel,
	setConsoleLogSource
}: SessionApi, {
	widgets
}: WidgetApi) => {
	const sessionId = widgets[widgetId].sessionId;
	const session = sessions[sessionId];
	if (!isConsoleSession(session)){
		return;
	}
	menu.push(
		[
			"Level", 
			[
				[
					"Debug",
					() => setConsoleLogLevel(sessionId, "D"),
					"Log debug, info, warn, and error messages",
					{ checked: session.level === "D" }
				],[
					"Info",
					() => setConsoleLogLevel(sessionId, "I"),
					"Log info, warn, and error messages",
					{ checked: session.level === "I" }
				],[
					"Warn",
					() => setConsoleLogLevel(sessionId, "W"),
					"Log warn and error messages",
					{ checked: session.level === "W" }
				],[
					"Error",
					() => setConsoleLogLevel(sessionId, "E"),
					"Log only error messages",
					{ checked: session.level === "E" }
				]
			],
			{}
		],
		[
			"Source",
			[
				[
					"Client",
					() => setConsoleLogSource(sessionId, "client", !session.enabled.client),
					"Log messages from client",
					{ checked: session.enabled.client }
				],[
					"Server",
					() => setConsoleLogSource(sessionId, "server", !session.enabled.client),
					"Log messages from internal server",
					{ checked: session.enabled.server }
				],[
					"Switch",
					() => setConsoleLogSource(sessionId, "switch", !session.enabled.client),
					"Log messages from game server running on switch",
					{ checked: session.enabled.switch }
				]
			],
			{}
		],
		"separator"
	);
}

const addSessionMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	sessions,
	createConsoleSession,
	createDataSession,
	closeSession,
	canCloseSession,
	setSessionName,
}: SessionApi, {
	widgets,
	setWidgetSession,
	splitWidget,
	closeWidget
}: WidgetApi, {
	openPrompt
}: PromptApi) => {
	const sortedNameIds = Object.keys(sessions).map(id=>{
		return [sessions[id].name, id];
	});
	sortedNameIds.sort((a, b)=>a[0].localeCompare(b[0]));
	const openOptions: MenuData<MenuItemProps>[] = sortedNameIds.map(([sessionName, sessionId]) => {
		return [
			sessionName,
			() => setWidgetSession(widgetId, sessionId),
			`Switch to "${sessionName}" Session`,
			{ checked: widgets[widgetId].sessionId === sessionId }
		]
	});
	const splitOptions: MenuData<MenuItemProps>[] = sortedNameIds.map(([sessionName, sessionId]) => {
		return [
			sessionName,
			() => splitWidget(widgetId, sessionId),
			`Split and open "${sessionName}" Session`,
			{}
		]
	});
	const canCloseWidget = widgets.length > 1;
	const canCloseSessionFlag = canCloseSession(widgets[widgetId].sessionId);
	menu.push(
		[
			"Open",
			[
				...openOptions,
				"separator",
				[
					"New Console Session",
					() => {
						const id = createConsoleSession("New Console");
						setWidgetSession(widgetId, id);
					},
					"Create a new Console Session",
					{}
				],[
					"New Data Session",
					() => {
						const id = createDataSession("New Data");
						setWidgetSession(widgetId, id)
					},
					"Create a new Data Session for communicating with the server",
					{}
				]
			],
			{}
		],[
			"Split",
			[
				...splitOptions,
				"separator",
				[
					"New Console Session",
					() => {
						const id = createConsoleSession("New Console");
						splitWidget(widgetId, id);
					},
					"Create a new Console Session",
					{}
				],[
					"New Data Session",
					() => {
						const id = createDataSession("New Data");
						splitWidget(widgetId, id)
					},
					"Create a new Data Session for communicating with the server",
					{}
				]
			],
			{}
		],
		[
			"Rename...",
			() => {
				const sessionId = widgets[widgetId].sessionId;
				openPrompt(
					"Enter a new name",
					sessions[sessionId].name,
					(newName) => {
						setSessionName(sessionId, newName);
					}
				);				
			},
			"Rename the Session",
			{}
		],
		[
			"Close Widget",
			canCloseWidget ? () => closeWidget(widgetId) : undefined,
			canCloseWidget
				? "Close this Widget but keep the Session open so you may access it from another widget"
				: "Cannot close the last widget",
			{}
		],[
			"Close Session",
			(canCloseWidget && canCloseSessionFlag) ? () => closeSession(widgets[widgetId].sessionId) : undefined,
			canCloseWidget
				? (canCloseSessionFlag
						? "Close the Session and all Widgets connected to it. Also cleans up related resources on the Server"
						: "Cannot close this session. Built-in and activated sessions cannot be closed")
				: "Cannot close the last widget",
			{}
		]
	);
	
}

const addThemeSubMenu = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	widgets,
	setWidgetTheme
}: WidgetApi) => {
	menu.push([
		"Theme",
		ThemeOptions.map(([displayName, themeName])=>{
			return [
				displayName,
				() => setWidgetTheme(widgetId, themeName),
				undefined,
				{ checked: widgets[widgetId].theme === themeName}
			]
		}),
		{}
	]);
}

const addEditingLayoutOption = (menu: MenuData<MenuItemProps>[], {
	isEditingLayout,
	setEditingLayout
}: LayoutApi) => {
	menu.push([
		isEditingLayout ? "Save Layout" : "Edit Layout",
		() => setEditingLayout(!isEditingLayout),
		isEditingLayout ? "Quit editing layout" : "Change layout by resizing and dragging widgets",
		{}
	]);
}

const addGlobalMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number | undefined, {
	splitWidget
}: WidgetApi) => {
	if (widgetId === undefined){
		return;
	}
	menu.push(
		// [
		// 	"Connect to Switch",
		// 	undefined,
		// 	"Connect to the game running botw-gametools server",
		// 	{}
		// ],

		[
			"Help",
			() => splitWidget(widgetId, HelpSessionId),
			"Open documentation",
			{}
		]
	)
}

const MenuSetting = {
	submenuSymbol: "\u25b8",
	renderer: MenuItem,
	separator: Separator
}

export const useMenuApi = (
	sessionApi: SessionApi,
	widgetApi: WidgetApi,
	layoutApi: LayoutApi,
	serverApi: ServerApi,
	promptApi: PromptApi
) => {
    const [menu, createHandler] = useContextMenu(MenuSetting);


    const openMenu = useCallback((widgetId: number | undefined, event: React.MouseEvent) => {
		createHandler(createMenu(widgetId, sessionApi, widgetApi, layoutApi, serverApi, promptApi))(event);
    }, [createHandler, sessionApi, widgetApi, layoutApi, serverApi, promptApi]);

	return useMemo(()=>({
		menu,
		openMenu
	}), [
		menu,
		openMenu
	]);
};