
export type LoggerSource = "switch" | "server" | "client";
export type LoggerLevel = "D" | "I" | "W" | "E";
const Levels = {
	"D": 1,
	"I": 2,
	"W": 3,
	"E": 4
};
export type LoggerSourceEnableMap = {[T in LoggerSource]: boolean};

const MaxLength = 5000;

export type LogFunction = (level: LoggerLevel, source: LoggerSource, text: string) => void;

export const canLog = (config: {level: LoggerLevel, enabled: LoggerSourceEnableMap}, level: LoggerLevel, source: LoggerSource): boolean => {
	if (!config.enabled[source]){
		return false;
	}
	if (Levels[config.level] > Levels[level]){
		return false;
	}
	return true;
};

export const appendLog = (buffer: string, level: LoggerLevel, source: LoggerSource, text: string): string => {
	const dateString = new Date().toLocaleTimeString();
	const fullString = `[${dateString}][${level}][${source}] ${text}\n`;
	if (buffer.length + fullString.length > MaxLength) {
		return buffer.substring(buffer.length - MaxLength + fullString.length) + fullString;
	}

	return buffer+fullString;
};
