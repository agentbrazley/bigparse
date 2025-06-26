const { spawn } = require('child_process');
const readline = require('readline');

console.log('🧪 Testing BigParse v1 on Director Codebase\n');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WORKSPACE_ROOT: '/Users/quikolas/Documents/GitHub/Director/Director'
  }
});

const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

let messageId = 1;

// Handle server output
rl.on('line', (line) => {
  try {
    if (line.startsWith('Content-Length:')) return;
    if (line.trim() === '') return;
    
    const message = JSON.parse(line);
    if (message.result) {
      console.log('\n📨 Response:', JSON.stringify(message.result, null, 2));
    }
  } catch (error) {
    // Server logs
    if (!line.includes('BigParse MCP server started') && 
        !line.includes('LSP Manager initialized')) {
      console.log('Server:', line);
    }
  }
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  console.error('Server log:', msg);
});

function sendMessage(message) {
  const jsonMessage = JSON.stringify({ ...message, jsonrpc: '2.0', id: messageId++ });
  const fullMessage = `Content-Length: ${jsonMessage.length}\r\n\r\n${jsonMessage}`;
  server.stdin.write(fullMessage);
}

async function runTests() {
  // 1. Initialize
  console.log('1️⃣  Initializing MCP connection...\n');
  sendMessage({
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'bigparse-test',
        version: '1.0.0'
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Check language servers
  console.log('\n2️⃣  Checking installed language servers...\n');
  sendMessage({
    method: 'tools/call',
    params: {
      name: 'check_language_servers',
      arguments: {}
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. Try to get symbols (will trigger elicitation if TypeScript LSP not installed)
  console.log('\n3️⃣  Attempting to get symbols from main.ts...\n');
  sendMessage({
    method: 'tools/call',
    params: {
      name: 'get_symbols',
      arguments: {
        filePath: '/Users/quikolas/Documents/GitHub/Director/Director/src/main.ts'
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Index the codebase
  console.log('\n4️⃣  Indexing Director codebase...\n');
  sendMessage({
    method: 'tools/call',
    params: {
      name: 'index_codebase',
      arguments: {
        path: '/Users/quikolas/Documents/GitHub/Director/Director',
        languages: ['typescript']
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // 5. Search for specific patterns
  console.log('\n5️⃣  Searching for "class Director"...\n');
  sendMessage({
    method: 'tools/call',
    params: {
      name: 'search_code',
      arguments: {
        query: 'class Director',
        fileTypes: ['.ts'],
        limit: 5
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 6. If you want to test installation (uncomment to test)
  /*
  console.log('\n6️⃣  Installing TypeScript language server...\n');
  sendMessage({
    method: 'tools/call',
    params: {
      name: 'install_language_server',
      arguments: {
        language: 'typescript'
      }
    }
  });
  await new Promise(resolve => setTimeout(resolve, 10000));
  */

  console.log('\n✅ Test complete!\n');
  
  setTimeout(() => {
    server.kill();
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  server.kill();
  process.exit(0);
});

// Start tests
setTimeout(runTests, 500);