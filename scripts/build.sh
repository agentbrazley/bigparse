#!/bin/bash

echo "🔨 Building BigParse MCP Server..."

# Clean dist directory
rm -rf dist

# Run TypeScript compiler
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# Build the project
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Copy configuration files
mkdir -p dist/config
cp src/config/languages.json dist/config/

echo "✅ Build completed successfully"
echo "📦 Output directory: dist/"