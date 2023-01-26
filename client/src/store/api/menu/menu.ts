import { useContextMenu, MenuData } from "data/opensource";
import { ThemeOptions } from "data/theme";
import { useCallback, useMemo } from "react";
import { isConsoleSession, Widget } from "store/type";
import { LayoutApi } from "../layout";
import { SessionApi } from "../session";
import { WidgetApi } from "../widget";
import { MenuItem, MenuItemProps } from "./MenuItem";
import { Separator } from "./Separator";



const createMenu = (widgetId: number | undefined, sessionApi: SessionApi, widgetApi: WidgetApi, layoutApi: LayoutApi) => {
	const menu: MenuData<MenuItemProps>[] = [];
	const {widgets} = widgetApi;
	// TODO: add widget specific actions

	if(widgetId !== undefined){
		addConsoleMenuOptions(menu, widgetId, sessionApi, widgetApi);
		addSessionMenuOptions(menu, widgetId, sessionApi, widgetApi);
	}
	menu.push("separator");
	if(widgetId !== undefined){
		addThemeSubMenu(menu, widgetId, widgetApi);
	}
	
	addEditingLayoutOption(menu, layoutApi);
	menu.push("separator");
	addGlobalMenuOptions(menu);
	return menu;
}

const addConsoleMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	sessions,
	setConsoleLogLevel,
	setConsoleLogSource
}: SessionApi, {
	widgets
}: WidgetApi) => {
	const sessionName = widgets[widgetId].sessionName;
	const session = sessions[sessionName];
	if (!isConsoleSession(session)){
		return;
	}
	menu.push(
		[
			"Level", 
			[
				[
					"Debug",
					() => setConsoleLogLevel(sessionName, "D"),
					"Log debug, info, warn, and error messages",
					{ checked: session.level === "D" }
				],[
					"Info",
					() => setConsoleLogLevel(sessionName, "I"),
					"Log info, warn, and error messages",
					{ checked: session.level === "I" }
				],[
					"Warn",
					() => setConsoleLogLevel(sessionName, "W"),
					"Log warn and error messages",
					{ checked: session.level === "W" }
				],[
					"Error",
					() => setConsoleLogLevel(sessionName, "E"),
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
					() => setConsoleLogSource(sessionName, "client", !session.enabled.client),
					"Log messages from client",
					{ checked: session.enabled.client }
				],[
					"Server",
					() => setConsoleLogSource(sessionName, "server", !session.enabled.client),
					"Log messages from internal server",
					{ checked: session.enabled.server }
				],[
					"Switch",
					() => setConsoleLogSource(sessionName, "switch", !session.enabled.client),
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
	sessionNames,
	createConsoleSession,
	createDataSession,
	nextConsoleSessionName,
	nextDataSessionName,
	closeSession,
	canCloseSession,
}: SessionApi, {
	widgets,
	setWidgetSession,
	splitWidget,
	closeWidget
}: WidgetApi) => {
	const openOptions: MenuData<MenuItemProps>[] = sessionNames.map(sessionName => {
		return [
			sessionName,
			() => setWidgetSession(widgetId, sessionName),
			`Switch to "${sessionName}" Session`,
			{ checked: widgets[widgetId].sessionName === sessionName }
		]
	})
	const splitOptions: MenuData<MenuItemProps>[] = sessionNames.map(sessionName => {
		return [
			sessionName,
			() => splitWidget(widgetId, sessionName),
			`Split and open "${sessionName}" Session`,
			{}
		]
	})
	menu.push(
		[
			"Open",
			[
				...openOptions,
				"separator",
				[
					"New Console Session",
					() => {
						createConsoleSession(nextConsoleSessionName);
						setWidgetSession(widgetId, nextConsoleSessionName);
					},
					"Create a new Console Session",
					{}
				],[
					"New Data Session",
					() => {
						createDataSession(nextDataSessionName);
						setWidgetSession(widgetId, nextDataSessionName)
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
						createConsoleSession(nextConsoleSessionName);
						splitWidget(widgetId, nextConsoleSessionName);
					},
					"Create a new Console Session",
					{}
				],[
					"New Data Session",
					() => {
						createDataSession(nextDataSessionName);
						splitWidget(widgetId, nextDataSessionName)
					},
					"Create a new Data Session for communicating with the server",
					{}
				]
			],
			{}
		],
		[
			"Close Widget",
			() => closeWidget(widgetId),
			"Close this Widget but keep the Session open so you may access it from another widget",
			{}
		],[
			"Close Session",
			canCloseSession(widgets[widgetId].sessionName) ? () => closeSession(widgets[widgetId].sessionName) : undefined,
			"Close the Session and all Widgets connected to it. Also cleans up related resources on the Server",
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

const addGlobalMenuOptions = (menu: MenuData<MenuItemProps>[]) => {
	menu.push(
		// [
		// 	"Connect to Switch",
		// 	undefined,
		// 	"Connect to the game running botw-gametools server",
		// 	{}
		// ],

		[
			"Help...",
			() => console.log(),
			"Open project wiki",
			{}
		]
	)
}

const MenuSetting = {
	submenuSymbol: "\u25b8",
	renderer: MenuItem,
	separator: Separator
}

export const useMenuApi = (sessionApi: SessionApi, widgetApi: WidgetApi, layoutApi: LayoutApi) => {
    const [menu, createHandler] = useContextMenu(MenuSetting);


    const openMenu = useCallback((widgetId: number | undefined, event: React.MouseEvent) => {
		createHandler(createMenu(widgetId, sessionApi, widgetApi, layoutApi))(event);
    }, [createHandler, sessionApi, widgetApi, layoutApi]);

	return useMemo(()=>({
		menu,
		openMenu
	}), [
		menu,
		openMenu
	]);
};