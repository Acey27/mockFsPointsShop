#!/bin/bash

echo "🚀 Starting MERN-version servers..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from the MERN-version directory"
    exit 1
fi

# Start MongoDB if using Docker
echo "📦 Starting MongoDB container..."
docker-compose up -d mongo 2>/dev/null || echo "⚠️  Docker not available or already running"

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing backend dependencies..."
        npm install
    fi
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend server..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing frontend dependencies..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    cd ..
}

# Start both servers
start_backend
sleep 3
start_frontend

echo ""
echo "🎯 Servers are starting up..."
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "💡 Test the enhanced Transaction History:"
echo "   1. Login with: alice.johnson@company.com / password123"
echo "   2. Navigate to Points page"
echo "   3. Check the Transaction History section"
echo "   4. Test filtering by received/spent points"
echo ""
echo "⏹️  To stop servers: kill $BACKEND_PID $FRONTEND_PID"
echo "   Or press Ctrl+C in each terminal"

# Keep script running
wait
