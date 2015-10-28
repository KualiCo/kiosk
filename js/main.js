// configurables
var idle = 0
var inactivityPeriod = 20
var slideRotation = 5
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
]

// not configurable
var bgImages= new Array()
var screenSaverActive = false

//preload images
var slideCache = new Array()
var i_idle = null
var i_slide = null

for (i=0; i < slides.length; i++) {
  slideCache[i] = new Image()
  slideCache[i].src = slides[i]
}

// start a random slide
var index = Math.floor((Math.random() * slides.length))
debug("index=" + index)

$(document).ready(function () {
  debug("init (" + slideRotation + ")")
  i_idle = setInterval(idleInterval, 1000)

  //Zero the idle timer on mouse movement.
  $(this).mousemove(function (e) {
      idle = 0
      stopScreenSaver()
  })
  $(this).keypress(function (e) {
      idle = 0
      stopScreenSaver()
  })
})

function debug(s) {
//  console.log(s)
}

// hooked from setInterval above
function idleInterval() {
  idle++
  debug("idle " + idle)
  if (idle > inactivityPeriod && !screenSaverActive) {
      startScreenSaver()
  }
}

function slideInterval() {
  debug("slide++")
  if (screenSaverActive) {
    rotateSlide()
  }
}

// startup the screensaver
function startScreenSaver() {
  debug("startScreenSaver()")
  screenSaverActive = true
  base = document.getElementById("slideBase")
  base.style.visibility = "visible"
  rotateSlide()
  i_slide = setInterval(slideInterval, slideRotation * 1000)
}

// stop the screensaver
function stopScreenSaver() {
  if (screenSaverActive) {
      debug("stopScreenSaver()")
	  screenSaverActive = false
	  base = document.getElementById("slideBase")
	  base.style.visibility = "hidden"
	  s = document.getElementById("slide")
	  s.style.visibility = "hidden"
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
  s = document.getElementById("slide")
  s.src = slideCache[index].src
  s.style.visibility = "visible"
  s.style.opacity = 1
}

