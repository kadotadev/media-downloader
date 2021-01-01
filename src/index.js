const { app, BrowserWindow, ipcMain, dialog, autoUpdater, Notification } = require('electron');
const pkg = require('../package.json'),
    path = require('path'),
    os = require('os'),
    fs = require('fs'),
    musicDir = path.join(os.homedir(), 'Music', 'youtube-dl'),
    pretty = require('pretty-ms'),
    isDev = require('electron-is-dev'),
    log = require('electron-log'),
    ytdl = require('ytdl-core'),
    utility = require('./functions');

let network = 'offline';
console.log(app.getPath('userData'));

let platform;
if (os.platform === 'win32') {
    platform = 'win32';
} else {
    platform = os.platform() + '_' + os.arch();
}
const version = app.getVersion();

const store = require('./store').getStore();

if (!store.get('theme')) {
    store.set('theme', 'dark');
}
if (!store.get('multiDL')) {
    store.set('multiDL', false);
}
if (!store.get('saveFolder')) {
    store.set('saveFolder', musicDir);
    if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir);
    }
}
if (typeof store.get('opted') === 'undefined') {
    store.set('opted', true);
}

//Audio related stuff
const ffmpegStatic = require('ffmpeg-static-electron');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic.path);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    app.quit();
}

let mainWindow;

const createWindow = () => {
    const { screen } = require('electron');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        title           : 'YouTube to MP3',
        width           : width / 1.5,
        height          : height / 1.5,
        backgroundColor : '#141618',
        show            : false,
        frame           : false,
        webPreferences  : {
            nodeIntegration    : true,
            enableRemoteModule : true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'render', 'index.html'));

    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        mainWindow.focus();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

//Communicate with the renderer process
ipcMain.on('ready', (event, arg) => {
    event.sender.send('data', {
        dataName : 'version',
        v        : pkg.version
    });
    event.sender.send('data', {
        dataName : 'settings',
        store    : store.get('saveFolder'),
        track    : store.get('opted'),
        theme    : store.get('theme'),
        multiDL  : store.get('multiDL')
    });
});
ipcMain.on('networkChange', (event, arg) => {
    network = arg;
});
ipcMain.on('updateTracking', (event, arg) => {
    trackStats = arg;
    store.set('opted', arg);
});
ipcMain.on('updateTheme', (event, arg) => {
    store.set('theme', arg ? 'dark' : 'light');
});
ipcMain.on('updateMultiDL', (event, arg) => {
    store.set('multiDL', arg);
});
ipcMain.on('selectFolder', async (event, arg) => {
    result = await utility.selectDirectory();
    if (result) {
        saveFolder = store.get('saveFolder');
        event.sender.send('data', { dataName: 'saveFolder', store: store.get('saveFolder') });
    } else {
        //cancelled
        event.sender.send('error', { error: 'Cancelled folder select' });
    }
});

//Auto updater
if (!isDev) {
    setTimeout(() => {
        app.isReady() ? initUpdater() : app.on('ready', () => initUpdater());
    }, 5000);
}
const initUpdater = () => {
    const feedURL = `https://apps.kadota.dev/media-downloader/update/${platform}/${version}`;

    autoUpdater.setFeedURL(feedURL);

    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update-available', true);
    });
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
        //update downloaded
        mainWindow.webContents.send('update-downloaded', true);
        ipcMain.on('restart', (event, arg) => {
            autoUpdater.quitAndInstall();
        });
    });
    autoUpdater.on('error', (error) => {
        //Catch error
        log.error(error);
    });
    autoUpdater.checkForUpdates();
    setInterval(() => {
        autoUpdater.checkForUpdates();
    }, 300000);
};
