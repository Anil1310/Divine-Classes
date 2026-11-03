@echo off
title Divine Classes - Local Preview Server
cd /d "%~dp0\.."
echo ======================================================================
echo DIVINE CLASSES - LOCAL OFFLINE PREVIEW SERVER (WINDOWS)
echo ======================================================================
python Automation\2_Local_Preview.py
if errorlevel 1 (
    py Automation\2_Local_Preview.py
)
pause

