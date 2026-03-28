#!/bin/bash
# Launch KidTube on a local server
# Usage: ./start-kidtube.sh

PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  Starting KidTube..."
echo "  Open http://localhost:$PORT/kidtube.html in your browser"
echo "  Press Ctrl+C to stop"
echo ""

cd "$DIR" && python3 -m http.server $PORT
