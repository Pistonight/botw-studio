import { PersistStorage, PersistStoragePacket } from "data/server";
import { useEffect, useMemo, useState } from "react";
import { ConnectionSessionId, HelpSessionId, isConsoleSession, isDataSession, isOutputSession, newConnectionDataSession, newConsoleSession, Widget } from "store/type";
import { ServerApi } from "./server";
import { SessionApi } from "./session";
import { WidgetApi } from "./widget";
import QueryString from "query-string";

export const usePersistSetting = ({
    sessions,
    log,
    closeAllSessions,
    createConsoleSession,
    createDataSession,
    createOutputSession,
    setConsoleLogLevel,
    setConsoleLogSource,
    editData
}:SessionApi,{
    widgets,
    setWidgets
}:WidgetApi,{
    serverReady,
    sendPacket
}: ServerApi) => {
    const [settingLoaded, setSettingLoaded] = useState<boolean>(false);
    const [settingString, setSettingString] = useState<string>("");
    // Load settings from URL on load
    useEffect(() => {
        if(settingLoaded) {
            return;
        }
        setSettingLoaded(true);
        const query = QueryString.parse(window.location.search);
        const settingsURI = query.settings
        if (settingsURI && typeof settingsURI === "string") {
            try {
                const settingJSON = decodeURIComponent(settingsURI);
                const storage = JSON.parse(settingJSON) as PersistStorage;

                const sourceNames = ["client", "switch", "server"] as const;
                closeAllSessions();
                const sessionIdRemap: Record<string, string> = {};
                // Open sessions
                for (const sessionId in storage.consoles) {
                    const session = storage.consoles[sessionId];
                    const newId = createConsoleSession(session.name);
                    sessionIdRemap[sessionId] = newId;
                    
                    setConsoleLogLevel(newId, session.level);
                    sourceNames.forEach(source=>{
                        const enabled = !!session.enabled[source];
                        setConsoleLogSource(newId, source, enabled);
                    });
                }
                for (const sessionId in storage.datas) {
                    let newId = sessionId;
                    const session = storage.datas[sessionId];
                    if (sessionId !== ConnectionSessionId && sessionId !== HelpSessionId){
                        newId = createDataSession(session.name);
                    }
                    sessionIdRemap[sessionId] = newId;
                    editData(newId, session.obj);
                }
                for (const sessionId in storage.outputs) {
                    const session = storage.outputs[sessionId];
                    const newId = createOutputSession(session.name);
                    sessionIdRemap[sessionId] = newId;
                }

                // Open Widgets
                const widgets: Widget[] = [];
                storage.widgets.forEach(({theme, x,y,w,h,session}) => {
                    widgets.push({
                        theme,
                        layout: { x,y,w,h },
                        sessionId: sessionIdRemap[session]
                    });
                });
                setWidgets(widgets);
                log("I", "client", "Loaded settings.");
            } catch (e) {
                log("E", "client", "Error when loading settings");
            }
        }
        
    }, [
        settingLoaded,
        log,
        closeAllSessions,
        createConsoleSession,
        setConsoleLogLevel,
        setConsoleLogSource,
        createDataSession,
        createOutputSession
    ]);
    useEffect(() => {
        if(!serverReady){
            return;
        }
        const storage: PersistStorage = {
            consoles: {},
            datas: {},
            outputs: {},
            widgets: []
        }

        for (const sessionId in sessions) {
            const session = sessions[sessionId];
            if (isConsoleSession(session)) {
                storage.consoles[sessionId] = {
                    name: session.name,
                    level: session.level,
                    enabled: {...session.enabled}
                };
            } else if (isDataSession(session)) {
                if (isOutputSession(session)) {
                    storage.outputs[sessionId] = {
                        name: session.name
                    };
                }else{
                    storage.datas[sessionId]={
                        name: session.name,
                        obj: session.obj
                    };
                }
            }
        }

        if (!(ConnectionSessionId in storage.datas)) {
            const session = newConnectionDataSession();
            storage.datas[ConnectionSessionId] = {
                name: session.name,
                obj: session.obj
            };
        }
        if (!(HelpSessionId in storage.datas)) {
            storage.datas[HelpSessionId] = {
                name: "Help",
                obj: {}
            };
        }

        widgets.forEach(widget=>{
            storage.widgets.push({
                theme: typeof widget.theme === "string" ? widget.theme : undefined,
                ...widget.layout,
                session: widget.sessionId
            });
        });

        const newSettingString = JSON.stringify(storage);
        if(newSettingString !== settingString) {
            log("I", "client", "Saving Settings ...");
            sendPacket(new PersistStoragePacket(newSettingString));
            setSettingString(newSettingString);
        }

    }, [
        settingString,
        sessions,
        widgets,
        serverReady,
        sendPacket
    ]);
};