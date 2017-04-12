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
      'id': 'browser',
      'state': 'fullscreen',
      bounds: {
        'width': 1024,
        'height': 768
      }
    }
    ,function(w){
       win = w;
       //Get fullscreen preference and switch to fullscreen if true
       chrome.storage.sync.get({
         fullscreen: true
       }, function(items) {
           if (items.fullscreen === true) {
               win.fullscreen();
               setTimeout(function(){
                 win.fullscreen();
              },1000);
          }
       });

      chrome.runtime.onInstalled.addListener(function() {
        chrome.contextMenus.create({ id: "options", title: "Options", contexts: ["launcher"] })
      })

      chrome.contextMenus.onClicked.addListener(function(info) {
        if(info.menuItemId == "options") {
          chrome.app.window.create("options.html")
        }
      });
    }
  )
}
