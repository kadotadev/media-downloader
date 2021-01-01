const Store = require('electron-store');
const store = new Store();

exports.getStore = () => {
    return store;
};
