#!/bin/bash

# Remove all remaining TypeScript syntax from backend files
# This script removes non-null assertions, type annotations, and other TS syntax

BACKEND_DIR="/Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend"

echo "🔧 Removing all TypeScript syntax from backend..."

# 1. Remove non-null assertion operators (req.user!)
echo "  Removing non-null assertions..."
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/req\.user!/req.user/g' {} \;

# 2. Remove type annotations like 'let query: any =' or 'const obj: string ='
echo "  Removing type annotations..."
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: any = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: string = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: number = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: boolean = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: object = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: Array = /= /g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: Promise = /= /g' {} \;

# 3. Remove standalone type annotations (let query: any;)
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: any;/;/g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: string;/;/g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: number;/;/g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: boolean;/;/g' {} \;
find "$BACKEND_DIR/src" -name "*.js" -type f -exec sed -i '' 's/: object;/;/g' {} \;

echo "✅ Fixed all type annotations"

# Search for any remaining TypeScript syntax
echo ""
echo "🔍 Searching for any remaining TypeScript syntax..."

# Look for type annotations
REMAINING=$(find "$BACKEND_DIR/src" -name "*.js" -exec grep -Hn ':\s*\(any\|string\|number\|boolean\|object\|Array\|Promise\)\s*[=;]' {} \; | grep -v '://' | head -10)

if [ -n "$REMAINING" ]; then
    echo "❌ Found remaining TypeScript syntax:"
    echo "$REMAINING"
else
    echo "✅ No remaining TypeScript type annotations found"
fi

echo ""
echo "✅ Cleanup complete!"
