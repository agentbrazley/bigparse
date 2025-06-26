import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

interface LanguageServerInfo {
  name: string;
  command: string;
  installCommand: string;
  installInstructions: string;
  checkCommand: string;
}

export const LANGUAGE_SERVERS: Record<string, LanguageServerInfo> = {
  typescript: {
    name: 'TypeScript Language Server',
    command: 'typescript-language-server',
    installCommand: 'npm install -g typescript-language-server typescript',
    installInstructions: 'Install Node.js first, then run: npm install -g typescript-language-server typescript',
    checkCommand: 'typescript-language-server --version'
  },
  python: {
    name: 'Python Language Server',
    command: 'pylsp',
    installCommand: 'pip install python-lsp-server',
    installInstructions: 'Install Python first, then run: pip install python-lsp-server',
    checkCommand: 'pylsp --version'
  },
  rust: {
    name: 'Rust Analyzer',
    command: 'rust-analyzer',
    installCommand: 'rustup component add rust-analyzer',
    installInstructions: 'Install Rust first, then run: rustup component add rust-analyzer',
    checkCommand: 'rust-analyzer --version'
  },
  go: {
    name: 'Go Language Server',
    command: 'gopls',
    installCommand: 'go install golang.org/x/tools/gopls@latest',
    installInstructions: 'Install Go first, then run: go install golang.org/x/tools/gopls@latest',
    checkCommand: 'gopls version'
  },
  dart: {
    name: 'Dart/Flutter Language Server',
    command: 'dart',
    installCommand: 'flutter sdk-path', 
    installInstructions: 'Install Flutter SDK from https://flutter.dev/docs/get-started/install, which includes Dart',
    checkCommand: 'dart language-server --version'
  }
};

export async function checkLanguageServer(language: string): Promise<boolean> {
  const lsInfo = LANGUAGE_SERVERS[language];
  if (!lsInfo) return false;

  try {
    await exec(lsInfo.checkCommand);
    return true;
  } catch {
    return false;
  }
}

export async function getLanguageServerStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  for (const [lang] of Object.entries(LANGUAGE_SERVERS)) {
    status[lang] = await checkLanguageServer(lang);
  }
  
  return status;
}

export function createLanguageServerResources(): Resource[] {
  const resources: Resource[] = [];
  
  for (const [lang, info] of Object.entries(LANGUAGE_SERVERS)) {
    resources.push({
      uri: `lsp://install/${lang}`,
      name: `Install ${info.name}`,
      description: `Install command: ${info.installCommand}`,
      mimeType: 'text/x-shellscript'
    });
  }
  
  resources.push({
    uri: 'lsp://status',
    name: 'Language Server Status',
    description: 'Check which language servers are installed',
    mimeType: 'application/json'
  });
  
  return resources;
}

export async function handleResourceRead(uri: string): Promise<{ content: string }> {
  if (uri === 'lsp://status') {
    const status = await getLanguageServerStatus();
    return {
      content: JSON.stringify({
        installed: status,
        servers: LANGUAGE_SERVERS
      }, null, 2)
    };
  }
  
  const match = uri.match(/^lsp:\/\/install\/(.+)$/);
  if (match) {
    const lang = match[1];
    const info = LANGUAGE_SERVERS[lang];
    
    if (!info) {
      throw new Error(`Unknown language: ${lang}`);
    }
    
    // Return a shell script that can be executed
    return {
      content: `#!/bin/bash
# Install ${info.name}

echo "Installing ${info.name}..."

# Check if already installed
if command -v ${info.command} &> /dev/null; then
    echo "✅ ${info.name} is already installed"
    exit 0
fi

# Install
echo "Running: ${info.installCommand}"
${info.installCommand}

# Verify installation
if command -v ${info.command} &> /dev/null; then
    echo "✅ ${info.name} installed successfully"
else
    echo "❌ Installation failed"
    echo "Manual installation instructions:"
    echo "${info.installInstructions}"
    exit 1
fi`
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
}