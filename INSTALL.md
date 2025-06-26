# BigParse Installation Guide

## Quick Install for Claude Code

```bash
# Clone the repository
git clone https://github.com/agentbrazley/BigParse.git
cd BigParse

# Install dependencies and build
npm install
npm run build

# Install for Claude Code
./scripts/install-for-claude.sh
```

That's it! BigParse is now available in all your Claude conversations.

## Manual Installation

### Step 1: Prerequisites

Ensure you have:
- Node.js 16+ installed
- npm or yarn
- Claude Code installed

### Step 2: Clone and Build

```bash
git clone https://github.com/agentbrazley/BigParse.git
cd BigParse
npm install
npm run build
```

### Step 3: Add to Claude Code

```bash
claude mcp add bigparse "node" "$(pwd)/dist/index.js"
```

### Step 4: Verify Installation

```bash
claude mcp list
# Should show: bigparse: node /path/to/BigParse/dist/index.js
```

## Language Server Installation

For full functionality, install language servers for your languages:

### TypeScript/JavaScript
```bash
npm install -g typescript-language-server typescript
```

### Python
```bash
pip install python-lsp-server
# or
pip3 install python-lsp-server
```

### Rust
```bash
rustup component add rust-analyzer
```

### Go
```bash
go install golang.org/x/tools/gopls@latest
```

### Other Languages
See the README for additional language server installation commands.

## Setting Your Workspace

BigParse analyzes the current directory by default. To set a specific project:

```bash
./scripts/update-workspace.sh /path/to/your/project
```

Or manually:
```bash
claude mcp remove bigparse -s local
claude mcp add bigparse "node" "/path/to/BigParse/dist/index.js" --env "WORKSPACE_ROOT=/path/to/project"
```

## Troubleshooting

### BigParse not showing in Claude

1. Check installation:
```bash
claude mcp list
```

2. If not listed, reinstall:
```bash
./scripts/install-for-claude.sh
```

### Language server errors

1. Check if language server is installed:
```bash
which typescript-language-server  # or other language server
```

2. Install if missing (see Language Server Installation above)

### Permission errors

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Build errors

1. Check Node version:
```bash
node --version  # Should be 16+
```

2. Clean and rebuild:
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Uninstalling

To remove BigParse from Claude Code:

```bash
claude mcp remove bigparse -s local
```

## Getting Help

- Check the [README](README.md) for usage instructions
- Open an issue on [GitHub](https://github.com/agentbrazley/BigParse/issues)
- See [CONTRIBUTING.md](CONTRIBUTING.md) to help improve BigParse