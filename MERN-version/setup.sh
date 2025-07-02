#!/bin/bash

# Points Shop MERN Stack Setup Script
echo "🚀 Setting up Points Shop MERN Stack Application"
echo "================================================"

# Check if we're in the right directory
if [ ! -d "MERN-version" ]; then
    echo "❌ Error: MERN-version directory not found!"
    echo "Please run this script from the mockFsPointsShop directory"
    exit 1
fi

cd MERN-version

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🗄️ Setting up database..."

# Initialize database schema
echo "🗄️ Initializing database schema..."
cd backend
npm run schema:init

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
npm run seed

cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎯 What's been set up:"
echo "   ✅ MongoDB Atlas database connected"
echo "   ✅ Database schema initialized with indexes"
echo "   ✅ Sample data seeded (users, products, transactions, moods)"
echo "   ✅ Backend API server ready"
echo "   ✅ Frontend React app ready"
echo ""
echo "🔧 Available commands:"
echo "   npm run dev        - Start both frontend and backend"
echo "   npm run dev:backend - Start backend only"
echo "   npm run dev:frontend - Start frontend only"
echo "   npm run build      - Build both applications"
echo "   npm run schema:init - Reinitialize database schema"
echo "   npm run seed       - Reseed database with sample data"
echo ""
echo "🌐 Once started, access the application at:"
echo "   Frontend: http://localhost:5174"
echo "   Backend API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api-docs"
echo ""
echo "🔑 Demo login credentials:"
echo "   Admin: admin@pointsshop.com / Admin123!"
echo "   User: francis.jelo@company.com / Password123!"
echo "   User: zeann.palma@company.com / Password123!"
echo ""
echo "🎉 Ready to start developing!"
echo "Run 'npm run dev' to start both servers"
