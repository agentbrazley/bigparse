"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_SERVERS = void 0;
exports.checkLanguageServer = checkLanguageServer;
exports.getLanguageServerStatus = getLanguageServerStatus;
exports.createLanguageServerResources = createLanguageServerResources;
exports.handleResourceRead = handleResourceRead;
const util_1 = require("util");
const child_process_1 = require("child_process");
const exec = (0, util_1.promisify)(child_process_1.exec);
exports.LANGUAGE_SERVERS = {
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
async function checkLanguageServer(language) {
    const lsInfo = exports.LANGUAGE_SERVERS[language];
    if (!lsInfo)
        return false;
    try {
        await exec(lsInfo.checkCommand);
        return true;
    }
    catch {
        return false;
    }
}
async function getLanguageServerStatus() {
    const status = {};
    for (const [lang] of Object.entries(exports.LANGUAGE_SERVERS)) {
        status[lang] = await checkLanguageServer(lang);
    }
    return status;
}
function createLanguageServerResources() {
    const resources = [];
    for (const [lang, info] of Object.entries(exports.LANGUAGE_SERVERS)) {
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
async function handleResourceRead(uri) {
    if (uri === 'lsp://status') {
        const status = await getLanguageServerStatus();
        return {
            content: JSON.stringify({
                installed: status,
                servers: exports.LANGUAGE_SERVERS
            }, null, 2)
        };
    }
    const match = uri.match(/^lsp:\/\/install\/(.+)$/);
    if (match) {
        const lang = match[1];
        const info = exports.LANGUAGE_SERVERS[lang];
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
//# sourceMappingURL=language-servers.js.map