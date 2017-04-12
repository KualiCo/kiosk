// Saves options to chrome.storage.sync.
function save_options() {
  var fullscreen = document.getElementById('fullscreen').checked;
  var driveFolder = document.getElementById('drive_folder').value;
  chrome.storage.sync.set({
    fullscreen: fullscreen,
    drive_folder: driveFolder
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function close_options() {
    chrome.app.window.current().close();
}

function restore_options() {
  chrome.storage.sync.get({
    fullscreen: true,
    drive_folder: 'kuali_kiosk_screenshots'
  }, function(items) {
    document.getElementById('fullscreen').checked = items.fullscreen;
    document.getElementById('drive_folder').value = items.drive_folder;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('close').addEventListener('click', close_options);