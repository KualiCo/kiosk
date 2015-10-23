
var idleTime = 0
var inactivityStart = 19
var screenSaverActive = false

// keep track of how idle we are
$(document).ready(function () {
    //Increment the idle time counter every second.
    var idleInterval = setInterval(timerIncrement, 1000)

    //Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) {
        idleTime = 0
        stopScreenSaver()
    })
    $(this).keypress(function (e) {
        idleTime = 0
        stopScreenSaver()
    })
})

// hooked from setInterval above
function timerIncrement() {
    idleTime = idleTime + 1
    if (idleTime > inactivityStart && !screenSaverActive) {
        startScreenSaver()
    }
}

// startup the screensaver
function startScreenSaver() {
	document.getElementById("screensaver").className = "slideshowWrapper visible"
    screenSaverActive = true
}

// stop the screensaver
function stopScreenSaver() {
	if (screenSaverActive) {
		document.getElementById("screensaver").className = "slideshowWrapper"
		screenSaverActive = false
	}
}

