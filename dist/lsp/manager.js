"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LSPManager = void 0;
exports.setupLanguageServers = setupLanguageServers;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const node_1 = require("vscode-jsonrpc/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const vscode_uri_1 = require("vscode-uri");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const events_1 = require("events");
class LSPManager extends events_1.EventEmitter {
    servers = new Map();
    documents = new Map();
    fileToServer = new Map();
    serverConfigs;
    rootUri;
    constructor(rootPath) {
        super();
        this.rootUri = vscode_uri_1.URI.file(rootPath || process.cwd()).toString();
        this.serverConfigs = this.loadServerConfigs();
    }
    loadServerConfigs() {
        const configs = new Map();
        // Load from config file
        try {
            const configPath = path.join(__dirname, '../config/languages.json');
            const configData = require(configPath);
            for (const [language, config] of Object.entries(configData.languages)) {
                configs.set(language, config);
            }
        }
        catch (error) {
            console.error('Failed to load language configurations:', error);
        }
        // Add default configs as fallback
        const defaults = [
            {
                language: 'typescript',
                command: 'typescript-language-server',
                args: ['--stdio'],
                fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
                initializationOptions: {
                    preferences: {
                        includeInlayParameterNameHints: 'all',
                        includeInlayParameterNameHintsWhenArgumentMatchesName: true,
                        includeInlayFunctionParameterTypeHints: true,
                        includeInlayVariableTypeHints: true,
                        includeInlayPropertyDeclarationTypeHints: true,
                        includeInlayFunctionLikeReturnTypeHints: true,
                        includeInlayEnumMemberValueHints: true,
                    }
                }
            },
            {
                language: 'python',
                command: 'pylsp',
                fileExtensions: ['.py'],
                initializationOptions: {
                    pylsp: {
                        plugins: {
                            pycodestyle: { enabled: true },
                            pyflakes: { enabled: true },
                            pylint: { enabled: false },
                            yapf: { enabled: true },
                            autopep8: { enabled: false },
                            mccabe: { enabled: true },
                        }
                    }
                }
            },
            {
                language: 'rust',
                command: 'rust-analyzer',
                fileExtensions: ['.rs'],
                initializationOptions: {
                    cargo: {
                        features: "all"
                    },
                    procMacro: {
                        enable: true
                    }
                }
            },
            {
                language: 'go',
                command: 'gopls',
                fileExtensions: ['.go'],
                initializationOptions: {
                    "ui.diagnostic.analyses": {
                        "composites": true,
                        "unusedparams": true,
                        "unusedwrite": true,
                        "useany": true
                    }
                }
            },
        ];
        for (const config of defaults) {
            if (!configs.has(config.language)) {
                configs.set(config.language, config);
            }
        }
        return configs;
    }
    async initialize() {
        // Don't pre-start servers, start them on demand
        console.error('LSP Manager initialized. Language servers will be started on demand.');
    }
    async startServer(language) {
        const config = this.serverConfigs.get(language);
        if (!config) {
            throw new Error(`No configuration found for language: ${language}`);
        }
        const existing = this.servers.get(language);
        if (existing && existing.process.isRunning()) {
            return existing.process;
        }
        try {
            const server = new LanguageServerProcess(config, this.rootUri);
            await server.start();
            this.servers.set(language, {
                process: server,
                supportedExtensions: config.fileExtensions,
            });
            // Set up error handling
            server.on('error', (error) => {
                console.error(`Language server ${language} error:`, error);
                this.emit('server-error', { language, error });
            });
            server.on('exit', (code) => {
                console.error(`Language server ${language} exited with code ${code}`);
                this.servers.delete(language);
                this.emit('server-exit', { language, code });
            });
            return server;
        }
        catch (error) {
            throw new Error(`Failed to start ${language} server: ${error}`);
        }
    }
    async stopServer(language) {
        const serverInfo = this.servers.get(language);
        if (serverInfo) {
            await serverInfo.process.stop();
            this.servers.delete(language);
            // Clean up file associations
            for (const [file, lang] of this.fileToServer.entries()) {
                if (lang === language) {
                    this.fileToServer.delete(file);
                }
            }
        }
    }
    async getDocumentSymbols(filePath, symbolType) {
        const language = this.detectLanguage(filePath);
        const server = await this.ensureServer(language);
        const uri = vscode_uri_1.URI.file(filePath).toString();
        await this.openDocument(uri, filePath, language);
        try {
            const symbols = await server.getDocumentSymbols({
                textDocument: { uri },
            });
            if (symbolType && symbols.length > 0) {
                const typeFilter = symbolType.toLowerCase();
                return symbols.filter(s => {
                    const symbolKindName = this.symbolKindToString(s.kind).toLowerCase();
                    return symbolKindName.includes(typeFilter);
                });
            }
            return symbols;
        }
        catch (error) {
            console.error(`Failed to get document symbols for ${filePath}:`, error);
            return [];
        }
    }
    async findReferences(filePath, line, character) {
        const language = this.detectLanguage(filePath);
        const server = await this.ensureServer(language);
        const uri = vscode_uri_1.URI.file(filePath).toString();
        await this.openDocument(uri, filePath, language);
        try {
            return await server.findReferences({
                textDocument: { uri },
                position: { line, character },
                context: { includeDeclaration: true },
            });
        }
        catch (error) {
            console.error(`Failed to find references for ${filePath}:`, error);
            return [];
        }
    }
    async goToDefinition(filePath, line, character) {
        const language = this.detectLanguage(filePath);
        const server = await this.ensureServer(language);
        const uri = vscode_uri_1.URI.file(filePath).toString();
        await this.openDocument(uri, filePath, language);
        try {
            return await server.goToDefinition({
                textDocument: { uri },
                position: { line, character },
            });
        }
        catch (error) {
            console.error(`Failed to go to definition for ${filePath}:`, error);
            return null;
        }
    }
    async ensureServer(language) {
        let serverInfo = this.servers.get(language);
        if (!serverInfo || !serverInfo.process.isRunning()) {
            await this.startServer(language);
            serverInfo = this.servers.get(language);
            if (!serverInfo) {
                throw new Error(`Failed to start server for ${language}`);
            }
        }
        return serverInfo.process;
    }
    async openDocument(uri, filePath, language) {
        if (!this.documents.has(uri)) {
            const content = await this.readFile(filePath);
            const document = vscode_languageserver_textdocument_1.TextDocument.create(uri, language, 1, content);
            this.documents.set(uri, document);
            this.fileToServer.set(uri, language);
            const server = await this.ensureServer(language);
            await server.openDocument({
                textDocument: {
                    uri,
                    languageId: language,
                    version: 1,
                    text: content,
                },
            });
        }
    }
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        for (const [language, serverInfo] of this.servers) {
            if (serverInfo.supportedExtensions.includes(ext)) {
                return language;
            }
        }
        for (const [language, config] of this.serverConfigs) {
            if (config.fileExtensions.includes(ext)) {
                return language;
            }
        }
        throw new Error(`Unsupported file extension: ${ext}`);
    }
    async readFile(filePath) {
        return fs.readFile(filePath, 'utf-8');
    }
    symbolKindToString(kind) {
        const kinds = [
            'File', 'Module', 'Namespace', 'Package', 'Class', 'Method',
            'Property', 'Field', 'Constructor', 'Enum', 'Interface',
            'Function', 'Variable', 'Constant', 'String', 'Number',
            'Boolean', 'Array', 'Object', 'Key', 'Null', 'EnumMember',
            'Struct', 'Event', 'Operator', 'TypeParameter'
        ];
        return kinds[kind - 1] || 'Unknown';
    }
    async shutdown() {
        const shutdownPromises = Array.from(this.servers.values()).map(serverInfo => serverInfo.process.stop().catch(err => {
            console.error('Error shutting down server:', err);
        }));
        await Promise.allSettled(shutdownPromises);
        this.servers.clear();
        this.documents.clear();
        this.fileToServer.clear();
    }
    getActiveServers() {
        return Array.from(this.servers.keys());
    }
    isServerRunning(language) {
        const serverInfo = this.servers.get(language);
        return serverInfo ? serverInfo.process.isRunning() : false;
    }
}
exports.LSPManager = LSPManager;
class LanguageServerProcess extends events_1.EventEmitter {
    config;
    rootUri;
    process = null;
    connection = null;
    initialized = false;
    // private _capabilities: Record<string, any> = {};
    initializePromise = null;
    constructor(config, rootUri) {
        super();
        this.config = config;
        this.rootUri = rootUri;
    }
    isRunning() {
        return this.process !== null && !this.process.killed && this.initialized;
    }
    async start() {
        if (this.initializePromise) {
            return this.initializePromise;
        }
        this.initializePromise = this._start();
        return this.initializePromise;
    }
    async _start() {
        try {
            this.process = (0, child_process_1.spawn)(this.config.command, this.config.args || [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                },
            });
            this.process.on('error', (error) => {
                this.emit('error', error);
            });
            this.process.on('exit', (code) => {
                this.emit('exit', code);
                this.cleanup();
            });
            this.process.stderr?.on('data', (data) => {
                console.error(`[${this.config.language}] stderr:`, data.toString());
            });
            const reader = new node_1.StreamMessageReader(this.process.stdout);
            const writer = new node_1.StreamMessageWriter(this.process.stdin);
            this.connection = (0, vscode_languageserver_protocol_1.createMessageConnection)(reader, writer);
            this.connection.onError((error) => {
                console.error(`[${this.config.language}] Connection error:`, error);
                this.emit('error', error);
            });
            this.connection.onClose(() => {
                this.cleanup();
            });
            this.connection.listen();
            await this.initialize();
        }
        catch (error) {
            this.cleanup();
            throw error;
        }
    }
    async initialize() {
        if (!this.connection) {
            throw new Error('Connection not established');
        }
        const initParams = {
            processId: process.pid,
            rootUri: this.rootUri,
            capabilities: {
                workspace: {
                    applyEdit: true,
                    workspaceEdit: {
                        documentChanges: true,
                        resourceOperations: ['create', 'rename', 'delete'],
                        failureHandling: 'textOnlyTransactional',
                    },
                    didChangeConfiguration: { dynamicRegistration: true },
                    didChangeWatchedFiles: { dynamicRegistration: true },
                    symbol: {
                        dynamicRegistration: true,
                        symbolKind: {
                            valueSet: Array.from({ length: 26 }, (_, i) => (i + 1)),
                        },
                    },
                    executeCommand: { dynamicRegistration: true },
                },
                textDocument: {
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true,
                    },
                    completion: {
                        dynamicRegistration: true,
                        contextSupport: true,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: true,
                            documentationFormat: ['markdown', 'plaintext'],
                            deprecatedSupport: true,
                            preselectSupport: true,
                        },
                        completionItemKind: {
                            valueSet: Array.from({ length: 25 }, (_, i) => (i + 1)),
                        },
                    },
                    hover: {
                        dynamicRegistration: true,
                        contentFormat: ['markdown', 'plaintext'],
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                        signatureInformation: {
                            documentationFormat: ['markdown', 'plaintext'],
                            parameterInformation: { labelOffsetSupport: true },
                        },
                    },
                    definition: { dynamicRegistration: true },
                    references: { dynamicRegistration: true },
                    documentHighlight: { dynamicRegistration: true },
                    documentSymbol: {
                        dynamicRegistration: true,
                        symbolKind: {
                            valueSet: Array.from({ length: 26 }, (_, i) => (i + 1)),
                        },
                        hierarchicalDocumentSymbolSupport: true,
                    },
                    codeAction: {
                        dynamicRegistration: true,
                        codeActionLiteralSupport: {
                            codeActionKind: {
                                valueSet: [
                                    '',
                                    'quickfix',
                                    'refactor',
                                    'refactor.extract',
                                    'refactor.inline',
                                    'refactor.rewrite',
                                    'source',
                                    'source.organizeImports',
                                ],
                            },
                        },
                    },
                    codeLens: { dynamicRegistration: true },
                    formatting: { dynamicRegistration: true },
                    rangeFormatting: { dynamicRegistration: true },
                    onTypeFormatting: { dynamicRegistration: true },
                    rename: { dynamicRegistration: true, prepareSupport: true },
                    documentLink: { dynamicRegistration: true, tooltipSupport: true },
                    typeDefinition: { dynamicRegistration: true },
                    implementation: { dynamicRegistration: true },
                    colorProvider: { dynamicRegistration: true },
                    foldingRange: {
                        dynamicRegistration: true,
                        rangeLimit: 5000,
                        lineFoldingOnly: true,
                    },
                },
            },
            initializationOptions: this.config.initializationOptions,
            trace: 'off',
            workspaceFolders: [],
        };
        await this.connection.sendRequest('initialize', initParams);
        // this._capabilities = result.capabilities;
        this.initialized = true;
        await this.connection.sendNotification('initialized', {});
    }
    async openDocument(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        await this.connection.sendNotification('textDocument/didOpen', params);
    }
    async changeDocument(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        await this.connection.sendNotification('textDocument/didChange', params);
    }
    async closeDocument(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        await this.connection.sendNotification('textDocument/didClose', params);
    }
    async getDocumentSymbols(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        try {
            const result = await this.connection.sendRequest('textDocument/documentSymbol', params);
            return result || [];
        }
        catch (error) {
            console.error('Document symbols request failed:', error);
            return [];
        }
    }
    async findReferences(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        try {
            const result = await this.connection.sendRequest('textDocument/references', params);
            return result || [];
        }
        catch (error) {
            console.error('References request failed:', error);
            return [];
        }
    }
    async goToDefinition(params) {
        if (!this.initialized || !this.connection) {
            throw new Error('Language server not initialized');
        }
        try {
            const result = await this.connection.sendRequest('textDocument/definition', params);
            return result || null;
        }
        catch (error) {
            console.error('Definition request failed:', error);
            return null;
        }
    }
    async stop() {
        if (this.connection) {
            try {
                await this.connection.sendRequest('shutdown');
                await this.connection.sendNotification('exit');
            }
            catch (error) {
                console.error('Error during shutdown:', error);
            }
        }
        this.cleanup();
    }
    cleanup() {
        if (this.process && !this.process.killed) {
            this.process.kill('SIGTERM');
            setTimeout(() => {
                if (this.process && !this.process.killed) {
                    this.process.kill('SIGKILL');
                }
            }, 5000);
        }
        this.process = null;
        this.connection = null;
        this.initialized = false;
        this.initializePromise = null;
    }
}
function setupLanguageServers(rootPath) {
    return new LSPManager(rootPath);
}
//# sourceMappingURL=manager.js.map