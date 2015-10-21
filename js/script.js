
var idleTime = 0;
var screenSaverActive = false;
$(document).ready(function () {
    //Increment the idle time counter every minute.
    var idleInterval = setInterval(timerIncrement, 1000); // 1 second

    //Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) {
        idleTime = 0;
        stopScreenSaver();
    });
    $(this).keypress(function (e) {
        idleTime = 0;
        stopScreenSaver();
    });
});

function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime > 9 && !screenSaverActive) { // 10 seconds
        startScreenSaver();
    }
}

function startScreenSaver() {
	document.getElementById("screensaver").className = "slideshowWrapper visible";
    screenSaverActive = true;
}

function stopScreenSaver() {
	if (screenSaverActive) {
		document.getElementById("screensaver").className = "slideshowWrapper";
		screenSaverActive = false;
	}
}