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
exports.CodeIndexer = void 0;
const glob_1 = require("glob");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const crypto_1 = require("crypto");
const manager_js_1 = require("../lsp/manager.js");
const cache_js_1 = require("./cache.js");
const events_1 = require("events");
class CodeIndexer extends events_1.EventEmitter {
    index = new Map();
    lspManager;
    indexPath = '.index';
    cache;
    fileWatcher;
    isIndexing = false;
    maxConcurrentIndexing = 4;
    constructor(rootPath) {
        super();
        this.lspManager = new manager_js_1.LSPManager(rootPath);
        this.cache = new cache_js_1.FileCache(path.join(this.indexPath, 'cache'));
    }
    async initialize() {
        await this.cache.initialize();
        await this.lspManager.initialize();
        await this.loadIndex().catch(() => {
            // Index doesn't exist yet, that's OK
        });
    }
    async indexCodebase(basePath, languages) {
        if (this.isIndexing) {
            throw new Error('Indexing already in progress');
        }
        this.isIndexing = true;
        const startTime = Date.now();
        const errors = [];
        let filesIndexed = 0;
        let skipped = 0;
        try {
            await this.ensureIndexDirectory();
            this.emit('indexing-start', { basePath, languages });
            const patterns = this.getFilePatterns(languages);
            const files = [];
            for (const pattern of patterns) {
                const matches = await (0, glob_1.glob)(pattern, {
                    cwd: basePath,
                    absolute: true,
                    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.*/**'],
                });
                files.push(...matches);
            }
            this.emit('files-discovered', { total: files.length });
            // Process files in batches for better performance
            const batchSize = this.maxConcurrentIndexing;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const results = await Promise.allSettled(batch.map(file => this.indexFile(file)));
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        if (result.value === 'cached') {
                            skipped++;
                        }
                        else {
                            filesIndexed++;
                        }
                    }
                    else {
                        errors.push(`Failed to index ${batch[index]}: ${result.reason}`);
                    }
                });
                this.emit('indexing-progress', {
                    processed: i + batch.length,
                    total: files.length,
                    filesIndexed,
                    skipped,
                    errors: errors.length,
                });
            }
            await this.saveIndex();
            this.emit('indexing-complete', {
                filesIndexed,
                skipped,
                errors: errors.length,
                duration: Date.now() - startTime,
            });
        }
        catch (error) {
            errors.push(`Indexing failed: ${error}`);
            this.emit('indexing-error', { error });
        }
        finally {
            this.isIndexing = false;
        }
        return {
            filesIndexed,
            errors,
            duration: Date.now() - startTime,
            skipped,
        };
    }
    async searchCode(query, options = {}) {
        const results = [];
        const limit = options.limit || 50;
        const fileTypeFilter = options.fileTypes || [];
        for (const [filePath, indexedFile] of this.index) {
            if (fileTypeFilter.length > 0) {
                const ext = path.extname(filePath);
                if (!fileTypeFilter.includes(ext)) {
                    continue;
                }
            }
            const fileResults = await this.searchInFile(filePath, query, indexedFile);
            if (fileResults.matches.length > 0) {
                results.push(fileResults);
                if (results.length >= limit) {
                    break;
                }
            }
        }
        return results;
    }
    async indexFile(filePath) {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const hash = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
        // Check cache first
        const cacheKey = filePath;
        const cachedData = await this.cache.get(cacheKey, hash);
        if (cachedData) {
            this.index.set(filePath, cachedData);
            return 'cached';
        }
        const language = this.detectLanguage(filePath);
        const symbols = await this.extractSymbols(filePath, language);
        const indexedFile = {
            path: filePath,
            language,
            size: stats.size,
            hash,
            lastModified: stats.mtime,
            symbols,
        };
        this.index.set(filePath, indexedFile);
        await this.cache.set(cacheKey, indexedFile, hash);
        return 'indexed';
    }
    async extractSymbols(filePath, _language) {
        try {
            const lspSymbols = await this.lspManager.getDocumentSymbols(filePath);
            const symbols = [];
            for (const symbol of lspSymbols) {
                // SymbolInformation always has location.range
                const range = symbol.location?.range;
                if (!range) {
                    console.warn(`Symbol ${symbol.name} has no range information`);
                    continue;
                }
                symbols.push({
                    name: symbol.name,
                    kind: this.symbolKindToString(symbol.kind),
                    location: {
                        start: {
                            line: range.start.line,
                            character: range.start.character,
                        },
                        end: {
                            line: range.end.line,
                            character: range.end.character,
                        },
                    },
                    containerName: symbol.containerName,
                });
            }
            return symbols;
        }
        catch (error) {
            // Language server might not be available, continue without symbols
            console.error(`Failed to extract symbols from ${filePath}:`, error);
            return [];
        }
    }
    async searchInFile(filePath, query, indexedFile) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const matches = [];
        const regex = new RegExp(query, 'gi');
        lines.forEach((line, lineIndex) => {
            let match;
            while ((match = regex.exec(line)) !== null) {
                const symbol = this.findSymbolAtLocation(indexedFile.symbols, lineIndex, match.index);
                matches.push({
                    line: lineIndex + 1,
                    column: match.index + 1,
                    text: line.trim(),
                    symbol,
                });
            }
        });
        return { file: filePath, matches };
    }
    findSymbolAtLocation(symbols, line, column) {
        return symbols.find(symbol => {
            return line >= symbol.location.start.line &&
                line <= symbol.location.end.line &&
                (line !== symbol.location.start.line || column >= symbol.location.start.character) &&
                (line !== symbol.location.end.line || column <= symbol.location.end.character);
        });
    }
    detectLanguage(filePath) {
        const ext = path.extname(filePath);
        const languageMap = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.rs': 'rust',
            '.go': 'go',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.r': 'r',
            '.m': 'objc',
            '.mm': 'objcpp',
        };
        return languageMap[ext] || 'plaintext';
    }
    getFilePatterns(languages) {
        const languagePatterns = {
            typescript: ['**/*.ts', '**/*.tsx'],
            javascript: ['**/*.js', '**/*.jsx'],
            python: ['**/*.py'],
            rust: ['**/*.rs'],
            go: ['**/*.go'],
            java: ['**/*.java'],
            cpp: ['**/*.cpp', '**/*.cc', '**/*.cxx', '**/*.hpp', '**/*.h'],
            c: ['**/*.c', '**/*.h'],
            csharp: ['**/*.cs'],
            ruby: ['**/*.rb'],
            php: ['**/*.php'],
            swift: ['**/*.swift'],
            kotlin: ['**/*.kt'],
            scala: ['**/*.scala'],
            r: ['**/*.r', '**/*.R'],
            objc: ['**/*.m', '**/*.h'],
            objcpp: ['**/*.mm'],
        };
        if (languages && languages.length > 0) {
            const patterns = [];
            for (const lang of languages) {
                if (languagePatterns[lang]) {
                    patterns.push(...languagePatterns[lang]);
                }
            }
            return patterns;
        }
        return Object.values(languagePatterns).flat();
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
    async ensureIndexDirectory() {
        try {
            await fs.mkdir(this.indexPath, { recursive: true });
        }
        catch (error) {
            // Directory might already exist
        }
    }
    async saveIndex() {
        const indexData = Array.from(this.index.entries());
        await fs.writeFile(path.join(this.indexPath, 'index.json'), JSON.stringify(indexData, null, 2));
    }
    async loadIndex() {
        try {
            const data = await fs.readFile(path.join(this.indexPath, 'index.json'), 'utf-8');
            const indexData = JSON.parse(data);
            this.index = new Map(indexData);
        }
        catch (error) {
            // Index doesn't exist yet
        }
    }
    async shutdown() {
        this.isIndexing = false;
        await this.saveIndex();
        await this.lspManager.shutdown();
        if (this.fileWatcher) {
            this.fileWatcher.close();
        }
    }
    async getCacheStats() {
        return this.cache.getStats();
    }
    async clearCache() {
        await this.cache.clear();
        this.index.clear();
    }
    getIndexStats() {
        const stats = {
            totalFiles: this.index.size,
            languages: {},
            totalSymbols: 0,
        };
        for (const file of this.index.values()) {
            stats.languages[file.language] = (stats.languages[file.language] || 0) + 1;
            stats.totalSymbols += file.symbols.length;
        }
        return stats;
    }
}
exports.CodeIndexer = CodeIndexer;
//# sourceMappingURL=indexer.js.map