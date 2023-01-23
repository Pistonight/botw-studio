import { appendLog, canLog, LoggerLevel, LoggerSource } from "data/log";
import produce from "immer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConsoleSession, DataSession, DefaultConnectionSessionName, DefaultConsoleSessionName, isConsoleSession, isDataSession, newConsoleSession, newDataSession, Session } from "store/type";

const logHelper = (sessions: Record<string, Session>, level: LoggerLevel, source: LoggerSource, text: string) => {
	for (const key in sessions) {
		const session = sessions[key];
		if (isConsoleSession(session)){
			if(canLog(session, level, source)) {
				session.data = appendLog(session.data, level, source, text);
			}
		}
	}
}

export const canCloseSession = (sessionName: string) => {
	return sessionName !== DefaultConsoleSessionName && sessionName !== DefaultConnectionSessionName;
};

export const useSessionApi = (getDefaultSessions: ()=>Record<string, Session>) => {
	const [sessionNameMap, setSessionNameMap] = useState<Record<string, Session>>(getDefaultSessions);
	const [
		sessionNames,
		nextConsoleSessionName,
		nextDataSessionName
	] = useMemo(()=>{
		const sessionNames = Object.keys(sessionNameMap);
		let i = 1;
		while (sessionNames.includes(`Console ${i}`)){
			i++;
		}
		const nextConsoleSessionName = `Console ${i}`;
		i = 1;
		while (sessionNames.includes(`Data ${i}`)){
			i++;
		}
		const nextDataSessionName = `Data ${i}`;
		return [
			sessionNames,
			nextConsoleSessionName,
			nextDataSessionName
		]
	}, [sessionNameMap]);

	const log = useCallback((level: LoggerLevel, source: LoggerSource, text: string) => {
		// See if update is needed to prevent useless rerender
		if (!text){
			return;
		}

		setSessionNameMap(produce(draft=>{
			logHelper(draft, level, source, text);
		}));
    
	}, []);
    
	const createConsoleSession = useCallback((name: string)=>{
		setSessionNameMap(produce((draft)=>{
			logHelper(draft, "I", "client", `Creating new Console Session "${name}"`);
			draft[name] = newConsoleSession();
		}));
	}, []);

	const createDataSession = useCallback((name: string)=>{
		setSessionNameMap(produce((draft)=>{
			logHelper(draft, "I", "client", `Creating new Data Session "${name}"`);
			draft[name] = newDataSession();
		}));
	}, []);



	const closeSession = useCallback((sessionName: string)=>{
		if (!canCloseSession(sessionName)){
			log("E", "client", `Error: Session "${sessionName}" is not allowed to be closed.`)
		}
		setSessionNameMap(produce((draft)=>{
			logHelper(draft, "I", "client", `Closing Session "${sessionName}"`);
			if (draft[sessionName].uidx >= 0) {
				
				// TODO: remove it in index map
			}
			delete draft[sessionName];
		}));
		
	}, []);

	const closeAllSessions = useCallback(() => {
		setSessionNameMap(produce((draft)=>{
			for (const key in draft){
				if (canCloseSession(key)) {
					if (draft[key].uidx >= 0) {
				
						// TODO: remove it in index map
					}
					logHelper(draft, "I", "client", `Closing Session "${key}"`);
					delete draft[key];
				}
				
			}
			
		}));
	}, []);

	const editData = useCallback((sessionName: string, newData: Record<string, unknown>) => {
		setSessionNameMap(produce(draft=>{
			if (!(sessionName in draft)){
				logHelper(draft, "E", "client", `Error: Editing "${sessionName}" which is not a Session`);
				return;
			}
			const session = draft[sessionName];
			if (!isDataSession(session)) {
				logHelper(draft, "E", "client", `Error: Editing "${sessionName}" which is not a Data Session`);
				return;
			}
			logHelper(draft, "D", "client", `Setting ${sessionName} data = ${JSON.stringify(newData)}`);
			session.obj = newData;
		}));

		
	}, []);

	return useMemo(()=>({
		sessions: sessionNameMap,
		sessionNames,
		log,
		createConsoleSession,
		createDataSession,
		closeSession,
		closeAllSessions,
		editData,
		nextConsoleSessionName,
		nextDataSessionName
	}), [
		sessionNameMap,
		sessionNames,
		log,
		createConsoleSession,
		createDataSession,
		closeSession,
		closeAllSessions,
		editData,
		nextConsoleSessionName,
		nextDataSessionName
	]);
};

export type SessionApi = Readonly<ReturnType<typeof useSessionApi>>;