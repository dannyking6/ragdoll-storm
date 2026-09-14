#!/usr/bin/env bash
# Serve this game over local HTTP (file:// will not work with WebGL builds).
PORT="${PORT:-8000}"
python3 -m http.server "$PORT" --bind 0.0.0.0
