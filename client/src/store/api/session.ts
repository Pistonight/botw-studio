import { appendLog, canLog, LoggerLevel, LoggerSource } from "data/log";
import produce from "immer";
import { useCallback, useMemo, useState } from "react";
import { DefaultConnectionSessionName, DefaultConsoleSessionName, isConsoleSession, isDataSession, newConsoleSession, newDataSession, newOutputSession, Session } from "store/type";

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

const checkSessionHelper = <T extends Session>(sessions: Record<string, Session>, sessionName: string, predicate: (session: Session) => session is T): T | undefined => {
	if (!(sessionName in sessions)){ 
		logHelper(sessions, "E", "client", `Error: Accessing "${sessionName}" which is not a Session`);
		return undefined; 
	}
	const session = sessions[sessionName];
	if (!predicate(session)) {
		logHelper(sessions, "E", "client", `Error: Accessing "${sessionName}" which is the wrong Session type`);
		return undefined;
	}
	return session;
}

export const useSessionApi = (getDefaultSessions: ()=>Record<string, Session>) => {
	const [sessionNameMap, setSessionNameMap] = useState<Record<string, Session>>(getDefaultSessions);
	const [activeOutputSessionMap, setActiveOutputSessionMap] = useState<Record<number, string>>({});
	const {
		sessionNames,
		activeOutputSessionNames,
		nextConsoleSessionName,
		nextDataSessionName
	} = useMemo(()=>{
		const sessionNames = Object.keys(sessionNameMap);
		sessionNames.sort();
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
		const activeOutputSessionNames = Object.values(activeOutputSessionMap);
		activeOutputSessionNames.sort();
		return {
			sessionNames,
			activeOutputSessionNames,
			nextConsoleSessionName,
			nextDataSessionName
		};
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

	const createOutputSession = useCallback((name: string)=>{
		setSessionNameMap(produce((draft)=>{
			logHelper(draft, "I", "client", `Creating new Output Session "${name}"`);
			draft[name] = newOutputSession();
		}));
	}, []);

	const canCloseSession = useCallback((sessionName: string) => {
		if(sessionName === DefaultConsoleSessionName || sessionName === DefaultConnectionSessionName){
			return false;
		}
		// Cannot close activate output sessions
		return !activeOutputSessionNames.includes(sessionName);
	}, [activeOutputSessionNames]);

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
		
	}, [canCloseSession]);

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
	}, [canCloseSession]);

	const editData = useCallback((sessionName: string, newData: Record<string, unknown>) => {
		setSessionNameMap(produce(draft=>{
			const session = checkSessionHelper(draft, sessionName, isDataSession);
			if (session){
				logHelper(draft, "D", "client", `Setting ${sessionName} data = ${JSON.stringify(newData)}`);
				session.obj = newData;
			}
		}));
	}, []);

	const setConsoleLogLevel = useCallback((sessionName: string, level: LoggerLevel) => {
		setSessionNameMap(produce(draft=>{
			const session = checkSessionHelper(draft, sessionName, isConsoleSession);
			if (session) {
				logHelper(draft, "I", "client", `Setting ${sessionName} logging level to ${level}`);
				session.level = level;
			}
		}));
	}, []);

	const setConsoleLogSource = useCallback((sessionName: string, source: LoggerSource, enable: boolean) => {
		setSessionNameMap(produce(draft=>{
			const session = checkSessionHelper(draft, sessionName, isConsoleSession);
			if (session) {
				logHelper(draft, "I", "client", `Setting ${sessionName} to log ${source}: ${enable}`);
				session.enabled[source] = enable;
			}
		}));
	}, []);


	return useMemo(()=>({
		sessions: sessionNameMap,
		sessionNames,
		activeOutputSessionNames,
		log,
		createConsoleSession,
		createDataSession,
		createOutputSession,
		canCloseSession,
		closeSession,
		closeAllSessions,
		editData,
		nextConsoleSessionName,
		nextDataSessionName,
		setConsoleLogLevel,
		setConsoleLogSource
	}), [
		sessionNameMap,
		sessionNames,
		activeOutputSessionNames,
		log,
		createConsoleSession,
		createDataSession,
		createOutputSession,
		canCloseSession,
		closeSession,
		closeAllSessions,
		editData,
		nextConsoleSessionName,
		nextDataSessionName,
		setConsoleLogLevel,
		setConsoleLogSource
	]);
};

export type SessionApi = Readonly<ReturnType<typeof useSessionApi>>;