import produce from "immer";
import { useCallback, useEffect, useState } from "react";
import { Widget, WidgetView } from "store/type";
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
}

export const useWidgetApi = ({
    log,
    createConsoleSession,
    createDataSession,
    sessionNames
}: SessionApi, getDefaultWidgets: ()=>Widget[]) => {
    const [widgets, setWidgets] = useState<Widget[]>(getDefaultWidgets);

    // Close widgets that are binded to expired sessions
    useEffect(()=>{
        const names = new Set(sessionNames);
        if (widgets.find(widget=>!names.has(widget.sessionName))){
            setWidgets(widgets.filter((widget, i)=>{
                if (names.has(widget.sessionName)){
                    return true;
                }
                log("I", "client", `Closing Widget ${i} with expired Session "${widget.sessionName}"`);
                return false;
            }));
        }
    }, [widgets, sessionNames, log])

    const setWidgetSession = useCallback((widgetId: number, sessionName: string) => {
        if(widgets[widgetId] === undefined){
            log("E", "client", `Cannot set session: invalid widget id ${widgetId}`);
            return;
        }
        setWidgets(produce(widgets, draft=>{
            draft[widgetId].sessionName = sessionName;
        }));
        log("I", "client", `Bind Widget ${widgetId} to Session "${sessionName}"`);
    }, [widgets, log]);

    const splitWidgetForNewConsole = useCallback((widgetId: number) => {
        if(widgets[widgetId] === undefined){
            log("E", "client", `Cannot split widget: invalid widget id ${widgetId}`);
            return;
        }
        const sessionName = createConsoleSession();
        const [newLayout1, newLayout2] = splitView(widgets[widgetId].layout);
        const newWidget = {
            theme: widgets[widgetId].theme,
            layout: newLayout2,
            sessionName
        }
        setWidgets(produce(widgets, draft=>{
            draft[widgetId].layout = newLayout1;
            draft.push(newWidget);
        }));
        log("I", "client", `New Widget binded to Console Session "${sessionName}"`);

    }, [widgets, log, createConsoleSession]);

    const splitWidgetForNewData = useCallback((widgetId: number) => {
        if(widgets[widgetId] === undefined){
            log("E", "client", `Cannot split widget: invalid widget id ${widgetId}`);
            return;
        }
        const sessionName = createDataSession();
        const [newLayout1, newLayout2] = splitView(widgets[widgetId].layout);
        const newWidget = {
            theme: widgets[widgetId].theme,
            layout: newLayout2,
            sessionName
        }
        setWidgets(produce(widgets, draft=>{
            draft[widgetId].layout = newLayout1;
            draft.push(newWidget);
        }));
        log("I", "client", `New Widget binded to Data Session "${sessionName}"`);

    }, [widgets, log, createDataSession]);

    const closeWidget = useCallback((widgetId: number) => {
        if(widgets[widgetId] === undefined){
            log("E", "client", `Cannot close widget: invalid widget id ${widgetId}`);
            return;
        }
        setWidgets(produce(widgets, draft=>{
            draft.splice(widgetId, 1);
        }));
        log("I", "client", `Closed Widget ${widgetId}`);
    }, [widgets, log]);

    return {
        widgets,
        setWidgets,
        setWidgetSession,
        splitWidgetForNewConsole,
        splitWidgetForNewData,
        closeWidget
    }
};

export type WidgetApi = ReturnType<typeof useWidgetApi>;