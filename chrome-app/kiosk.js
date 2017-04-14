//TODO Verify offline in chrome os
//TODO Verify context menu works

/*global chrome, jQuery, console*/
window.Kiosk = (function (Kiosk, chrome, $, logger) {
    'use strict'

    const FS_INIT_PLACEHOLDER = 'kiosk_filesystem_initialized.txt'

    let options,
        screenSaverActive = false

    // stateful vars
    let slideIndex = 0, // which slide are we displaying?
        idle = 0,  // how idle is the system?
        delay = 0, // used to slow down killing screensaver on mouse move
        slideA = false // A/B slides to allow cross-fade

    // preload images
    let slideCache = [],
        slideHandle = null,
        goHomeHandle = null

    Kiosk.options = {
        defaults: {
            // if true, starts in fullscreen mode
            fullscreen: true,
            // name of drive folder with slides for screensaver
            driveFolder: 'KioskSamples',
            // how long until we start screensaver? seconds
            inactivityPeriod: 90,
            // how long before we move the page back home? seconds
            goHomePeriod: 30,
            // milliseconds cross fade
            fadeInterval: 1500,
            // how long to show each slide
            slideInterval: 6,
            //Kiosk demo url
            kioskDemoUrl: 'https://kiosk.kuali.co/demo.html'
        },

        save(data, callback) {
            chrome.storage.sync.set(data, callback)
            chrome.runtime.sendMessage({ optionsEvent: 'save' })
        },

        load(callback) {
            chrome.storage.sync.get(this.defaults, callback)
        },

        reset(callback) {
            this.save(this.defaults, callback)
        }
    }

    function requestFilesystem(callback) {
        chrome.syncFileSystem.requestFileSystem((fs) => {
            if (fs) {
                callback(null, fs)
            } else {
                callback(
                    'Unexpected error retrieving Chrome Syncable Filesystem.')
            }
        })
    }

    function initSyncableFilesystem(fs, callback) {
        fs.root.getFile(
            FS_INIT_PLACEHOLDER,
            { create: true },
            (directory) => callback(null, directory),
            (err) => callback(err)
        )
    }

    function loadSlideFolder(fs, callback) {
        chrome.storage.sync.get(
            { driveFolder: Kiosk.options.defaults.driveFolder },
            (items) => {
                fs.root.getDirectory(items.driveFolder, { create: false },
                    (directory) => {
                        readSlidesFromFolder(directory, prepSlides)
                        callback(null, directory)
                    },
                (err) => callback(err))
            }
        )
    }

    function defaultSlides() {
        debug('Using default slides')

        // load slide filenames into array
        let i, newSlide, slides = []
        for (i = 1; i <= 23; i++) {
            let slideNumPrefix = (i < 10 ? '0' : '')
            newSlide = `${slideNumPrefix}${i}.jpg`
            slides.push(newSlide)
        }

        prepSlides(null, slides)
    }

    function readSlidesFromFolder(directory, callback) {
        let dirReader = directory.createReader(),
            entries = [],
            readEntries = () => {
               dirReader.readEntries((results) => {
                if (!results.length) {
                    callback(null, entries)
                } else {
                  entries = entries.concat(
                    Array.prototype.slice.call(results || [], 0))
                  readEntries()
                }
              }, (err) => callback(err) )
            }

        readEntries() // Start reading dirs.
    }

    // Randomize the slide order
    function prepSlides(err, slideFiles) {
        //loadDriveApi()
        // pull new list from google drive
        // shuffle
        if (!err) {
            let i, slides = shuffle(slideFiles)
            for (i = 0; i < slides.length; i++) {
                slideCache[i] = new Image()
                slideCache[i].src =
                    typeof slides[i] === 'string' ?
                        `slides/${slides[i]}` : slides[i].toURL()
            }
        } else {
            error('Error loading slides', err)
        }
    }

    function navigateTo(url) {
        document.querySelector('webview').src = url
    }

    function doLayout() {
        let webview = document.querySelector('webview'),
            windowWidth = document.documentElement.clientWidth,
            windowHeight = document.documentElement.clientHeight,
            webviewWidth = windowWidth,
            webviewHeight = windowHeight

        webview.style.width = `${webviewWidth}px`
        webview.style.height = `${webviewHeight}px`
    }

    // Fisher-Yates Shuffle
    function shuffle(array) {
        let currentIndex = array.length, temporaryValue, randomIndex

        // While there remain elements to shuffle...
        while ( currentIndex !== 0 ) {
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
        logger.log(s)
    }

    function error(msg, e) {
        logger.log(e)
        if (e && e.name) {
            logger.log(name)
        }
        if (msg) {
            logger.log(msg)
            toast('general_error', 'Error', msg, 0, true)
        }
    }

    function warn(msg, e) {
        logger.log(e)
        if (e && e.name) {
            logger.log(name)
        }
        if (msg) {
            logger.log(msg)
            toast('general_warning', 'Warning', msg, 3000)
        }
    }

    function toast(notifId, title, message, timeout, requireInteraction) {
        chrome.notifications.create(
            notifId,
            {
                title,
                message,
                type: 'basic',
                iconUrl: '128.png',
                isClickable: false,
                requireInteraction: requireInteraction || false
            },
            (notificationId) => {
                if (requireInteraction === false) {
                    setTimeout(() =>
                        chrome.notifications.clear(notificationId), timeout)
                }
            }
        )
    }

    // startup the screensaver
    function startScreenSaver() {
        debug('startScreenSaver()')
        clearInterval(slideHandle)
        clearInterval(goHomeHandle)
        delay = 0 // slow down an accidental re-trigger
        screenSaverActive = true
        $('#slideBg').css('display', 'block')
        rotateSlide()
        slideHandle = setInterval(rotateSlide, options.slideInterval * 1000)
        goHomeHandle = setTimeout(() => navigateTo(options.kioskDemoUrl),
            options.goHomePeriod * 1000)
    }

    // stop the screensaver
    function stopScreenSaver() {
        if (screenSaverActive) {
            debug('stopScreenSaver()')
            screenSaverActive = false
            $('#slideA').fadeOut(0)
            $('#slideB').fadeOut(0)
            $('#slideBg').css('display', 'none')
            clearTimeout(goHomeHandle)
            clearInterval(slideHandle)
        }
    }

    function rotateSlide() {
        let s

        if (screenSaverActive == false) {
            return
        }

        if (slideIndex < slideCache.length - 1) {
            slideIndex++
        } else {
            slideIndex = 0
        }

        if (slideA) {
            slideA = false
            s = document.getElementById('slideB')
            s.src = slideCache[slideIndex].src
            $('#slideA').fadeOut(options.fadeInterval)
            $('#slideB').fadeIn(options.fadeInterval)
        } else {
            slideA = true
            s = document.getElementById('slideA')
            s.src = slideCache[slideIndex].src
            $('#slideA').fadeIn(options.fadeInterval)
            $('#slideB').fadeOut(options.fadeInterval)
        }
    }

    function onOptionsLoaded(data) {
        options = data
    }

    Kiosk.ui = {
        toast,
        load() {
            window.onresize = doLayout

            Kiosk.options.load(onOptionsLoaded)

            chrome.runtime.onMessage.addListener(
              (request) => {
                if (request.optionsEvent == 'save') {
                    Kiosk.options.load(onOptionsLoaded)
                } else if (request.optionsEvent == 'showOptionsModal') {
                    $('#optionsModal').modal('show')
                }
            })

            doLayout()

            document.querySelector('#kuali-menu').onclick = function() {
                navigateTo(options.kioskDemoUrl)
            }

            // on start, run screen saver "stop" to prime everything properly
            screenSaverActive = true
            stopScreenSaver()

            setInterval(() => {
                idle++
                if (idle > options.inactivityPeriod && !screenSaverActive) {
                    startScreenSaver()
                }
            }, 1000)

            // Zero the idle timer on mouse movement.
            $(this).mousemove(() => {
                idle = 0
                delay++
                if (delay > 10) { // arbitrary # of events
                    stopScreenSaver()
                }
            })
            $(this).keypress(() => {
                idle = 0
                stopScreenSaver()
            })

            //Init options modal
            $('#optionsModal').modal({ show: false })

            //DEBUG - starts screenshot immediately
            window.onkeyup = function(evt) {
                if (!screenSaverActive) {
                    if (evt.key === 'S' && evt.shiftKey && evt.ctrlKey) {
                        startScreenSaver()
                    }
                }

                if (evt.key === 'O' && evt.shiftKey && evt.ctrlKey) {
                    $('#optionsModal').modal('show')
                }
            }

            //Configure notifications for service changes
            chrome.syncFileSystem.onServiceStatusChanged.addListener(
                (detail) => {
                    if (detail.state === 'temporary_unavailable') {
                        toast('service_status',
                            'Warning', 'Network connection lost', 3000)
                    } else if (detail.state === 'running') {
                        toast('service_status',
                            'Info', 'Network connected', 3000)
                    } else if (detail.state === 'initializing') {
                        toast('service_status',
                            'Info', 'Connecting to Drive', 1000)
                    } else if (detail.state === 'authentication_required') {
                        toast('service_status',
                            'Error', 'Authentication required', 0, true)
                    } else if (detail.state === 'authentication_required') {
                        toast('service_status',
                            'Error', 'Drive sync disabled', 0, true)
                    }
                    debug(detail.description)
                }
            )

            //Configure notifications file updates
            chrome.syncFileSystem.onFileStatusChanged.addListener((detail) => {
                toast('file_status', 'Sync Update',
                    `${detail.fileEntry.name} ${detail.action} [${detail.direction}]`,
                    1500)
                debug(detail)
            })

            const defaultSlidesMsg = 'Default slides will be used.'

            requestFilesystem((err, fs) => {
                if (err) {
                    warn(
                        `Unable to read drive filesystem. ${defaultSlidesMsg}`,
                        err)
                    if (chrome.runtime.lastError) {
                        warn(chrome.runtime.lastError.message,
                             chrome.runtime.lastError)
                    }

                    defaultSlides()
                } else {
                    initSyncableFilesystem(fs, (err1) => {
                        if (err1) {
                            warn(
                                `Unable to init syncable filesystem. ${defaultSlidesMsg}`,
                                err)
                            if (chrome.runtime.lastError) {
                                warn(chrome.runtime.lastError.message,
                                     chrome.runtime.lastError)
                            }

                            defaultSlides()
                        } else {
                            //Get slides from specificed folder
                            loadSlideFolder(fs, (err2, directory) => {
                                if (err2) {
                                    warn(
                                        `Unable to read slide folder. ${defaultSlidesMsg}`,
                                        err)
                                    if (chrome.runtime.lastError) {
                                        warn(chrome.runtime.lastError.message,
                                             chrome.runtime.lastError)
                                    }

                                    defaultSlides()
                                } else {
                                    readSlidesFromFolder(directory, prepSlides)
                                }
                            })
                        }
                    })
                }
            })
        }
    }

    return Kiosk
}(window.Kiosk || {}, chrome, jQuery, console))
