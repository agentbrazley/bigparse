import { SymbolInformation, Location, Definition, DocumentSymbolParams, ReferenceParams, DefinitionParams, DidOpenTextDocumentParams, DidChangeTextDocumentParams, DidCloseTextDocumentParams } from 'vscode-languageserver-protocol';
import { EventEmitter } from 'events';
interface LanguageServerConfig {
    language: string;
    command: string;
    args?: string[];
    fileExtensions: string[];
    initializationOptions?: any;
}
export declare class LSPManager extends EventEmitter {
    private servers;
    private documents;
    private fileToServer;
    private serverConfigs;
    private rootUri;
    constructor(rootPath?: string);
    private loadServerConfigs;
    initialize(): Promise<void>;
    startServer(language: string): Promise<LanguageServerProcess>;
    stopServer(language: string): Promise<void>;
    getDocumentSymbols(filePath: string, symbolType?: string): Promise<SymbolInformation[]>;
    findReferences(filePath: string, line: number, character: number): Promise<Location[]>;
    goToDefinition(filePath: string, line: number, character: number): Promise<Definition | null>;
    private ensureServer;
    private openDocument;
    private detectLanguage;
    private readFile;
    private symbolKindToString;
    shutdown(): Promise<void>;
    getActiveServers(): string[];
    isServerRunning(language: string): boolean;
}
declare class LanguageServerProcess extends EventEmitter {
    private config;
    private rootUri;
    private process;
    private connection;
    private initialized;
    private initializePromise;
    constructor(config: LanguageServerConfig, rootUri: string);
    isRunning(): boolean;
    start(): Promise<void>;
    private _start;
    private initialize;
    openDocument(params: DidOpenTextDocumentParams): Promise<void>;
    changeDocument(params: DidChangeTextDocumentParams): Promise<void>;
    closeDocument(params: DidCloseTextDocumentParams): Promise<void>;
    getDocumentSymbols(params: DocumentSymbolParams): Promise<SymbolInformation[]>;
    findReferences(params: ReferenceParams): Promise<Location[]>;
    goToDefinition(params: DefinitionParams): Promise<Definition | null>;
    stop(): Promise<void>;
    private cleanup;
}
export declare function setupLanguageServers(rootPath?: string): LSPManager;
export {};
//# sourceMappingURL=manager.d.ts.map