import { EventEmitter } from 'events';
interface SymbolInfo {
    name: string;
    kind: string;
    location: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    containerName?: string;
}
interface SearchResult {
    file: string;
    matches: Array<{
        line: number;
        column: number;
        text: string;
        symbol?: SymbolInfo;
    }>;
}
export declare class CodeIndexer extends EventEmitter {
    private index;
    private lspManager;
    private indexPath;
    private cache;
    private fileWatcher;
    private isIndexing;
    private maxConcurrentIndexing;
    constructor(rootPath?: string);
    initialize(): Promise<void>;
    indexCodebase(basePath: string, languages?: string[]): Promise<{
        filesIndexed: number;
        errors: string[];
        duration: number;
        skipped: number;
    }>;
    searchCode(query: string, options?: {
        fileTypes?: string[];
        limit?: number;
    }): Promise<SearchResult[]>;
    private indexFile;
    private extractSymbols;
    private searchInFile;
    private findSymbolAtLocation;
    private detectLanguage;
    private getFilePatterns;
    private symbolKindToString;
    private ensureIndexDirectory;
    private saveIndex;
    loadIndex(): Promise<void>;
    shutdown(): Promise<void>;
    getCacheStats(): Promise<any>;
    clearCache(): Promise<void>;
    getIndexStats(): {
        totalFiles: number;
        languages: Record<string, number>;
        totalSymbols: number;
    };
}
export {};
//# sourceMappingURL=indexer.d.ts.map