#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate

# Kill old process if running
lsof -ti:5100 | xargs kill -9 2>/dev/null
sleep 1

echo "Starting English Reader..."
open http://localhost:5100 &
python3 server.py
