#!/bin/bash

# Script to update BigParse workspace for Claude Code

if [ $# -eq 0 ]; then
    echo "Usage: ./update-workspace.sh <path-to-workspace>"
    echo "Example: ./update-workspace.sh /Users/quikolas/Documents/GitHub/myproject"
    exit 1
fi

WORKSPACE_PATH="$1"

# Remove and re-add with environment variable
claude mcp remove bigparse -s local 2>/dev/null
claude mcp add bigparse "node" "/Users/quikolas/Documents/GitHub/BigParse-v1/dist/index.js" --env "WORKSPACE_ROOT=$WORKSPACE_PATH"

echo "✅ BigParse updated to use workspace: $WORKSPACE_PATH"
claude mcp get bigparse