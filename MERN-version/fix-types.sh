#!/bin/bash

# Fix remaining TypeScript annotations in JavaScript files
echo "🔧 Fixing remaining TypeScript annotations..."

# Fix parameter type annotations
find frontend/src -name "*.jsx" -exec sed -i '' 's/(e: React\.FormEvent)/(e)/g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/(e: React\.ChangeEvent<[^>]*>)/(e)/g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/(e: React\.MouseEvent<[^>]*>)/(e)/g' {} \;

# Fix variable type annotations
find frontend/src -name "*.jsx" -exec sed -i '' 's/: any//g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/: string//g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/: number//g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/: boolean//g' {} \;

# Fix function parameter patterns like (item: any, index: number)
find frontend/src -name "*.jsx" -exec sed -i '' 's/(\([a-zA-Z_][a-zA-Z0-9_]*\): any, \([a-zA-Z_][a-zA-Z0-9_]*\): number)/(\1, \2)/g' {} \;
find frontend/src -name "*.jsx" -exec sed -i '' 's/(\([a-zA-Z_][a-zA-Z0-9_]*\): any)/(\1)/g' {} \;

# Fix destructuring patterns with types
find frontend/src -name "*.jsx" -exec sed -i '' 's/([,a]: any, [,b]: any)/([,a], [,b])/g' {} \;

# Fix component prop patterns
find frontend/src -name "*.jsx" -exec sed -i '' 's/: :[^=]*; [^}]*}>//g' {} \;

echo "✅ TypeScript annotation cleanup completed!"
