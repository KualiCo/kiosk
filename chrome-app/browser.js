// configurables
var inactivityPeriod = 15 // how long until we start screensaver? seconds
var goHomeAfter = 30 // how long before we move the page back home? seconds
var fadeInterval = 1500 // milliseconds cross fade
var slideRotation = 6 // how long to show each slide
var kioskPage = 'https://kiosk.kuali.co/demo.html'

var slides = [
"slides/01.jpg",
"slides/02.jpg",
"slides/03.jpg",
"slides/04.jpg",
"slides/05.jpg",
"slides/06.jpg",
"slides/07.jpg",
"slides/08.jpg",
"slides/09.jpg",
"slides/10.jpg",
"slides/11.jpg",
"slides/12.jpg",
"slides/13.jpg",
"slides/14.jpg",
"slides/15.jpg",
"slides/16.jpg",
"slides/17.jpg",
"slides/18.jpg",
"slides/19.jpg",
"slides/20.jpg",
"slides/21.jpg"
]

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

prepSlides()

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
}

// Goole API bits
/*
var gApiClientId = 'AIzaSyBJWJqvAnZ48q1uBp4ztoFNuI329IpGYQM'
var google_gApiScopes = ['https://www.googleapis.com/auth/drive.metadata.readonly']

// GAPI for Google Drive
// Check if current user has authorized this application.
function checkAuth() {
	gapi.auth.authorize({
		'client_id': gApiClientId,
		'scope': gApiScopes.join(' '),
		'immediate': true
	}, handleAuthResult)
}

// GAPI for Google Drive
// Handle response from authorization server.
//
// @param {Object} authResult Authorization result.
//
function handleAuthResult(authResult) {
	var authorizeDiv = document.getElementById('authorize-div')
	if (authResult && !authResult.error) {
		// Hide auth UI, then load client library.
		authorizeDiv.style.display = 'none'
		// loadDriveApi()
	} else {
		// Show auth UI, allowing the user to initiate authorization by
		// clicking authorize button.
		authorizeDiv.style.display = 'inline'
	}
}
	
// GAPI for Google Drive
// Initiate auth flow in response to user clicking authorize button.
//
// @param {Event} event Button click event.
//
function handleAuthClick(event) {
	gapi.auth.authorize({
		client_id: gApiClientId,
		scope: gApiScopes,
		immediate: false
	}, handleAuthResult)
	return false
}

//
// Load Drive API client library.
//
function loadDriveApi() {
	gapi.client.load('drive', 'v2', listFiles)
}

//
// Print files.
//
function listFiles() {
	var request = gapi.client.drive.files.list({
		'maxResults': 10
	})

	request.execute(function(resp) {
	appendPre('Files:')
	var files = resp.items
	if (files && files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i]
			appendPre(file.title + ' (' + file.id + ')')
			}
		} else {
			appendPre('No files found.')
		}
	})
}

// Append a pre element to the body containing the given message
// as its text node.
//
// @param {string} message Text to be placed in pre element.
function appendPre(message) {
	var pre = document.getElementById('output')
	var textContent = document.createTextNode(message + '\n')
	pre.appendChild(textContent)
}

*/

// Randomize the slide order
function prepSlides() {
	//loadDriveApi()
	// pull new list from google drive
	// shuffle
	slides = shuffle(slides)
	for (i=0; i < slides.length; i++) {
		slideCache[i] = new Image()
		slideCache[i].src = slides[i]
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

	if (slideIndex < slides.length-1) {
		slideIndex++
	} else {
		slideIndex = 0
	}
	//debug("rotate() slideIndex=" + slideIndex)

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

