# BigParse 🚀

An MCP (Model Context Protocol) server that gives Claude and other LLMs instant, intelligent access to your codebase. Think of it as "giving your LLM a GPS for your code" - instead of reading every file, BigParse lets LLMs navigate and search your codebase efficiently.

## Why BigParse?

### The Problem
Without BigParse, when you ask Claude about your code:
- You manually paste files (uses lots of context)
- Claude has to parse everything from scratch
- Limited to what fits in the context window
- No way to search across large codebases

### The Solution
With BigParse, Claude can:
- Search your entire codebase instantly
- Navigate to exact file locations and line numbers
- Understand code structure without reading every file
- Work with codebases of ANY size

## Features ✨

- **⚡ Lightning-fast code search** - Regex-based search across your entire codebase in milliseconds
- **🔍 Smart symbol extraction** - Extract classes, functions, interfaces using Language Server Protocol
- **💾 Intelligent caching** - Re-indexing is 1000x+ faster with smart caching
- **🌐 Multi-language support** - TypeScript, JavaScript, Python, Rust, Go, Dart/Flutter, and more
- **🔒 Secure subprocess handling** - Safe installation of language servers with command validation
- **🤖 MCP integration** - Seamlessly works with Claude Desktop and Claude Code
- **📊 Performance metrics** - See exactly how fast BigParse is working

## Installation

### Option 1: Claude Desktop (Auto-updating)

1. Add to Claude Desktop config:
   ```bash
   # macOS
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   notepad %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. Add BigParse to the `mcpServers` section:
   ```json
   {
     "mcpServers": {
       "BigParse": {
         "command": "npx",
         "args": ["bigparse"],
         "env": {
           "WORKSPACE_ROOT": "/path/to/your/projects"
         }
       }
     }
   }
   ```

3. Replace `/path/to/your/projects` with the directory you want to analyze
4. Restart Claude Desktop

**Benefits**: 
- ✅ Always runs the latest version
- ✅ No installation needed
- ✅ No manual updates
- ✅ Works on all platforms

### Option 2: Claude Code CLI

#### Prerequisites

- Node.js 16+
- npm or yarn

#### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/agentbrazley/BigParse.git
cd BigParse
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Install for Claude Code:
```bash
./scripts/install-for-claude.sh
```

Or manually:
```bash
claude mcp add bigparse "node" "$(pwd)/dist/index.js"
```

## Language Server Support

For enhanced features, install language servers:

```bash
# TypeScript/JavaScript
npm install -g typescript-language-server typescript

# Python
pip install python-lsp-server

# Rust
rustup component add rust-analyzer

# Go
go install golang.org/x/tools/gopls@latest

# Dart/Flutter
# Included with Flutter SDK
```

## How It Works

BigParse creates a searchable index of your codebase that LLMs can query efficiently:

1. **Indexing**: Scans your codebase and extracts symbols, creating a searchable map
2. **Caching**: Stores results for instant access on subsequent queries
3. **Search**: Uses optimized regex search with file type filtering
4. **LSP Integration**: Leverages language servers for accurate symbol extraction

### Performance Example

Without BigParse:
- Claude: "Please share your WebSocket files"
- You: *paste multiple large files*
- Context used: 5000+ tokens

With BigParse:
- Claude: *searches for "WebSocket"*
- Instant results with exact locations
- Context used: ~50 tokens

## Usage

Once installed, BigParse tools are automatically available in Claude. Just ask:

- "Search for all React components in this project"
- "Find where the WebSocket handler is defined"  
- "Show me all TypeScript interfaces"
- "What's the structure of this codebase?"

### Setting the Workspace

#### Claude Desktop
To change the workspace directory, edit your Claude Desktop config file and update the `WORKSPACE_ROOT` environment variable:

```json
{
  "mcpServers": {
    "BigParse": {
      "command": "node",
      "args": ["/path/to/BigParse/dist/index.js"],
      "env": {
        "WORKSPACE_ROOT": "/new/project/path"
      }
    }
  }
}
```

Then restart Claude Desktop.

#### Claude Code CLI
By default, BigParse uses the current directory. To analyze a specific project:

```bash
# Using the helper script
./scripts/update-workspace.sh /path/to/your/project

# Or with environment variable
claude mcp remove bigparse -s local
claude mcp add bigparse "node" "/path/to/BigParse/dist/index.js" --env "WORKSPACE_ROOT=/path/to/project"
```

### Available Tools

| Tool | Description | Example |
|------|-------------|---------||
| `index_codebase` | Index project files for searching | "Index this TypeScript project" |
| `search_code` | Search with regex patterns | "Find all async functions" |
| `get_symbols` | Extract symbols from files | "Show symbols in main.ts" |
| `find_references` | Find all references to a symbol | "Find all uses of WebSocketClient" |
| `go_to_definition` | Jump to symbol definition | "Go to definition of handleMessage" |
| `check_language_servers` | Check installed LSPs | "What language servers are installed?" |
| `install_language_server` | Install language servers | "Install TypeScript language server" |

## Configuration

### Supported Languages

- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
- Python (`.py`)
- Rust (`.rs`)
- Go (`.go`)
- Java (`.java`)
- C# (`.cs`)
- C/C++ (`.c`, `.cpp`, `.h`)
- Ruby (`.rb`)
- PHP (`.php`)
- Swift (`.swift`)
- Dart (`.dart`)

### Cache Location

BigParse stores its cache in `.bigparse/` within your project directory. Add this to `.gitignore`:

```
.bigparse/
```

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

### Project Structure

```
BigParse/
├── src/                    # TypeScript source files
│   ├── index.ts           # MCP server entry point
│   ├── lsp/               # Language Server Protocol integration
│   ├── indexing/          # Code indexing and caching
│   ├── tools/             # MCP tool definitions
│   └── subprocess/        # Secure subprocess handling
├── dist/                  # Compiled JavaScript
├── config/                # Language configurations
└── scripts/               # Helper scripts
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

BigParse includes security features to safely handle subprocess commands:

- Command whitelisting for language server installation
- Pattern detection to prevent command injection
- Validation of all subprocess operations

## Troubleshooting

### BigParse not showing in Claude

```bash
# Check if installed
claude mcp list

# Reinstall if needed
./install-for-claude.sh
```

### Language server not working

```bash
# Check installed servers
claude mcp get bigparse
# Then ask Claude to use check_language_servers tool
```

### Cache issues

```bash
# Clear cache
rm -rf .bigparse/
```

## License

MIT License - see [LICENSE](LICENSE) file

## Credits

Created by [Lancio AI](https://lancio.ai) (2025)

## Support

- Issues: [GitHub Issues](https://github.com/agentbrazley/BigParse/issues)
- Documentation: [Wiki](https://github.com/agentbrazley/BigParse/wiki)

---

Made with ❤️ for the Claude community