#!/bin/bash

# Quick TypeScript to JavaScript conversion helper
# Usage: ./quick-convert.sh [file.ts]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <typescript-file>"
    echo "Example: $0 src/routes/auth.ts"
    exit 1
fi

input_file="$1"
if [[ "$input_file" == *.tsx ]]; then
    output_file="${input_file%.tsx}.jsx"
elif [[ "$input_file" == *.ts ]]; then
    output_file="${input_file%.ts}.js"
else
    echo "Error: File must have .ts or .tsx extension"
    exit 1
fi

if [ ! -f "$input_file" ]; then
    echo "Error: File $input_file not found"
    exit 1
fi

echo "🔄 Converting $input_file to $output_file..."

# Basic conversion patterns
sed \
    -e 's/: [A-Za-z<>|&\[\]{}_, ()]*//g' \
    -e 's/: = (/= (/g' \
    -e 's/interface [A-Za-z]* {/\/\* Interface removed - convert to JSDoc if needed \*\//g' \
    -e 's/export interface.*{/\/\* Interface removed - convert to JSDoc if needed \*\//g' \
    -e 's/React\.FC[<>A-Za-z{}_, ]*//g' \
    -e 's/React\.ReactNode//g' \
    -e 's/ as [A-Za-z<>]*//g' \
    -e 's/\.ts"/.js"/g' \
    -e 's/\.tsx"/.jsx"/g' \
    -e '/^import.*{ Request, Response, NextFunction }/d' \
    -e 's/import { Request, Response, NextFunction } from .express.;//' \
    "$input_file" > "$output_file"

echo "✅ Conversion completed!"
echo "📝 Please review $output_file and:"
echo "   - Remove any remaining type definitions"
echo "   - Update complex interfaces to JSDoc comments"
echo "   - Test the functionality"
