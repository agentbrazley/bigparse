#!/usr/bin/env node

// Simple test of BigParse functionality without LSP conflicts
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing BigParse v1 on fcp codebase\n');

// Use environment variable to set the workspace
process.env.WORKSPACE_ROOT = '/Users/quikolas/Documents/GitHub/fcp';

const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    WORKSPACE_ROOT: '/Users/quikolas/Documents/GitHub/fcp'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code || 0);
});

// Give the server time to start
setTimeout(() => {
  console.log('\n📌 BigParse MCP server is running!');
  console.log('📂 Workspace: /Users/quikolas/Documents/GitHub/fcp');
  console.log('\n🔧 Available tools:');
  console.log('  - index_codebase: Index TypeScript/JavaScript files');
  console.log('  - search_code: Search for patterns in code');
  console.log('  - get_symbols: Extract symbols from files (requires LSP)');
  console.log('  - find_references: Find all references to a symbol');
  console.log('  - go_to_definition: Jump to symbol definition');
  console.log('  - check_language_servers: Check installed language servers');
  console.log('  - install_language_server: Install a language server');
  console.log('\n✨ To use with Claude:');
  console.log('  1. Configure this server in your MCP settings');
  console.log('  2. Claude will automatically discover available tools');
  console.log('  3. Ask Claude to index and search your codebase!');
  console.log('\n⚡ Example queries for Claude:');
  console.log('  - "Index the TypeScript files in this project"');
  console.log('  - "Search for all React components"');
  console.log('  - "Find all uses of the useState hook"');
  console.log('  - "Show me the class hierarchy"');
  console.log('\nPress Ctrl+C to stop the server...');
}, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down BigParse server...');
  server.kill('SIGTERM');
  setTimeout(() => {
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }, 5000);
});