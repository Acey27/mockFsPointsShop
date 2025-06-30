#!/bin/bash

echo "🚀 Setting up Points Shop Application"
echo "=================================="

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL and make sure 'psql' is available"
    echo ""
    echo "On macOS with Homebrew:"
    echo "  brew install postgresql"
    echo "  brew services start postgresql"
    echo ""
    echo "Then create a database:"
    echo "  createdb points_shop"
    exit 1
fi

echo "✅ PostgreSQL found"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw points_shop; then
    echo "✅ Database 'points_shop' exists"
else
    echo "📦 Creating database 'points_shop'"
    createdb points_shop
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

echo ""
echo "📋 Setup Instructions:"
echo "====================="
echo ""
echo "1. Make sure your PostgreSQL connection details are correct in:"
echo "   server/.env"
echo ""
echo "2. Update the DATABASE_URL if needed:"
echo "   DATABASE_URL=postgresql://username:password@localhost:5432/points_shop"
echo ""
echo "3. Install dependencies (if not done already):"
echo "   npm install"
echo "   cd server && npm install && cd .."
echo ""
echo "4. Generate and run migrations:"
echo "   cd server"
echo "   npm run db:generate"
echo "   npm run db:migrate"
echo "   npm run db:seed"
echo ""
echo "5. Start the development servers:"
echo "   # Terminal 1 - Backend"
echo "   cd server && npm run dev"
echo ""
echo "   # Terminal 2 - Frontend" 
echo "   npm run dev"
echo ""
echo "6. Open your browser to:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🎉 Ready to go! Use the demo accounts from the README to login."
