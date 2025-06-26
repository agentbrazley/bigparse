#!/bin/bash

echo "🔧 Language Server Quick Installer for BigParse"
echo ""
echo "This will install the most common language server (TypeScript)."
echo "You can install others as needed."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    echo "Please install Node.js first: https://nodejs.org"
    exit 1
fi

# TypeScript/JavaScript
if command -v typescript-language-server &> /dev/null; then
    echo "✅ TypeScript language server already installed"
else
    echo "📦 Installing TypeScript language server..."
    npm install -g typescript-language-server typescript
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript language server installed"
    else
        echo "⚠️  Failed to install TypeScript language server"
    fi
fi

echo ""
echo "🎉 Done! To install other language servers, run:"
echo ""
echo "  Python:  pip install python-lsp-server"
echo "  Rust:    rustup component add rust-analyzer"
echo "  Go:      go install golang.org/x/tools/gopls@latest"
echo "  C/C++:   brew install llvm  # macOS"
echo "           apt-get install clangd  # Linux"
echo ""
echo "💡 BigParse works without language servers too!"
echo "   Without LSP: File indexing, regex search"
echo "   With LSP: Symbol extraction, find references, go to definition"