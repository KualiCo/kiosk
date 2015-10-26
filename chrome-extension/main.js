chrome.power.requestKeepAwake("display");

/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  runApp();
});

/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 */
chrome.app.runtime.onRestarted.addListener(function() {
  runApp();
});

/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
function runApp() {
  chrome.app.window.create('browser.html', {
    'frame': 'none',
    'id': 'browser',
    'state': 'fullscreen',
    'bounds':{
       'left':0,
       'top':0,
       'width':d[0].bounds.width,
       'height':d[0].bounds.height
    }
  },function(w){
    win = w;
    win.fullscreen();
    setTimeout(function(){
      win.fullscreen();
    },1000);
  });
}
