import { appendLog, canLog, LoggerLevel, LoggerSource } from "data/log";
import produce from "immer";
import { useCallback, useMemo, useState } from "react";
import { ConsoleSession, DefaultConnectionSessionName, DefaultConsoleSessionName, isConsoleSession, newConsoleSession, Session } from "store/type";

export const useSessionApi = (getDefaultSessions: ()=>Record<string, Session>) => {
    const [sessionNameMap, setSessionNameMap] = useState<Record<string, Session>>(getDefaultSessions);
    const sessionNames = useMemo(()=>Object.keys(sessionNameMap), [sessionNameMap]);

    const log = useCallback((level: LoggerLevel, source: LoggerSource, text: string) => {
        // See if update is needed to prevent useless rerender
        if (!text){
            return;
        }
        const consoleSessions = Object.entries(sessionNameMap).filter((entry): entry is [string, ConsoleSession]=>isConsoleSession(entry[1])) ;
        let i = 0;
        // Find first session that can log this message
        for(;i<consoleSessions.length;i++){
            if(canLog(consoleSessions[i][1], level, source)){
                break;
            }
        }
        if(i >= consoleSessions.length){
            return;
        }
    
        setSessionNameMap(produce(sessionNameMap, draft=>{
            for(;i<consoleSessions.length;i++){
                const [key, session] = consoleSessions[i];
                if(canLog(session, level, source)) {
                    (draft[key] as ConsoleSession).data = appendLog(session.data, level, source, text);
                }
            }
        }));
    
    }, [sessionNameMap]);
    
    const createConsoleSession = useCallback(()=>{
        let i = 1;
        while (sessionNames.includes(`Console ${i}`)){
            i++;
        }
        const newName = `Console ${i}`;
        setSessionNameMap(produce(sessionNameMap, (draft)=>{
            draft[newName] = newConsoleSession();
        }));
        log("I", "client", `Created new Console Session "${newName}"`);
        return newName;
    }, [sessionNames, sessionNameMap, log]);

    const createDataSession = useCallback(()=>{
        let i = 1;
        while (sessionNames.includes(`Untitled Session ${i}`)){
            i++;
        }
        const newName = `Untitled Session ${i}`;
        setSessionNameMap(produce(sessionNameMap, (draft)=>{
            draft[newName] = newConsoleSession();
        }));
        log("I", "client", `Created new Data Session "${newName}"`);
        return newName;
    }, [sessionNames, sessionNameMap, log]);

    const closeSession = useCallback((sessionName: string)=>{
        if (!(sessionName in sessionNameMap)){
            log("E", "client", `Error: Closing ${sessionName} which is not a session`);
            return;
        }
        const session = sessionNameMap[sessionName];
        if (session.uidx >= 0) {
            // TODO: send message to close session on remote end
            // TODO: remove it in index map
        }

        setSessionNameMap(produce(sessionNameMap, (draft)=>{
            delete draft[sessionName];
        }));
        log("I", "client", `Closed Session "${sessionName}"`);
    }, [sessionNameMap]);

    const closeAllSessions = useCallback(() => {
        sessionNames.forEach(sessionName => {
            if (sessionName !== DefaultConsoleSessionName && sessionName !== DefaultConnectionSessionName) {
                closeSession(sessionName);
            }
        })
    }, [sessionNames, closeSession]);

    return {
        sessions: sessionNameMap,
        sessionNames,
        log,
        createConsoleSession,
        createDataSession,
        closeSession,
        closeAllSessions
    }
}

export type SessionApi = ReturnType<typeof useSessionApi>;