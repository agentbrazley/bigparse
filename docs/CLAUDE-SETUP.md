# BigParse is Installed for Claude Code! ✅

BigParse is now configured as an MCP server and will be available in all your Claude conversations.

## Current Status
- **Installed**: ✅ Yes
- **Server Name**: `bigparse`
- **Location**: `/Users/quikolas/Documents/GitHub/BigParse-v1`

## How to Use

### In Claude Code
Just start asking Claude about your code! BigParse tools are automatically available:

```
"Search for all TypeScript interfaces in this project"
"Find where handleMessage function is defined"
"Show me all React components"
"What's the structure of the WebSocket implementation?"
```

### Setting the Workspace
By default, BigParse uses the current working directory. To analyze a specific project:

```bash
# Option 1: Use the update script
./update-workspace.sh /path/to/your/project

# Option 2: Remove and re-add with environment variable
claude mcp remove bigparse -s local
claude mcp add bigparse "node" "/Users/quikolas/Documents/GitHub/BigParse-v1/dist/index.js" --env "WORKSPACE_ROOT=/path/to/project"
```

### Available Tools
Claude can now use these tools automatically:
- `index_codebase` - Index your project files
- `search_code` - Search with regex patterns
- `get_symbols` - Extract classes, functions, etc.
- `find_references` - Find all uses of a symbol
- `go_to_definition` - Jump to definitions
- `check_language_servers` - See what LSPs are installed
- `install_language_server` - Install language servers

## Troubleshooting

### Check if BigParse is running
```bash
claude mcp list
```

### View BigParse configuration
```bash
claude mcp get bigparse
```

### Remove BigParse
```bash
claude mcp remove bigparse -s local
```

### Re-install BigParse
```bash
./install-for-claude.sh
```

## Language Server Support

For best results, install language servers:

```bash
# TypeScript/JavaScript
npm install -g typescript-language-server typescript

# Python
pip install python-lsp-server

# Rust
rustup component add rust-analyzer

# Go
go install golang.org/x/tools/gopls@latest
```

## Tips for Best Results

1. **Index First**: Ask Claude to "index this codebase" when starting
2. **Be Specific**: "Find all async functions" works better than "show functions"
3. **Use Patterns**: BigParse supports regex, so "find export.*class" works
4. **Check Cache**: Re-indexing is super fast due to caching

## Example Claude Conversations

### Basic Search
```
You: Find all WebSocket-related code
Claude: [uses search_code("WebSocket")] 
Claude: I found WebSocket code in 3 files...
```

### Code Structure
```
You: What's the structure of the authentication module?
Claude: [uses get_symbols() on auth files]
Claude: The authentication module has these components...
```

### Refactoring Help
```
You: Help me refactor the error handling
Claude: [searches for try/catch and error patterns]
Claude: I've analyzed your error handling patterns...
```

BigParse makes Claude Code significantly more powerful for code analysis!