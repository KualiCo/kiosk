//DONETODO Persist configuration across restarts - have a configuration screen!
//DONETODO Allow configuration of the folder
//TODO Allow other media types. Would require inspecting the file.
//TODO Verify offline capability
//WONTTODO Populate default slides on load
//WONTTODO Progress indicator
//DONETODO Sync status
//DONETODO Drive directory should be configurable - can use optionsPage ?
//DONETODO The default slides should be served from the app itself instead of pre-populating
//TODO Consider showing a network status icon when not running
//TODO Consider if we should update slides when there is a file change
//TODO cleanup formatting - tabs/spaces/etc
//TODO formatting of options screen
//TODO allow other options to be configurable

// configurables
var inactivityPeriod = 90 // how long until we start screensaver? seconds
var goHomeAfter = 30 // how long before we move the page back home? seconds
var fadeInterval = 1500 // milliseconds cross fade
var slideRotation = 6 // how long to show each slide
var kioskPage = 'https://kiosk.kuali.co/demo.html'

// not configurable
var bgImages= new Array()
var screenSaverActive = false

// stateful vars
var slideIndex = 0 // which slide are we displaying?
var idle = 0  // how idle is the system?
var delay = 0 // used to slow down killing screensaver on mouse move
var slideA = false // A/B slides to allow cross-fade

window.onresize = doLayout

// preload images
var slideCache = new Array()
var i_idle = null
var i_slide = null
var i_goHome = null

onload = function() {
	var webview = document.querySelector('webview')
	doLayout()

	document.querySelector('#kuali-menu').onclick = function() {
		navigateTo(kioskPage)
	}

	// on start, run screen saver "stop" to prime everything properly
	screenSaverActive = true
	stopScreenSaver()

	i_idle = setInterval(idleInterval, 1000)

	// Zero the idle timer on mouse movement.
	$(this).mousemove(function (e) {
		idle = 0
		delay++
		if (delay > 10) { // arbitrary # of events
			stopScreenSaver()
		}
	})
	$(this).keypress(function (e) {
		idle = 0
		stopScreenSaver()
	})
    
    //DEBUG - starts screenshot immediately
    webview.onkeyup = function(evt) {
        if (!screenSaverActive) {
            if (evt.key === "S" && evt.shiftKey && evt.ctrlKey ) {
                startScreenSaver()
            }
        }
        
        if (evt.key === "O" && evt.shiftKey && evt.ctrlKey ) {
            chrome.app.window.create("options.html");
        }
    }
    
    //Configure notifications for service changes
    chrome.syncFileSystem.onServiceStatusChanged.addListener(function (detail) {
        if (detail.state === 'temporary_unavailable') {
            toast('service_status', 'Warning', 'Network connection lost', 3000);
        } else if (detail.state === 'running') {
            toast('service_status', 'Info', 'Network connected', 3000);
        } else if (detail.state === 'initializing') {
            toast('service_status', 'Info', 'Connecting to Drive', 1000);
        } else if (detail.state === 'authentication_required') {
            toast('service_status', 'Error', 'Authentication required', 0, true);
        } else if (detail.state === 'authentication_required') {
            toast('service_status', 'Error', 'Drive sync disabled', 0, true);
        }
        debug(detail.description);
    });

    //Configure notifications file updates
    chrome.syncFileSystem.onFileStatusChanged.addListener(function (detail) {
        toast('file_status', 'Sync Update', detail.fileEntry.name + " " + detail.action + " [" + detail.direction, 1500) + "]";
        debug(detail);
    });
    
    loadSlides();
}

function loadSlides() {
    chrome.syncFileSystem.requestFileSystem(function (fs) {
        // FileSystem API should just work on the returned 'fs'.
        if (fs) {
            chrome.storage.sync.get({
                drive_folder: 'kuali_kiosk_screenshots'
            }, function(items) {
               fs.root.getDirectory(items.drive_folder, {create: false}, 
                   function(directory) {
                       readDirectory(directory, prepSlides);
                    },
                    function (err) { 
                        warn('Unable to read drive folder - default slides will be used', err);
                        defaultSlides();
                    });
            });
        } else {
            defaultSlides();
            if (chrome.runtime.lastError) {
                error(chrome.runtime.lastError.message, chrome.runtime.lastError);
            } else {
                warn('Unable to load drive filesystem - default slides will be used', err);
                error(msg, msg);
            }
        }
    });
}

