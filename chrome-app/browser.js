/*globals chrome, Kiosk */

function saveOptions() {
    let options = {
        fullscreen: document.getElementById('fullscreen').checked,
        driveFolder: document.getElementById('driveFolder').value,
        inactivityPeriod: document.getElementById('inactivityPeriod').value,
        goHomePeriod: document.getElementById('goHomePeriod').value,
        fadeInterval: document.getElementById('fadeInterval').value,
        slideInterval: document.getElementById('slideInterval').value,
        kioskDemoUrl: document.getElementById('kioskDemoUrl').value
    }

    Kiosk.options.save(options, () =>
        Kiosk.ui.toast('options_screen', 'Success', 'Options saved', 2000)
    )
}

function restoreOptions() {
    Kiosk.options.load((options) => {
        document.getElementById('fullscreen').checked = options.fullscreen
        document.getElementById('driveFolder').value = options.driveFolder
        document.getElementById('inactivityPeriod').value =
            options.inactivityPeriod
        document.getElementById('goHomePeriod').value = options.goHomePeriod
        document.getElementById('fadeInterval').value = options.fadeInterval
        document.getElementById('slideInterval').value = options.slideInterval
        document.getElementById('kioskDemoUrl').value = options.kioskDemoUrl
    })
}

function resetOptions() {
    Kiosk.options.reset(() => {
        Kiosk.ui.toast('options_screen', 'Success',
            'Options restored to defaults', 2000)
        restoreOptions()
    })
}

function restart() {
    chrome.runtime.restart()
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
document.getElementById('reset').addEventListener('click', resetOptions)
document.getElementById('restart').addEventListener('click', restart)

window.onload = Kiosk.ui.load
