# BigParse Examples

This directory contains example scripts demonstrating BigParse functionality.

## Available Examples

### test-indexing-only.js
Tests core indexing functionality without LSP features. Good for understanding basic BigParse operations.

```bash
node examples/test-indexing-only.js
```

### test-fcp-with-lsp.js
Full test with TypeScript Language Server integration, showing symbol extraction and advanced features.

```bash
node examples/test-fcp-with-lsp.js
```

### visual-demo.js
Visual demonstration comparing code search with and without BigParse, showing performance benefits.

```bash
node examples/visual-demo.js
```

### demo.js
Interactive MCP protocol demo showing how BigParse communicates with Claude.

```bash
node examples/demo.js
```

## Running Examples

1. First build BigParse:
```bash
npm run build
```

2. Install TypeScript language server for full features:
```bash
npm install -g typescript-language-server typescript
```

3. Run any example:
```bash
node examples/[example-name].js
```

## Creating Your Own Examples

Examples should demonstrate specific BigParse features:
- Indexing performance
- Search capabilities
- LSP integration
- Cache efficiency
- Security features

Place new examples in this directory with descriptive names.