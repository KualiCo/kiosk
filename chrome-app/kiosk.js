//TODO Verify offline in chrome os
//TODO cleanup code formatting
//TODO cleanup options UI

var Kiosk = (function (Kiosk) {
    'use strict';

    var FS_INIT_PLACEHOLDER = 'kiosk_filesystem_initialized.txt';

    var options;
    // not configurable
    var bgImages= new Array()
    var screenSaverActive = false

    // stateful vars
    var slideIndex = 0 // which slide are we displaying?
    var idle = 0  // how idle is the system?
    var delay = 0 // used to slow down killing screensaver on mouse move
    var slideA = false // A/B slides to allow cross-fade

    // preload images
    var slideCache = new Array()
    var i_idle = null
    var i_slide = null
    var i_goHome = null

    Kiosk.options = {
        defaults: {
            fullscreen: true,               // if true, starts in fullscreen mode
            drive_folder: 'KioskSamples',   // name of drive folder with slides for screensaver
            inactivity_period: 90,          // how long until we start screensaver? seconds
            go_home_period: 30,              // how long before we move the page back home? seconds
            fade_interval: 1500,            // milliseconds cross fade
            slide_interval: 6,                 // how long to show each slide
            kiosk_demo_url: 'https://kiosk.kuali.co/demo.html' //Kiosk demo url
        },
        save: function (options, callback) {
            chrome.storage.sync.set(options, callback);
            chrome.runtime.sendMessage({options_event: 'save'});
        },
        load: function (callback) {
            chrome.storage.sync.get(this.defaults, callback);
        },
        reset: function(callback) {
            this.save(this.defaults, callback);
        }
    };

    function requestFilesystem(callback) {
        chrome.syncFileSystem.requestFileSystem(function (fs) {
            if (fs) {
                callback(null, fs);
            } else {
                callback('Unexpected error retrieving Chrome Syncable Filesystem.');
            }
        });
    }

    function initSyncableFilesystem(fs, callback) {
        fs.root.getFile(FS_INIT_PLACEHOLDER, {create: true}, 
            function(directory) {
                callback(null, directory);
             },
             function (err) { 
                 callback(err);
             });
    }

    function loadSlideFolder(fs, callback) {
        chrome.storage.sync.get({
            drive_folder: Kiosk.options.defaults.drive_folder
        }, function(items) {
           fs.root.getDirectory(items.drive_folder, {create: false}, 
               function(directory) {
                   readSlidesFromFolder(directory, prepSlides);
                   callback(null, directory);
                },
                function (err) { 
                    callback(err);
                });
        });
    }

    function defaultSlides() {
        debug('Using default slides');

        // load slide filenames into array
        var slides = [];
        for (i = 1; i <= 23; i++) {
          var newSlide = (i < 10 ? "0" : "") + i + ".jpg"
          slides.push(newSlide)
        }
    
        prepSlides(null, slides);
    }

    function readSlidesFromFolder(directory, callback) {
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
            var slides = shuffle(slideFiles), i;
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
        if (e && e.name) {
            console.log(name);
        }
        if (msg) {
            console.log(msg);
            toast('general_error', 'Error', msg, 0, true);
        }
    }

    function warn(msg, e) {
        console.log(e);
        if (e && e.name) {
            console.log(name);
        }
        if (msg) {
            console.log(msg);
            toast('general_warning', 'Warning', msg, 3000);
        }
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
        if (idle > options.inactivity_period && !screenSaverActive) {
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
        i_slide = setInterval(rotateSlide, options.slide_interval * 1000)
        i_goHome = setTimeout(function() { navigateTo(options.kiosk_demo_url) }, options.go_home_period * 1000)
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
        var s;

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
            $('#slideA').fadeOut(options.fade_interval)
            $('#slideB').fadeIn(options.fade_interval)
        } else {
            slideA = true
            s = document.getElementById("slideA")
            s.src = slideCache[slideIndex].src
            $('#slideA').fadeIn(options.fade_interval)
            $('#slideB').fadeOut(options.fade_interval)
        }
    }

    function onOptionsLoaded(data) {
        options = data;
    }

    Kiosk.ui = {
        toast: toast,
        load: function() {
            window.onresize = doLayout

            Kiosk.options.load(onOptionsLoaded);

            chrome.runtime.onMessage.addListener(
              function(request, sender, sendResponse) {
                if (request.options_event == 'save') {
                    Kiosk.options.load(onOptionsLoaded);
                }
            });

            var webview = document.querySelector('webview')
            doLayout()

            document.querySelector('#kuali-menu').onclick = function() {
                navigateTo(options.kiosk_demo_url)
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
            window.onkeyup = function(evt) {
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

            requestFilesystem(function(err, fs) {
                if (err) {            
                    warn('Unable to read drive filesystem. Default slides will be used.', err);
                    if (chrome.runtime.lastError) {
                        warn(chrome.runtime.lastError.message, chrome.runtime.lastError);
                    }

                    defaultSlides();
                } else {
                    initSyncableFilesystem(fs, function(err, rootDirectory) {
                        if (err) {
                            warn('Unable to init syncable filesystem. Default slides will be used.', err);
                            if (chrome.runtime.lastError) {
                                warn(chrome.runtime.lastError.message, chrome.runtime.lastError);
                            }

                            defaultSlides();
                        } else {
                            //Get slides from specificed folder
                            loadSlideFolder(fs, function (err, directory) {
                                if (err) {
                                    warn('Unable to read slide folder. Default slides will be used.', err)
                                    if (chrome.runtime.lastError) {
                                        warn(chrome.runtime.lastError.message, chrome.runtime.lastError);
                                    }

                                    defaultSlides();
                                } else {
                                    readSlidesFromFolder(directory, prepSlides);
                                }
                            });
                        }
                    })
                }
            });
        }
    }

    return Kiosk;
}(Kiosk || {}));