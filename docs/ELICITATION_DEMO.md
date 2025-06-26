# BigParse Elicitation Demo

## How Elicitation Works

When you use BigParse tools that require a language server, it will check if the required server is installed. If not, it provides a helpful elicitation response.

### Example 1: Missing TypeScript Language Server

**User asks Claude**: "Show me all the classes in my TypeScript file"

**Claude uses**: `get_symbols` tool on a `.ts` file

**BigParse detects**: TypeScript language server is not installed

**Response with elicitation**:
```
The TypeScript Language Server is not installed. This language server would enable:

• Extract accurate symbols (classes, functions, interfaces)
• Find all references to a symbol across files
• Jump to symbol definitions
• Get type information and documentation
• Enable semantic code navigation

Without it, BigParse can still:
• Index and search files
• Use regex patterns
• Cache results for fast access

Would you like to:
1. Install TypeScript Language Server (run: npm install -g typescript-language-server typescript)
2. Continue without language server (basic features only)
3. See installation instructions

The language server uses ~150-300MB of memory when active.
```

### Example 2: Working with Flutter/Dart

**User**: "Find all StatelessWidget classes in my Flutter app"

**BigParse**: 
1. Detects `.dart` files
2. Checks for Dart language server
3. If missing, provides Flutter-specific installation guidance
4. If present, extracts all Flutter widget symbols

### Example 3: Resource-based Installation

BigParse also exposes installation scripts as resources:

```json
{
  "uri": "lsp://install/typescript",
  "name": "Install TypeScript Language Server",
  "description": "Install command: npm install -g typescript-language-server typescript"
}
```

Claude can read these resources to get installation scripts that users can run.

## Benefits of Elicitation

1. **Progressive Enhancement**: Start basic, add features as needed
2. **User Control**: Users decide what to install
3. **Transparency**: Clear about memory usage and benefits
4. **Graceful Degradation**: Always works, even without LSP

## Implementation Details

The elicitation system:
- Checks for language servers on-demand
- Caches results to avoid repeated checks
- Provides language-specific installation instructions
- Falls back to basic functionality when LSP unavailable
- Integrates with MCP's experimental elicitation protocol

This makes BigParse accessible to all users while providing advanced features for those who need them.