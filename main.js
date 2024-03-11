// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');
const path = require('path');
const url = require('url');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Hide the default window frame
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js') // Add preload script
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //mainWindow.setMenu(null); // Hide the menu bar

  fetchGameData();
});

async function fetchGameData() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/Jarsno-Studios/Games/main/games.json');
    mainWindow.webContents.executeJavaScript(`displayGames(${JSON.stringify(response.data)});`);
  } catch (error) {
    console.error('Error fetching game data:', error.message);
  }
}

// Open links externally instead of new Electron windows
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // Open the link in the default browser
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Listen for create-window-without-menu event
ipcMain.on('create-window-without-menu', (event, url) => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });
  window.loadURL(url);
  window.setMenu(null); // Hide the menu bar
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Create a new window when the app is activated (on macOS)
app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

// IPC (Inter-Process Communication) handlers for window control
ipcMain.on("minimize-window", () => {
  mainWindow.minimize(); // Minimize the main window
});

ipcMain.on("maximize-window", () => {
  if (mainWindow.isMaximized()) {
    // If the window is maximized, unmaximize it and send an event
    mainWindow.unmaximize();
    mainWindow.webContents.send("unmaximize-window");
  } else {
    // If the window is not maximized, maximize it and send an event
    mainWindow.maximize();
    mainWindow.webContents.send("maximized-window");
  }
});

ipcMain.on("close-window", () => {
  mainWindow.close(); // Close the main window
});
