@echo off
title Divine Classes - Deploy Update (Windows)
cd /d "%~dp0\.."

echo ======================================================================
echo DIVINE CLASSES - OVER-THE-AIR LIVE DEPLOYMENT (WINDOWS)
echo ======================================================================
echo This will push your latest code to the cloud and update all
echo installed Android APKs and web apps without reinstalling!
echo ======================================================================
echo.

set DEPLOYMENT_ID=AKfycbySJOW4-AlwDHziPVoLCsz-X3LAf9CWurzGsJtyyxa4qIi7n9yh-A3lLatRUsOaN_sf

echo 1. Pushing files to Google Apps Script...
call npx @google/clasp push
if errorlevel 1 (
    echo [ERROR] Clasp push failed. Please check your credentials or internet connection.
    pause
    exit /b 1
)

echo.
echo 2. Updating live deployment (%DEPLOYMENT_ID%)...
call npx @google/clasp deploy -i %DEPLOYMENT_ID% -d "Windows 11 update deployed"
if errorlevel 1 (
    echo [ERROR] Deployment update failed.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo SUCCESS! Your changes are now LIVE!
echo All mobile phones running the APK will receive this update on next open.
echo ======================================================================
pause

