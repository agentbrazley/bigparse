import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  hash: string;
  timestamp: number;
  version: string;
}

export class FileCache<T> {
  private cacheDir: string;
  private version = '1.0.0';
  private memoryCache: Map<string, CacheEntry<T>> = new Map();
  private maxMemoryCacheSize = 100;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async get(key: string, fileHash?: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && (!fileHash || memoryEntry.hash === fileHash)) {
      return memoryEntry.data;
    }

    // Check disk cache
    const cachePath = this.getCachePath(key);
    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);
      
      if (entry.version !== this.version) {
        await this.delete(key);
        return null;
      }

      if (fileHash && entry.hash !== fileHash) {
        await this.delete(key);
        return null;
      }

      // Add to memory cache
      this.addToMemoryCache(key, entry);
      
      return entry.data;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, data: T, fileHash: string): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      hash: fileHash,
      timestamp: Date.now(),
      version: this.version,
    };

    // Write to disk
    const cachePath = this.getCachePath(key);
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(entry, null, 2));

    // Add to memory cache
    this.addToMemoryCache(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    const cachePath = this.getCachePath(key);
    try {
      await fs.unlink(cachePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  private getCachePath(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex');
    const subdir = hash.substring(0, 2);
    return path.join(this.cacheDir, subdir, `${hash}.json`);
  }

  private addToMemoryCache(key: string, entry: CacheEntry<T>): void {
    // Implement simple LRU eviction
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, entry);
  }

  async getStats(): Promise<{
    memoryCacheSize: number;
    diskCacheSize: number;
    totalFiles: number;
  }> {
    let totalFiles = 0;
    let diskCacheSize = 0;

    async function walkDir(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            totalFiles++;
            const stats = await fs.stat(fullPath);
            diskCacheSize += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    await walkDir(this.cacheDir);

    return {
      memoryCacheSize: this.memoryCache.size,
      diskCacheSize,
      totalFiles,
    };
  }
}