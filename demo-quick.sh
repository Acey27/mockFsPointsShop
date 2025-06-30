#!/bin/bash

echo "🚀 Points Shop Demo Launcher"
echo "============================"

# Check if PostgreSQL is available
if command -v psql >/dev/null 2>&1; then
    echo "✓ PostgreSQL found"
    DB_AVAILABLE=true
else
    echo "⚠ PostgreSQL not found - will use in-memory database for demo"
    DB_AVAILABLE=false
fi

# Check if Node.js is available
if command -v node >/dev/null 2>&1; then
    echo "✓ Node.js found"
else
    echo "✗ Node.js not found. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
echo ""
echo "📦 Installing dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build the backend
echo ""
echo "🔨 Building backend..."
cd server
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "✅ All dependencies installed and backend built successfully!"
echo ""
echo "🎯 Next Steps:"
echo "=============="

if [ "$DB_AVAILABLE" = true ]; then
    echo "1. Set up PostgreSQL database:"
    echo "   - Create database: createdb points_shop"
    echo "   - Run migrations: cd server && npm run db:migrate"
    echo "   - Seed data: npm run db:seed"
    echo ""
    echo "2. Start the backend:"
    echo "   cd server && npm run dev"
    echo ""
    echo "3. In another terminal, start the frontend:"
    echo "   npm run dev"
else
    echo "1. Start the backend (with in-memory database):"
    echo "   cd server && npm run dev"
    echo ""
    echo "2. In another terminal, start the frontend:"
    echo "   npm run dev"
    echo ""
    echo "   Note: Data will not persist between restarts in demo mode."
fi

echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🧪 Test the API:"
echo "   ./test-api.sh"
echo ""
echo "📖 For full setup instructions, see README.md"
