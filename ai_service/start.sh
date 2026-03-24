#!/bin/bash
# Start the AI Admin ML Microservice
# Run from the ai_service/ directory

echo "🤖 Starting Dairy AI Admin ML Service..."
echo ""

# Create virtual env if it doesn't exist
if [ ! -d "venv" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt -q

echo ""
echo "🚀 Starting FastAPI on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/docs"
echo ""

# Start server
python main.py
