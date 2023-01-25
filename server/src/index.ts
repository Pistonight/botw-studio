import { app, BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import { parseArgs, serveClient, openWebSocketServer } from "./boot";
import { localhostUrl } from "./util";

const {
	clientPort,
	webSocketPort
} = parseArgs(process.argv);

const cleanupTasks: (()=>void)[] = [];

// If in packaged app, serve the client
if (!isDev) {
	cleanupTasks.push(serveClient(clientPort));
}

// Open WebSocket Server
cleanupTasks.push(openWebSocketServer(webSocketPort));

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

	// Load the client
	win.loadURL(`${localhostUrl(clientPort)}?wsport=${webSocketPort}`);

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
