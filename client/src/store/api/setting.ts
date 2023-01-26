import { PersistStorage, PersistStoragePacket } from "data/server";
import { useEffect, useMemo, useState } from "react";
import { DefaultConnectionSessionName, DefaultConsoleSessionName, isConsoleSession, isDataSession, isOutputSession, newConnectionDataSession, newConsoleSession, Widget } from "store/type";
import { ServerApi } from "./server";
import { SessionApi } from "./session";
import { WidgetApi } from "./widget";
import QueryString from "query-string";

export const usePersistSetting = ({
    sessions,
    log,
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
                // Open sessions
                for (const sessionName in storage.consoles) {
                    createConsoleSession(sessionName);
                    const sessionSetting = storage.consoles[sessionName];
                    setConsoleLogLevel(sessionName, sessionSetting.level);
                    sourceNames.forEach(source=>{
                        const enabled = !!sessionSetting.enabled[source];
                        setConsoleLogSource(sessionName, source, enabled);
                    });
                }
                for (const sessionName in storage.datas) {
                    createDataSession(sessionName);
                    editData(sessionName, storage.datas[sessionName]);
                }
                storage.outputs.forEach(sessionName=>createOutputSession(sessionName));
                // Open Widgets
                const widgets: Widget[] = [];
                storage.widgets.forEach(({theme, x,y,w,h,session}) => {
                    widgets.push({
                        theme,
                        layout: { x,y,w,h },
                        sessionName: session
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
            outputs: [],
            widgets: []
        }

        for (const sessionName in sessions) {
            const session = sessions[sessionName];
            if (isConsoleSession(session)) {
                storage.consoles[sessionName] = {
                    level: session.level,
                    enabled: {...session.enabled}
                };
            } else if (isDataSession(session)) {
                if (isOutputSession(session)) {
                    storage.outputs.push(sessionName);
                }else{
                    storage.datas[sessionName]=session.obj;
                }
            }
        }

        widgets.forEach(widget=>{
            storage.widgets.push({
                theme: typeof widget.theme === "string" ? widget.theme : undefined,
                ...widget.layout,
                session: widget.sessionName
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