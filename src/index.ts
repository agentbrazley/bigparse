import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { setupLanguageServers, LSPManager } from './lsp/manager.js';
import { CodeIndexer } from './indexing/indexer.js';
import { createTools } from './tools/index.js';
import { createLanguageServerResources, handleResourceRead, getLanguageServerStatus } from './resources/language-servers.js';
import { checkAndElicitLSP, createElicitationPrompt } from './elicitation/lsp-check.js';
import { detectLanguage } from './utils/language-detection.js';
import { LanguageServerInstaller } from './subprocess/installer.js';

const server = new Server(
  {
    name: 'bigparse-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

let indexer: CodeIndexer;
let lspManager: LSPManager;
let installer: LanguageServerInstaller;

async function initializeServices() {
  const rootPath = process.env.WORKSPACE_ROOT || process.cwd();
  
  indexer = new CodeIndexer(rootPath);
  lspManager = setupLanguageServers(rootPath);
  installer = new LanguageServerInstaller();
  
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: createTools(),
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: createLanguageServerResources(),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const result = await handleResourceRead(uri);
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'index_codebase': {
      const { path, languages } = args as { path: string; languages?: string[] };
      
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
      const { query, fileTypes, limit } = args as {
        query: string;
        fileTypes?: string[];
        limit?: number;
      };
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
      const { filePath, symbolType } = args as {
        filePath: string;
        symbolType?: string;
      };
      
      // Check if language server is available
      const language = detectLanguage(filePath);
      const elicitation = await checkAndElicitLSP(language);
      
      if (elicitation) {
        // Language server not installed, return elicitation
        return {
          content: [
            {
              type: 'text',
              text: createElicitationPrompt(elicitation),
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
      const { filePath, line, character } = args as {
        filePath: string;
        line: number;
        character: number;
      };
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
      const { filePath, line, character } = args as {
        filePath: string;
        line: number;
        character: number;
      };
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
      const { language } = args as { language: string };
      
      // Set up progress reporting
      const progressMessages: string[] = [];
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
      const status = await getLanguageServerStatus();
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
    
    const transport = new StdioServerTransport();
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});