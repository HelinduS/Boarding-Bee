#!/bin/bash
# Minimal Chrome launch test for CI
set -e

if command -v google-chrome >/dev/null 2>&1; then
  echo "Google Chrome version:" && google-chrome --version
  echo "Launching Chrome headless..."
  google-chrome --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --remote-debugging-port=9222 about:blank &
  sleep 3
  pkill chrome || true
  echo "Chrome launched and killed successfully."
elif command -v chromium-browser >/dev/null 2>&1; then
  echo "Chromium version:" && chromium-browser --version
  echo "Launching Chromium headless..."
  chromium-browser --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --remote-debugging-port=9222 about:blank &
  sleep 3
  pkill chromium || true
  echo "Chromium launched and killed successfully."
else
  echo "No Chrome or Chromium found in PATH!"
  exit 1
fi
