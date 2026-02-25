#!/bin/bash
echo "🚀 Starting NovaWork Global locally..."

# Function to kill child processes on exit
trap 'kill $(jobs -p)' EXIT

# Check for backend setup
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check for frontend setup
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "🔌 Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "💻 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ App is running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop."

wait
