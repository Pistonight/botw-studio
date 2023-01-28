import { useCallback, useMemo } from "react";
import { Base16Theme, Theme } from "react-base16-styling";
import { useGlobal } from "store/AppGlobal";
import { HelpSessionId, isConsoleSession, isDataSession, isOutputSession, Session, Widget } from "store/type";
import { Loading } from "./Loading";
import { getWidgetStylePropsFromTheme, isDarkTheme } from "../data/theme";
import clsx from "clsx";
import { Console } from "./Console";
import "./Widget.css";
import { DataViewer } from "./DataViewer";
import React from "react";
import { Browser } from "./Browser";

export type WidgetProps = {
    widgetId: number
};

export const WidgetViewer: React.FC<WidgetProps> = ({widgetId}) => {
	const { sessions, widgets, editData, openMenu, activeOutputSessionIds } = useGlobal();
	const widget = widgets[widgetId];
	const { theme, sessionId } = widget;

	const setData = useCallback((newData: Record<string, unknown>) => {
		editData(sessionId, newData);
	}, [sessionId]);

	const session = sessions[sessionId];
	const dark = isDarkTheme(theme);
	let content: JSX.Element;
	let sessionClass = "";
	if (!session) {
		content = <Loading theme={theme} title={sessionId+" (Invalid Session)"}/>;
	} else if (isConsoleSession(session)) {
		content = <Console content={session.data} theme={theme} />;
		sessionClass = "console-session";
	} else if (isDataSession(session)) {
		if(isOutputSession(session) && !activeOutputSessionIds.includes(sessionId)){
			content = <Loading theme={theme} title={session.name}/>;
		}else if (sessionId === HelpSessionId){
			content = <Browser url="https://botw-studio.itntpiston.app" theme={theme} widgetId={widgetId}/>;
		}else{
			content = (
				<DataViewer
					data={session.obj}
					theme={theme}
					rootName={session.name}
					isReadonly={isOutputSession(session)}
					setData={setData}
				/>
			);
			sessionClass = "data-session";
		}
		
	} else {
		content = <Loading theme={theme} title={session.name+" (Unknown Session Type)"}/>;
	}
	const styleProps = useMemo(()=>getWidgetStylePropsFromTheme(theme), [theme]);

	return (
		<div className={clsx("widget-content", dark ? "dark-color" : "light-color", sessionClass)} {...styleProps} onContextMenu={(e)=>{
			openMenu(widgetId, e);
		}}>
			{content}            
		</div>
	);
    
};
