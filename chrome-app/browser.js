// configurables
var inactivityPeriod = 90 // how long until we start screensaver? seconds
var goHomeAfter = 30 // how long before we move the page back home? seconds
var fadeInterval = 1500 // milliseconds cross fade
var slideRotation = 6 // how long to show each slide
var kioskPage = 'https://kiosk.kuali.co/demo.html'

// load slide filenames into array
var slides = []
for (i = 1; i <= 41; i++) {
  var newSlide = (i < 10 ? "0" : "") + i + ".jpg"
  slides.push(newSlide)
}

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

// Randomize the slide order
function prepSlides() {
	//loadDriveApi()
	// pull new list from google drive
	// shuffle
	slides = shuffle(slides)
	for (i=0; i < slides.length; i++) {
		slideCache[i] = new Image()
		slideCache[i].src = 'slides/' + slides[i]
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

