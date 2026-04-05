#!/bin/bash
# One-click setup for English Reader
cd "$(dirname "$0")"

echo ""
echo "=== English Reader Setup ==="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required. Please install it first."
    echo "  macOS: brew install python3"
    echo "  Ubuntu: sudo apt install python3 python3-venv"
    exit 1
fi

# Create venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

# Create directories
mkdir -p books data

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Place your .epub files in the books/ folder"
echo "  2. Run ./start.sh to start reading"
echo ""
