#!/bin/bash

echo "🚀 Installing BigParse for Claude Code"
echo "===================================="

# Check if already installed
if claude mcp list | grep -q "bigparse"; then
    echo "⚠️  BigParse is already installed!"
    echo ""
    claude mcp get bigparse
    echo ""
    echo "To update the workspace, use:"
    echo "  ./update-workspace.sh /path/to/your/project"
    exit 0
fi

# Install BigParse
echo "📦 Adding BigParse MCP server..."
claude mcp add bigparse "node" "/Users/quikolas/Documents/GitHub/BigParse-v1/dist/index.js"

echo ""
echo "✅ BigParse installed successfully!"
echo ""
echo "📋 Available tools in Claude:"
echo "  • index_codebase - Index TypeScript/JavaScript files"
echo "  • search_code - Search for patterns in code"
echo "  • get_symbols - Extract symbols from files"
echo "  • find_references - Find all references to a symbol"
echo "  • go_to_definition - Jump to symbol definition"
echo "  • check_language_servers - Check installed language servers"
echo "  • install_language_server - Install a language server"
echo ""
echo "🎯 To use BigParse:"
echo "  1. Start a new Claude conversation"
echo "  2. BigParse will automatically be available"
echo "  3. Ask Claude to search or analyze your code!"
echo ""
echo "💡 To set a specific workspace:"
echo "  ./update-workspace.sh /path/to/your/project"
echo ""
echo "📝 Example commands for Claude:"
echo '  - "Search for all React components in this project"'
echo '  - "Find all async functions"'
echo '  - "Show me the structure of websocket-client.ts"'
echo '  - "Find all references to WebSocketCommand"'