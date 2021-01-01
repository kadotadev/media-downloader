const customTitlebar = require('custom-electron-titlebar');
const { ipcRenderer, shell } = require('electron');
const { constants } = require('fs');
new customTitlebar.Titlebar({
    backgroundColor : customTitlebar.Color.fromHex('#a51a1a'),
    icon            : 'img/logo.png'
});

$(document).ready(() => {
    var elems = document.querySelectorAll('.collapsible');
    var instances = M.Collapsible.init(elems, {});
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, {});
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});

    ipcRenderer.send('ready', true);
});

//Menu buttons
$('#main, #about, #settings').on('click', (e) => {
    $('.nav-wrapper a').removeClass('active');
    $('#main-content, #about-content, #settings-content').hide();
    let active = e.currentTarget.id;
    $('#' + active).addClass('active');
    $('#' + active + '-content').show();
});
//change folder
$('#changeFolder').click(() => {
    ipcRenderer.send('selectFolder', 'running');
});
//Update tracking
$('#tracking input[type=checkbox]').change(() => {
    ipcRenderer.send('updateTracking', $('#tracking input[type=checkbox]').prop('checked'));
});
//Update multiDL
$('#multiDL input[type=checkbox]').change(() => {
    ipcRenderer.send('updateMultiDL', $('#multiDL input[type=checkbox]').prop('checked'));
});
//Update theme
$('#theme input[type=checkbox]').change(() => {
    ipcRenderer.send('updateTheme', $('#theme input[type=checkbox]').prop('checked'));
    if ($('#theme input[type=checkbox]').prop('checked')) {
        //Dark
        $('body').removeClass('light');
    } else {
        $('body').addClass('light');
    }
});

//Data
ipcRenderer.on('data', (event, arg) => {
    if (arg.dataName === 'version') {
        $('#version').html('v' + arg.v);
    } else if (arg.dataName === 'settings') {
        $('#currentFolder').html(arg.store);
        $('tracking input[type=checkbox').prop('checked', arg.track);
        $('#multiDL input[type=checkbox]').prop('checked', arg.multiDL);
        $('#tracking').show();
        $('#theme').show();
        $('#multiDL').show();

        if (arg.theme === 'light') {
            $('body').addClass('light');
            $('#theme input[type=checkbox').prop('checked', false);
        } else {
            $('body').removeClass('light');
            $('#theme input[type=checkbox').prop('checked', true);
        }
    } else if (arg.dataName === 'saveFolder') {
        $('#currentFolder').html(arg.store);
    }
});

$(document).on('click', 'a[href^="http"]', function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

let networkStatus = false;
const onNetworkChange = () => {
    if (navigator.onLine) {
        //Online
        ipcRenderer.send('networkChange', 'online');
        networkStatus = true;
        $('#offline').hide();
        $('#online').fadeIn();
    } else {
        //Offline
        ipcRenderer.send('networkChange', 'offline');
        networkStatus = false;
        $('#online').hide();
        $('#offline').fadeIn();
    }
};

window.addEventListener('online', onNetworkChange);
window.addEventListener('offline', onNetworkChange);

onNetworkChange();
