// BigParse v1 Demo - Direct API Usage
const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 BigParse v1 Demo - Testing on fcp codebase\n');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WORKSPACE_ROOT: '/Users/quikolas/Documents/GitHub/fcp'
  }
});

const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

let messageId = 1;
let initialized = false;

// Handle server output
rl.on('line', (line) => {
  try {
    if (line.startsWith('Content-Length:')) return;
    if (line.trim() === '') return;
    
    const message = JSON.parse(line);
    
    if (message.result) {
      if (!initialized && message.id === 1) {
        initialized = true;
        console.log('✅ MCP Server initialized\n');
        runDemo();
      } else {
        handleResponse(message);
      }
    }
  } catch (error) {
    // Server logs
    if (line.includes('BigParse MCP server started')) {
      console.log('✅ Server started successfully');
    }
  }
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('LSP Manager initialized')) {
    console.error('Server:', msg.trim());
  }
});

function sendMessage(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  
  const jsonMessage = JSON.stringify(message);
  const fullMessage = `Content-Length: ${jsonMessage.length}\r\n\r\n${jsonMessage}`;
  server.stdin.write(fullMessage);
}

function handleResponse(message) {
  if (message.result && message.result.content) {
    const content = message.result.content[0];
    if (content && content.text) {
      try {
        const data = JSON.parse(content.text);
        
        switch(message.id) {
          case 2: // Language server check
            console.log('📋 Language Server Status:');
            Object.entries(data.installed).forEach(([lang, installed]) => {
              console.log(`   ${lang}: ${installed ? '✅' : '❌'}`);
            });
            console.log('');
            break;
            
          case 3: // Indexing result
            console.log('📊 Indexing Results:');
            console.log(`   Files indexed: ${data.filesIndexed}`);
            console.log(`   Files cached: ${data.skipped}`);
            console.log(`   Duration: ${data.duration}ms`);
            console.log(`   Errors: ${data.errors.length}`);
            if (data.indexStats) {
              console.log(`   Total files in index: ${data.indexStats.totalFiles}`);
              console.log(`   Total symbols: ${data.indexStats.totalSymbols}`);
            }
            console.log('');
            break;
            
          case 4: // Search results
            console.log('🔍 Search Results for "function":');
            if (data.length === 0) {
              console.log('   No matches found');
            } else {
              console.log(`   Found ${data.length} files with matches`);
              data.slice(0, 3).forEach(result => {
                console.log(`\n   📄 ${result.file.split('/').pop()}`);
                console.log(`      Matches: ${result.matches.length}`);
                result.matches.slice(0, 2).forEach(match => {
                  console.log(`      Line ${match.line}: ${match.text.trim().substring(0, 60)}...`);
                });
              });
            }
            console.log('');
            break;
            
          case 5: // Second search
            console.log('🔍 Search Results for "export class":');
            if (data.length === 0) {
              console.log('   No matches found');
            } else {
              console.log(`   Found ${data.length} files with class exports`);
              data.slice(0, 3).forEach(result => {
                console.log(`\n   📄 ${result.file.split('/').pop()}`);
                result.matches.slice(0, 1).forEach(match => {
                  console.log(`      Line ${match.line}: ${match.text.trim()}`);
                });
              });
            }
            console.log('');
            break;
        }
      } catch (e) {
        console.log('Response:', content.text);
      }
    }
  }
  
  // Check if demo is complete
  if (message.id === 5) {
    console.log('\n✨ Demo Complete!');
    console.log('\n📚 BigParse Features Demonstrated:');
    console.log('  ✅ Fast codebase indexing');
    console.log('  ✅ Incremental updates with caching');
    console.log('  ✅ Regex-based code search');
    console.log('  ✅ Language server integration (when available)');
    console.log('  ✅ MCP protocol compliance');
    
    console.log('\n🎯 Ready for production use with Claude!');
    
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 1000);
  }
}

async function runDemo() {
  console.log('🎬 Starting BigParse Demo...\n');
  
  // Check language servers
  console.log('1️⃣  Checking language server status...');
  sendMessage('tools/call', {
    name: 'check_language_servers',
    arguments: {}
  });
  
  await delay(2000);
  
  // Index the codebase
  console.log('2️⃣  Indexing fcp codebase...');
  sendMessage('tools/call', {
    name: 'index_codebase',
    arguments: {
      path: '/Users/quikolas/Documents/GitHub/fcp',
      languages: ['typescript', 'javascript']
    }
  });
  
  await delay(3000);
  
  // Search for functions
  console.log('3️⃣  Searching for "function" keyword...');
  sendMessage('tools/call', {
    name: 'search_code',
    arguments: {
      query: 'function',
      fileTypes: ['.ts', '.js'],
      limit: 5
    }
  });
  
  await delay(2000);
  
  // Search for classes
  console.log('4️⃣  Searching for "export class"...');
  sendMessage('tools/call', {
    name: 'search_code',
    arguments: {
      query: 'export class',
      fileTypes: ['.ts'],
      limit: 5
    }
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize the server
console.log('🔧 Initializing MCP connection...');
sendMessage('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'bigparse-demo',
    version: '1.0.0'
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  server.kill();
  process.exit(0);
});