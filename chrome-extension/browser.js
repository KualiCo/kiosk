window.onresize = doLayout;
var isLoading = false;

onload = function() {
  var webview = document.querySelector('webview');
  doLayout();

  document.querySelector('#kuali-menu').onclick = function() {
    navigateTo('https://kiosk.kuali.co/');
  };

  // on start, run screen saver "stop" to prime everything properly
  screenSaverActive = true
  stopScreenSaver()

  i_idle = setInterval(idleInterval, 1000)

  //Zero the idle timer on mouse movement.
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
};

function navigateTo(url) {
  /*resetExitedState();*/
  document.querySelector('webview').src = url;
}

function doLayout() {
  var webview = document.querySelector('webview');
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  var webviewWidth = windowWidth;
  var webviewHeight = windowHeight;

  webview.style.width = webviewWidth + 'px';
  webview.style.height = webviewHeight + 'px';

}

// configurables
var inactivityPeriod = 15
var fadeInterval = 1500
var slideRotation = 6
var slides = [
  "slides/01.jpg" ,
  "slides/02.jpg" ,
  "slides/03.jpg" ,
  "slides/04.jpg" ,
  "slides/05.jpg" ,
  "slides/06.jpg" ,
  "slides/07.jpg" ,
  "slides/08.jpg" ,
  "slides/09.jpg" ,
  "slides/10.jpg" ,
  "slides/11.jpg" ,
  "slides/12.jpg" ,
  "slides/13.jpg" ,
  "slides/14.jpg" ,
  "slides/15.jpg" ,
  "slides/16.jpg" ,
  "slides/17.jpg" ,
  "slides/18.jpg" ,
  "slides/19.jpg" ,
  "slides/20.jpg" ,
  "slides/21.jpg" ,
  "slides/temp01.jpg" ,
  "slides/temp02.jpg" ,
  "slides/temp03.jpg" ,
  "slides/temp04.jpg" ,
  "slides/temp05.jpg" ,
  "slides/temp06.jpg" ,
  "slides/temp07.jpg" ,
  "slides/temp08.jpg" ,
  "slides/temp09.jpg" ,
  "slides/temp10.jpg" ,
  "slides/temp11.jpg" ,
  "slides/temp12.jpg" ,
  "slides/temp13.jpg" ,
  "slides/temp14.jpg" ,
  "slides/temp15.jpg" ,
  "slides/temp16.jpg" ,
]

// not configurable
var bgImages= new Array()
var screenSaverActive = false

//preload images
var slideCache = new Array()
var i_idle = null
var i_slide = null

// Fisher-Yates Shuffle 
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
slides = shuffle(slides)

for (i=0; i < slides.length; i++) {
  slideCache[i] = new Image()
  slideCache[i].src = slides[i]
}

// start a random slide
var index = Math.floor((Math.random() * slides.length))
debug("index=" + index)

// stateful vars
var idle = 0  // how idle is the system?
var delay = 0 // used to slow down killing screensaver on mouse move
var slideA = false

function debug(s) {
  console.log(s)
}

// hooked from setInterval above
function idleInterval() {
  idle++
  debug("idle " + idle)
  if (idle > inactivityPeriod && !screenSaverActive) {
      startScreenSaver()
  }
}

// startup the screensaver
function startScreenSaver() {
  debug("startScreenSaver()")
  clearInterval(i_slide)
  delay = 0 // slow down an accidental re-trigger
  screenSaverActive = true
  $('#slideBg').css('display','block')
  rotateSlide()
  i_slide = setInterval(rotateSlide, slideRotation * 1000)
}

// stop the screensaver
function stopScreenSaver() {
  if (screenSaverActive) {
      debug("stopScreenSaver()")
	  screenSaverActive = false
      $('#slideA').fadeOut(0)
      $('#slideB').fadeOut(0)
      $('#slideBg').css('display','none')
      clearInterval(i_slide)
  }
}

function rotateSlide() {
  if (screenSaverActive == false) {
    return
  }

  if (index < slides.length-1) {
    index++
  } else {
    index = 0
  }
  debug("rotate() index=" + index)

  if (slideA) {
    debug("Picking B")
    slideA = false
    s = document.getElementById("slideB")
    s.src = slideCache[index].src
    $('#slideA').fadeOut(fadeInterval)
    $('#slideB').fadeIn(fadeInterval)
  } else {
    debug("Picking A")
    slideA = true
    s = document.getElementById("slideA")
    s.src = slideCache[index].src
    $('#slideA').fadeIn(fadeInterval)
    $('#slideB').fadeOut(fadeInterval)
  }
}

