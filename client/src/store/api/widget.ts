import produce from "immer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DefaultConsoleSessionName, Widget, WidgetView } from "store/type";
import { SessionApi } from "./session";

const splitView = (view: WidgetView): [WidgetView, WidgetView] => {
	const splitLeftRight = view.w > view.h;
	const newW = splitLeftRight ? Math.floor(view.w/2) : view.w;
	const newH = splitLeftRight ? view.h : Math.floor(view.h/2);
	return [
		{
			x: view.x,
			y: view.y,
			w: newW,
			h: newH
		},{
			x: splitLeftRight ? view.x + newW : view.x,
			y: splitLeftRight ? view.y : view.y + newH,
			w: splitLeftRight ? view.w - newW : view.w,
			h: splitLeftRight ? view.h : view.h - newH
		}
	];
};



export const useWidgetApi = ({
	log,
	sessionNames,
}: SessionApi, getDefaultWidgets: ()=>Widget[]) => {
	const [widgets, setWidgets] = useState<Widget[]>(getDefaultWidgets);
	useEffect(() => {
		if (widgets.length === 0) {
			setWidgets([{
				theme: undefined,
				layout: { x: 0, y: 0, w: 32, h: 32 },
				sessionName: DefaultConsoleSessionName
			}]);
			log("W", "client", "You have closed all Widgets. The default Console is opened automatically so you can keep using the app.");
		}
	}, [widgets, log])

	// Close widgets that are binded to expired sessions
	useEffect(()=>{
		
		const names = new Set(sessionNames);
		if (widgets.find(widget=>!names.has(widget.sessionName))){
			setWidgets((prevWidgets)=>{
				return prevWidgets.filter((widget, i)=>{
					if (names.has(widget.sessionName)){
						return true;
					}
					log("I", "client", `Closing Widget ${i} with expired Session "${widget.sessionName}"`);
					return false;
				});
			})
		}
	}, [widgets, sessionNames, log]);

	const setWidgetSession = useCallback((widgetId: number, sessionName: string) => {
		setWidgets(produce(draft=>{
			if(draft[widgetId] === undefined){
				log("E", "client", `Cannot set session: invalid widget id ${widgetId}`);
				return;
			}
			log("I", "client", `Binding Widget ${widgetId} to Session "${sessionName}"`);
			draft[widgetId].sessionName = sessionName;
		}));
	}, [log]);

	const setWidgetTheme = useCallback((widgetId: number, theme: string | undefined) => {
		setWidgets(produce(draft=>{
			if(draft[widgetId] === undefined){
				log("E", "client", `Cannot set session: invalid widget id ${widgetId}`);
				return;
			}
			draft[widgetId].theme = theme;
			log("D", "client", `Setting Widget ${widgetId} theme = "${theme}"`);
		}));
	}, [log]);

	const splitWidget = useCallback((widgetId: number, sessionName: string) => {
		setWidgets(produce(draft=>{
			if(draft[widgetId] === undefined){
				log("E", "client", `Cannot split widget: invalid widget id ${widgetId}`);
				return;
			}
			const [newLayout1, newLayout2] = splitView(draft[widgetId].layout);
			const newWidget = {
				theme: draft[widgetId].theme,
				layout: newLayout2,
				sessionName,
			};
			draft[widgetId].layout = newLayout1;
			draft.push(newWidget);
		}));

	}, [log]);

	const closeWidget = useCallback((widgetId: number) => {
		setWidgets(produce(draft=>{
			if(draft[widgetId] === undefined){
				log("E", "client", `Cannot close widget: invalid widget id ${widgetId}`);
				return;
			}
			log("I", "client", `Closing Widget ${widgetId}`);
			draft.splice(widgetId, 1);
		}));
	}, [log]);

	return useMemo(()=>({
		widgets,
		setWidgets,
		setWidgetSession,
		setWidgetTheme,
		splitWidget,
		closeWidget
	}), [
		widgets,
		setWidgets,
		setWidgetSession,
		setWidgetTheme,
		splitWidget,
		closeWidget
	]);
};

export type WidgetApi = Readonly<ReturnType<typeof useWidgetApi>>;