#!/bin/bash
# ==============================================================================
# Divine Classes — 1-Click Automated Database Initializer
# Double-click this file in macOS Finder or run from IDE to recreate fresh tables!
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/.."

echo "======================================================================"
echo "⚡ DIVINE CLASSES — 1-CLICK AUTOMATED DATABASE SETUP"
echo "======================================================================"
echo "Starting automated fresh database rebuild and data insertion..."
echo ""

if [ -f "/opt/homebrew/bin/python3.14" ]; then
    PYTHON_BIN="/opt/homebrew/bin/python3.14"
elif command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
else
    echo "❌ Error: Python 3 not found!"
    exit 1
fi

"$PYTHON_BIN" "$DIR/1_Init_Database.py" --fresh

echo ""
echo "======================================================================"
echo "✅ Finished! Press any key to close this window..."
echo "======================================================================"
read -n 1 -s

