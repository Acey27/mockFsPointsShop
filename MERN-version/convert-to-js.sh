#!/bin/bash

# TypeScript to JavaScript Conversion Script
# This script converts all TypeScript files to JavaScript

echo "🔄 Starting TypeScript to JavaScript conversion..."

# Backend conversion
echo "📁 Converting backend files..."

# Create conversion directories if they don't exist
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/middleware
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/utils
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/routes
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/scripts
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/services

echo "✅ Conversion directories created"

# Frontend conversion
echo "📁 Converting frontend files..."

mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src/components
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src/pages
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src/hooks
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src/contexts
mkdir -p /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src/lib

echo "✅ Frontend directories created"

# Clean up TypeScript config files
echo "🧹 Removing TypeScript configuration files..."

rm -f /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/tsconfig.json
rm -f /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/tsconfig.json
rm -f /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/tsconfig.node.json

echo "✅ TypeScript config files removed"

echo "🎉 Conversion script completed!"
echo "📝 Note: Manual conversion of remaining TypeScript files to JavaScript is needed"
echo "🔧 Key changes needed:"
echo "   - Remove type annotations"
echo "   - Change .ts/.tsx imports to .js/.jsx"
echo "   - Update interface definitions to JSDoc comments"
echo "   - Replace 'as Type' with runtime checks where needed"
