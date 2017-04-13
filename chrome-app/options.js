function save_options() {
    var options = {
        fullscreen: document.getElementById('fullscreen').checked,
        drive_folder: document.getElementById('drive_folder').value,
        inactivity_period: document.getElementById('inactivity_period').value,
        go_home_period: document.getElementById('go_home_period').value,
        fade_interval: document.getElementById('fade_interval').value,
        slide_interval: document.getElementById('slide_interval').value,
        kiosk_demo_url: document.getElementById('kiosk_demo_url').value
    };

    Kiosk.options.save(options, function() {
        Kiosk.ui.toast('options_screen', 'Success', 'Options saved', 2000);
    });
}

function restore_options() {
    Kiosk.options.load(function(options) {
        document.getElementById('fullscreen').checked = options.fullscreen;
        document.getElementById('drive_folder').value = options.drive_folder;
        document.getElementById('inactivity_period').value = options.inactivity_period;
        document.getElementById('go_home_period').value = options.go_home_period;
        document.getElementById('fade_interval').value = options.fade_interval;
        document.getElementById('slide_interval').value = options.slide_interval;
        document.getElementById('kiosk_demo_url').value = options.kiosk_demo_url;
    });
}

function close_options() {
    chrome.app.window.current().close();
}

function reset_options() {
    Kiosk.options.reset(function() {
        Kiosk.ui.toast('options_screen', 'Success', 'Options restored to defaults', 2000);
        restore_options();
    });
}

function restart() {
    chrome.runtime.restart();
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('close').addEventListener('click', close_options);
document.getElementById('reset').addEventListener('click', reset_options);
document.getElementById('restart').addEventListener('click', restart);
