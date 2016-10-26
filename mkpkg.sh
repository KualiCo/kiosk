#!/bin/bash

rm -f chrome-app.zip
zip -r chrome-app.zip chrome-app

echo ""
echo "Go to:"
echo ""
echo https://chrome.google.com/webstore/developer/dashboard
echo "edit -> Upload->update..."
