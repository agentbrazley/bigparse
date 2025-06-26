# Language Server Installation Guide

## Memory Considerations

Language servers can use significant memory (100-500MB each when active). Here are recommended strategies:

### Option 1: Install Only What You Need (Recommended)

Install only the language servers for languages you actively use:

```bash
# If you primarily work with TypeScript/JavaScript
npm install -g typescript-language-server typescript

# If you work with Python
pip install python-lsp-server

# If you work with Go
go install golang.org/x/tools/gopls@latest
```

### Option 2: Lazy Installation

BigParse starts language servers on-demand, so you can install them as needed:

1. Start with no language servers
2. BigParse will still work for basic file indexing and regex search
3. Install language servers when you need advanced features (symbols, references, definitions)

### Option 3: Docker Container (For Multiple Languages)

Create a Docker container with all language servers pre-installed:

```dockerfile
FROM node:20-slim

# Install language servers
RUN npm install -g typescript-language-server typescript
RUN apt-get update && apt-get install -y python3-pip
RUN pip3 install python-lsp-server
# ... add more as needed

# Install BigParse
COPY . /app
WORKDIR /app
RUN npm install && npm run build

CMD ["node", "dist/index.js"]
```

## Language Server Memory Usage

| Language Server | Idle Memory | Active Memory | Startup Time |
|----------------|-------------|---------------|--------------|
| TypeScript     | ~150MB      | 200-500MB     | 2-5s         |
| Python (pylsp) | ~100MB      | 150-300MB     | 1-3s         |
| Rust Analyzer  | ~200MB      | 300-800MB     | 3-10s        |
| Gopls          | ~150MB      | 200-400MB     | 2-4s         |
| Clangd (C++)   | ~100MB      | 200-600MB     | 2-5s         |

## Minimal Installation Script

For a balanced setup with the most common languages:

```bash
#!/bin/bash
# install-common-lsp.sh

echo "Installing common language servers..."

# TypeScript/JavaScript (most common)
if ! command -v typescript-language-server &> /dev/null; then
    echo "Installing TypeScript language server..."
    npm install -g typescript-language-server typescript
fi

# Python
if ! command -v pylsp &> /dev/null; then
    echo "Installing Python language server..."
    pip install python-lsp-server
fi

echo "Done! You can install more language servers as needed."
```

## BigParse Without Language Servers

BigParse still provides value without language servers:

1. **Fast file indexing** - Scans and caches file contents
2. **Regex search** - Search across all indexed files
3. **File navigation** - Find files by pattern
4. **Incremental updates** - Only re-index changed files

Language servers add:
- Accurate symbol extraction
- Find references across files
- Go to definition
- Type-aware search

## Recommendations

1. **For Claude Desktop users**: Start with TypeScript LSP only (most common)
2. **For teams**: Use Docker with pre-configured language servers
3. **For personal use**: Install on-demand as you work with different languages
4. **For low-memory systems**: Use BigParse without LSP for basic search