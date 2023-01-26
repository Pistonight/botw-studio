import { app, BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import { parseArgs, serveClient, openWebSocketServer } from "./boot";
import { readSettingToURIString } from "./setting";
import { localhostUrl } from "./util";

const {
	clientPort,
	webSocketPort
} = parseArgs(process.argv);

console.log(__dirname);

const cleanupTasks: (()=>void)[] = [];

// If in packaged app, serve the client
if (!isDev) {
	cleanupTasks.push(serveClient(clientPort));
}

// Open WebSocket Server
cleanupTasks.push(openWebSocketServer(webSocketPort));

// Read settings
const settings = readSettingToURIString();

// Initialize Electron App
app.whenReady().then(()=>{
    // Create the browser window.
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	let url = `${localhostUrl(clientPort)}?wsport=${webSocketPort}`;
	if (settings) {
		url += `&settings=${settings}`;
	}

	// Load the client
	win.loadURL(url);

	if (isDev) {
		win.webContents.openDevTools({ mode: 'detach' });
	}else{
		win.removeMenu();
	}

});

app.on('window-all-closed', () => {
	cleanupTasks.forEach(task=>task());
    app.quit();
});
