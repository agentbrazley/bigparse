import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createHash } from 'crypto';
import { LSPManager } from '../lsp/manager.js';
import { FileCache } from './cache.js';
import { EventEmitter } from 'events';

interface IndexedFile {
  path: string;
  language: string;
  size: number;
  hash: string;
  lastModified: Date;
  symbols: SymbolInfo[];
  content?: string; // Optional cached content
}

interface SymbolInfo {
  name: string;
  kind: string;
  location: {
    start: { line: number; character: number };
    end: { line: number; character: number };
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

export class CodeIndexer extends EventEmitter {
  private index: Map<string, IndexedFile> = new Map();
  private lspManager: LSPManager;
  private indexPath = '.index';
  private cache: FileCache<IndexedFile>;
  private fileWatcher: any;
  private isIndexing = false;
  private maxConcurrentIndexing = 4;

  constructor(rootPath?: string) {
    super();
    this.lspManager = new LSPManager(rootPath);
    this.cache = new FileCache<IndexedFile>(path.join(this.indexPath, 'cache'));
  }

  async initialize(): Promise<void> {
    await this.cache.initialize();
    await this.lspManager.initialize();
    await this.loadIndex().catch(() => {
      // Index doesn't exist yet, that's OK
    });
  }

  async indexCodebase(basePath: string, languages?: string[]): Promise<{ 
    filesIndexed: number; 
    errors: string[];
    duration: number;
    skipped: number;
  }> {
    if (this.isIndexing) {
      throw new Error('Indexing already in progress');
    }

    this.isIndexing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let filesIndexed = 0;
    let skipped = 0;

    try {
      await this.ensureIndexDirectory();
      
      this.emit('indexing-start', { basePath, languages });
      
      const patterns = this.getFilePatterns(languages);
      const files: string[] = [];
      
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
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
        const results = await Promise.allSettled(
          batch.map(file => this.indexFile(file))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if (result.value === 'cached') {
              skipped++;
            } else {
              filesIndexed++;
            }
          } else {
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
    } catch (error) {
      errors.push(`Indexing failed: ${error}`);
      this.emit('indexing-error', { error });
    } finally {
      this.isIndexing = false;
    }

    return {
      filesIndexed,
      errors,
      duration: Date.now() - startTime,
      skipped,
    };
  }

  async searchCode(query: string, options: {
    fileTypes?: string[];
    limit?: number;
  } = {}): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
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

  private async indexFile(filePath: string): Promise<'indexed' | 'cached'> {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');

    // Check cache first
    const cacheKey = filePath;
    const cachedData = await this.cache.get(cacheKey, hash);
    if (cachedData) {
      this.index.set(filePath, cachedData);
      return 'cached';
    }

    const language = this.detectLanguage(filePath);
    const symbols = await this.extractSymbols(filePath, language);

    const indexedFile: IndexedFile = {
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

  private async extractSymbols(filePath: string, _language: string): Promise<SymbolInfo[]> {
    try {
      const lspSymbols = await this.lspManager.getDocumentSymbols(filePath);
      const symbols: SymbolInfo[] = [];
      
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
    } catch (error) {
      // Language server might not be available, continue without symbols
      console.error(`Failed to extract symbols from ${filePath}:`, error);
      return [];
    }
  }

  private async searchInFile(filePath: string, query: string, indexedFile: IndexedFile): Promise<SearchResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches: SearchResult['matches'] = [];

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

  private findSymbolAtLocation(symbols: SymbolInfo[], line: number, column: number): SymbolInfo | undefined {
    return symbols.find(symbol => {
      return line >= symbol.location.start.line &&
             line <= symbol.location.end.line &&
             (line !== symbol.location.start.line || column >= symbol.location.start.character) &&
             (line !== symbol.location.end.line || column <= symbol.location.end.character);
    });
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const languageMap: Record<string, string> = {
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

  private getFilePatterns(languages?: string[]): string[] {
    const languagePatterns: Record<string, string[]> = {
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
      const patterns: string[] = [];
      for (const lang of languages) {
        if (languagePatterns[lang]) {
          patterns.push(...languagePatterns[lang]);
        }
      }
      return patterns;
    }

    return Object.values(languagePatterns).flat();
  }

  private symbolKindToString(kind: number): string {
    const kinds = [
      'File', 'Module', 'Namespace', 'Package', 'Class', 'Method',
      'Property', 'Field', 'Constructor', 'Enum', 'Interface',
      'Function', 'Variable', 'Constant', 'String', 'Number',
      'Boolean', 'Array', 'Object', 'Key', 'Null', 'EnumMember',
      'Struct', 'Event', 'Operator', 'TypeParameter'
    ];
    return kinds[kind - 1] || 'Unknown';
  }

  private async ensureIndexDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.indexPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async saveIndex(): Promise<void> {
    const indexData = Array.from(this.index.entries());
    await fs.writeFile(
      path.join(this.indexPath, 'index.json'),
      JSON.stringify(indexData, null, 2)
    );
  }

  async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(path.join(this.indexPath, 'index.json'), 'utf-8');
      const indexData = JSON.parse(data);
      this.index = new Map(indexData);
    } catch (error) {
      // Index doesn't exist yet
    }
  }

  async shutdown(): Promise<void> {
    this.isIndexing = false;
    await this.saveIndex();
    await this.lspManager.shutdown();
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
  }

  async getCacheStats(): Promise<any> {
    return this.cache.getStats();
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.index.clear();
  }

  getIndexStats(): {
    totalFiles: number;
    languages: Record<string, number>;
    totalSymbols: number;
  } {
    const stats = {
      totalFiles: this.index.size,
      languages: {} as Record<string, number>,
      totalSymbols: 0,
    };

    for (const file of this.index.values()) {
      stats.languages[file.language] = (stats.languages[file.language] || 0) + 1;
      stats.totalSymbols += file.symbols.length;
    }

    return stats;
  }
}