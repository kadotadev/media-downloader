const youtubePlaylist = require('youtube-playlist'),
    { dialog, BrowserWindow } = require('electron'),
    os = require('os'),
    musicDir = os.homedir() + '\\Music',
    { v4: uuid } = require('uuid');
const store = require('./store').getStore();

const ua = require('universal-analytics');
const userId = store.get('userid') || uuid();
store.set('userid', userId);
const usr = ua('UA-146879982-1', userId);

module.exports = {
    sleep           : (ms) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    },
    getPlaylist     : (playlistID) => {
        return new Promise((resolve, reject) => {
            youtubePlaylist('https://youtube.com/playlist?list=' + playlistID, 'id')
                .then((result) => {
                    resolve(result);
                })
                .catch((err) => {
                    reject('Error fetching playlist data');
                });
        });
    },
    trackEvent      : (category, action, label, value) => {
        let trackStats = store.get('opted');
        if (trackStats) {
            usr
                .event({
                    ec : category,
                    ea : action,
                    el : label,
                    ev : value
                })
                .send();
        }
    },
    selectDirectory : () => {
        return new Promise((resolve, reject) => {
            dialog
                .showOpenDialog(BrowserWindow.getAllWindows([ 0 ]), {
                    title       : 'Select download folder',
                    defaultPath : musicDir,
                    properties  : [ 'openDirectory' ]
                })
                .then((result) => {
                    if (result.canceled) {
                        resolve(false);
                    } else {
                        let paths = result.filePaths;
                        if (paths.length !== 0) {
                            if (paths[0].includes('.')) {
                                resolve(false);
                            } else {
                                store.set('saveFolder', paths[0]);
                                resolve(true);
                            }
                        } else {
                            resolve(false);
                        }
                    }
                })
                .catch((e) => {
                    resolve(false);
                });
        });
    }
};