function defaultSlides() {
    debug('Unable to load slides from google drive - using defaults');

    // load slide filenames into array
    var slides = [];
    for (i = 1; i <= 23; i++) {
      var newSlide = (i < 10 ? "0" : "") + i + ".jpg"
      slides.push(newSlide)
    }
    
    prepSlides(null, slides);
}

function readDirectory(directory, callback) {
    var dirReader = directory.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
       dirReader.readEntries (function(results) {
        if (!results.length) {
            callback(null, entries);
        } else {
          entries = entries.concat(Array.prototype.slice.call(results || [], 0));
          readEntries();
        }
      }, function (err) { callback(err) });
    };

    readEntries(); // Start reading dirs.
}

// Randomize the slide order
function prepSlides(err, slideFiles) {
	//loadDriveApi()
	// pull new list from google drive
	// shuffle
    if (!err) {
    	var slides = shuffle(slideFiles)
    	for (i=0; i < slides.length; i++) {
    		slideCache[i] = new Image()
    		slideCache[i].src = typeof slides[i] === 'string' ? 'slides/' + slides[i] : slides[i].toURL();
    	}
    } else {
        error('Error loading slides', err);
    }
}

function navigateTo(url) {
	//debug("navigateTo(" + url + ")")
	document.querySelector('webview').src = url
}

function doLayout() {
	var webview = document.querySelector('webview')
	var windowWidth = document.documentElement.clientWidth
	var windowHeight = document.documentElement.clientHeight
	var webviewWidth = windowWidth
	var webviewHeight = windowHeight

	webview.style.width = webviewWidth + 'px'
	webview.style.height = webviewHeight + 'px'
}

// Fisher-Yates Shuffle
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex -= 1

		// And swap it with the current element.
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}

	return array
}

function debug(s) {
	console.log(s)
}

function error(msg, e) {
    console.log(e);
    if (msg) toast('general_error', 'Error', msg, 0, true);
}

function warn(msg, e) {
    console.log(e);
    if (msg) toast('general_warning', 'Warning', msg, 3000);
}

function toast(notifId, title, message, timeout, requireInteraction) {
    chrome.notifications.create(notifId, {
        type: 'basic',
        title: title,
        message: message,
        iconUrl: '128.png',
        isClickable: false,
        requireInteraction: requireInteraction || false
    }, function(notificationId) {
        if (requireInteraction === false) {
            setTimeout(function(){
                chrome.notifications.clear(notificationId);
           }, timeout);
       }
    });
}

// hooked from setInterval above
function idleInterval() {
	idle++
	//debug("idle")
	if (idle > inactivityPeriod && !screenSaverActive) {
		startScreenSaver()
	}
}

// startup the screensaver
function startScreenSaver() {
	debug("startScreenSaver()")
	clearInterval(i_slide)
	clearInterval(i_goHome)
	delay = 0 // slow down an accidental re-trigger
	screenSaverActive = true
	$('#slideBg').css('display','block')
	rotateSlide()
	i_slide = setInterval(rotateSlide, slideRotation * 1000)
	i_goHome = setTimeout(function() { navigateTo(kioskPage) }, goHomeAfter * 1000)
}

// stop the screensaver
function stopScreenSaver() {
	if (screenSaverActive) {
		debug("stopScreenSaver()")
		screenSaverActive = false
		$('#slideA').fadeOut(0)
		$('#slideB').fadeOut(0)
		$('#slideBg').css('display','none')
    	clearTimeout(i_goHome)
		clearInterval(i_slide)
	}
}

function rotateSlide() {
	if (screenSaverActive == false) {
		return
	}

	if (slideIndex < slideCache.length-1) {
		slideIndex++
	} else {
		slideIndex = 0
	}

	if (slideA) {
		slideA = false
		s = document.getElementById("slideB")
		s.src = slideCache[slideIndex].src
		$('#slideA').fadeOut(fadeInterval)
		$('#slideB').fadeIn(fadeInterval)
	} else {
		slideA = true
		s = document.getElementById("slideA")
		s.src = slideCache[slideIndex].src
		$('#slideA').fadeIn(fadeInterval)
		$('#slideB').fadeOut(fadeInterval)
	}
}

