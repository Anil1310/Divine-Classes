#!/bin/bash
# ==============================================================================
# Divine Classes — 1-Click Mobile & Web Deployment Script
# Double-click this file in macOS Finder to push code updates to all mobile APKs!
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/.."

echo "======================================================================"
echo "🚀 DIVINE CLASSES — OVER-THE-AIR LIVE DEPLOYMENT"
echo "======================================================================"
echo "This will push your latest code to the cloud and update all"
echo "installed Android APKs and web apps without reinstalling!"
echo "======================================================================"
echo ""

# Locate clasp
if [ -f "$HOME/.local/bin/clasp" ]; then
    CLASP_BIN="$HOME/.local/bin/clasp"
elif command -v clasp &>/dev/null; then
    CLASP_BIN="clasp"
elif command -v npx &>/dev/null; then
    CLASP_BIN="npx @google/clasp"
else
    echo "❌ Error: Google Clasp CLI not found."
    exit 1
fi

DEPLOYMENT_ID="AKfycbySJOW4-AlwDHziPVoLCsz-X3LAf9CWurzGsJtyyxa4qIi7n9yh-A3lLatRUsOaN_sf"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "📦 1. Pushing files to Google Apps Script..."
"$CLASP_BIN" push
if [ $? -ne 0 ]; then
    echo "❌ Clasp push failed. Please check your internet connection."
    read -n 1 -s
    exit 1
fi

echo ""
echo "🌐 2. Updating live deployment ($DEPLOYMENT_ID)..."
"$CLASP_BIN" deploy -i "$DEPLOYMENT_ID" -d "Update deployed at $TIMESTAMP"
if [ $? -ne 0 ]; then
    echo "❌ Deployment update failed."
    read -n 1 -s
    exit 1
fi

echo ""
echo "======================================================================"
echo "🎉 SUCCESS! Your changes are now LIVE!"
echo "📱 All mobile phones running the APK will receive this update on next open."
echo "======================================================================"
echo "Press any key to close this window..."
read -n 1 -s

