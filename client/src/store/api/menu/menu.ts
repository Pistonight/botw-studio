import { useContextMenu, MenuData } from "data/opensource";
import { useCallback } from "react";
import { Widget } from "store/type";
import { LayoutApi } from "../layout";
import { canCloseSession, SessionApi } from "../session";
import { WidgetApi } from "../widget";
import { MenuItem, MenuItemProps } from "./MenuItem";
import { Separator } from "./Separator";

const ThemeOptions = [
	["Default", undefined],
	["Monokai", "monokai"],
	["Ocean", "ocean"],
	["Solarized", "solarized"],
	["Mocha", "mocha"],
	["Green", "green"],
	["Bright", "bright:inverted"]
] as const;

const createMenu = (widgetId: number | undefined, sessionApi: SessionApi, widgetApi: WidgetApi, layoutApi: LayoutApi) => {
	const menu: MenuData<MenuItemProps>[] = [];
	const {widgets} = widgetApi;
	// TODO: add widget specific actions
	if(widgetId !== undefined){
		createSessionMenuOptions(menu, widgetId, sessionApi, widgetApi);
	}
	menu.push("separator");
	if(widgetId !== undefined){
		createThemeSubMenu(menu, widgetId, widgetApi);
	}
	
	addEditingLayoutOption(menu, layoutApi);
	menu.push("separator");
	addGlobalMenuOptions(menu);
	return menu;
}

const createSessionMenuOptions = (menu: MenuData<MenuItemProps>[], widgetId: number, {
	sessionNames,
	createConsoleSession,
	createDataSession,
	nextConsoleSessionName,
	nextDataSessionName,
	closeSession,
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

const createThemeSubMenu = (menu: MenuData<MenuItemProps>[], widgetId: number, {
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
        const menuConfig: MenuData<MenuItemProps>[] = [
			["Refresh", () => console.log(), "", {}],
			["Deactivate", () => console.log(), "", {}],
			"separator",// ,
			

			


			
			
		];

		createHandler(createMenu(widgetId, sessionApi, widgetApi, layoutApi))(event);
    }, [createHandler, sessionApi, widgetApi, layoutApi]);

	return {
		menu,
		openMenu
	}
};