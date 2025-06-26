"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTools = createTools;
function createTools() {
    return [
        {
            name: 'index_codebase',
            description: 'Index a codebase using VS Code LSP servers for advanced code analysis',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the codebase to index',
                    },
                    languages: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Optional: Specific languages to index (e.g., ["typescript", "python"])',
                    },
                },
                required: ['path'],
            },
        },
        {
            name: 'search_code',
            description: 'Search indexed code with semantic understanding from LSP',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query (supports regex and semantic search)',
                    },
                    fileTypes: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Optional: Filter by file types (e.g., [".ts", ".js"])',
                    },
                    limit: {
                        type: 'number',
                        description: 'Optional: Maximum number of results (default: 50)',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'get_symbols',
            description: 'Get symbols (classes, functions, variables) from a file using LSP',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file',
                    },
                    symbolType: {
                        type: 'string',
                        description: 'Optional: Filter by symbol type (e.g., "class", "function", "variable")',
                    },
                },
                required: ['filePath'],
            },
        },
        {
            name: 'find_references',
            description: 'Find all references to a symbol at a specific location',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file',
                    },
                    line: {
                        type: 'number',
                        description: 'Line number (0-based)',
                    },
                    character: {
                        type: 'number',
                        description: 'Character position in the line (0-based)',
                    },
                },
                required: ['filePath', 'line', 'character'],
            },
        },
        {
            name: 'go_to_definition',
            description: 'Find the definition of a symbol at a specific location',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file',
                    },
                    line: {
                        type: 'number',
                        description: 'Line number (0-based)',
                    },
                    character: {
                        type: 'number',
                        description: 'Character position in the line (0-based)',
                    },
                },
                required: ['filePath', 'line', 'character'],
            },
        },
        {
            name: 'install_language_server',
            description: 'Install a language server for enhanced code analysis',
            inputSchema: {
                type: 'object',
                properties: {
                    language: {
                        type: 'string',
                        description: 'Language to install the server for (e.g., "typescript", "python")',
                    },
                },
                required: ['language'],
            },
        },
        {
            name: 'check_language_servers',
            description: 'Check which language servers are installed',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ];
}
//# sourceMappingURL=index.js.map