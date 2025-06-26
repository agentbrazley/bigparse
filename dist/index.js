"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const manager_js_1 = require("./lsp/manager.js");
const indexer_js_1 = require("./indexing/indexer.js");
const index_js_2 = require("./tools/index.js");
const language_servers_js_1 = require("./resources/language-servers.js");
const lsp_check_js_1 = require("./elicitation/lsp-check.js");
const language_detection_js_1 = require("./utils/language-detection.js");
const installer_js_1 = require("./subprocess/installer.js");
const server = new index_js_1.Server({
    name: 'bigparse-mcp-server',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
let indexer;
let lspManager;
let installer;
async function initializeServices() {
    const rootPath = process.env.WORKSPACE_ROOT || process.cwd();
    indexer = new indexer_js_1.CodeIndexer(rootPath);
    lspManager = (0, manager_js_1.setupLanguageServers)(rootPath);
    installer = new installer_js_1.LanguageServerInstaller();
    await indexer.initialize();
    // Set up progress reporting
    indexer.on('indexing-start', (data) => {
        console.error('Indexing started:', data);
    });
    indexer.on('indexing-progress', (data) => {
        console.error(`Indexing progress: ${data.processed}/${data.total} files`);
    });
    indexer.on('indexing-complete', (data) => {
        console.error('Indexing complete:', data);
    });
}
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: (0, index_js_2.createTools)(),
    };
});
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
    return {
        resources: (0, language_servers_js_1.createLanguageServerResources)(),
    };
});
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const result = await (0, language_servers_js_1.handleResourceRead)(uri);
    return {
        contents: [
            {
                uri,
                mimeType: 'text/plain',
                text: result.content,
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'index_codebase': {
            const { path, languages } = args;
            if (!path) {
                throw new Error('Path is required for indexing');
            }
            const result = await indexer.indexCodebase(path, languages);
            // Include cache stats in response
            const cacheStats = await indexer.getCacheStats();
            const indexStats = indexer.getIndexStats();
            const response = {
                ...result,
                cacheStats,
                indexStats,
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(response, null, 2),
                    },
                ],
            };
        }
        case 'search_code': {
            const { query, fileTypes, limit } = args;
            const results = await indexer.searchCode(query, { fileTypes, limit });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        case 'get_symbols': {
            const { filePath, symbolType } = args;
            // Check if language server is available
            const language = (0, language_detection_js_1.detectLanguage)(filePath);
            const elicitation = await (0, lsp_check_js_1.checkAndElicitLSP)(language);
            if (elicitation) {
                // Language server not installed, return elicitation
                return {
                    content: [
                        {
                            type: 'text',
                            text: (0, lsp_check_js_1.createElicitationPrompt)(elicitation),
                        },
                    ],
                    isError: false,
                    _meta: {
                        elicitation: {
                            type: 'install_language_server',
                            language: elicitation.language,
                            serverName: elicitation.serverName,
                            installCommand: elicitation.installCommand,
                        }
                    }
                };
            }
            const symbols = await lspManager.getDocumentSymbols(filePath, symbolType);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(symbols, null, 2),
                    },
                ],
            };
        }
        case 'find_references': {
            const { filePath, line, character } = args;
            const references = await lspManager.findReferences(filePath, line, character);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(references, null, 2),
                    },
                ],
            };
        }
        case 'go_to_definition': {
            const { filePath, line, character } = args;
            const definition = await lspManager.goToDefinition(filePath, line, character);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(definition, null, 2),
                    },
                ],
            };
        }
        case 'install_language_server': {
            const { language } = args;
            // Set up progress reporting
            const progressMessages = [];
            installer.on('progress', (progress) => {
                progressMessages.push(progress.message);
                if (progress.output) {
                    progressMessages.push(progress.output);
                }
            });
            const result = await installer.installLanguageServer(language);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            ...result,
                            progressLog: progressMessages
                        }, null, 2),
                    },
                ],
            };
        }
        case 'check_language_servers': {
            const status = await (0, language_servers_js_1.getLanguageServerStatus)();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            installed: status,
                            summary: Object.entries(status)
                                .map(([lang, installed]) => `${lang}: ${installed ? '✅ installed' : '❌ not installed'}`)
                                .join('\n')
                        }, null, 2),
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
async function main() {
    try {
        await initializeServices();
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error('BigParse MCP server started successfully');
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.error('Shutting down...');
            await indexer.shutdown();
            await lspManager.shutdown();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.error('Shutting down...');
            await indexer.shutdown();
            await lspManager.shutdown();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map