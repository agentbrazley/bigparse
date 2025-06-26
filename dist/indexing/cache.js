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
exports.FileCache = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
class FileCache {
    cacheDir;
    version = '1.0.0';
    memoryCache = new Map();
    maxMemoryCacheSize = 100;
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
    }
    async initialize() {
        await fs.mkdir(this.cacheDir, { recursive: true });
    }
    async get(key, fileHash) {
        // Check memory cache first
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && (!fileHash || memoryEntry.hash === fileHash)) {
            return memoryEntry.data;
        }
        // Check disk cache
        const cachePath = this.getCachePath(key);
        try {
            const content = await fs.readFile(cachePath, 'utf-8');
            const entry = JSON.parse(content);
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
        }
        catch (error) {
            return null;
        }
    }
    async set(key, data, fileHash) {
        const entry = {
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
    async delete(key) {
        this.memoryCache.delete(key);
        const cachePath = this.getCachePath(key);
        try {
            await fs.unlink(cachePath);
        }
        catch (error) {
            // Ignore if file doesn't exist
        }
    }
    async clear() {
        this.memoryCache.clear();
        try {
            await fs.rm(this.cacheDir, { recursive: true, force: true });
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
        catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
    getCachePath(key) {
        const hash = (0, crypto_1.createHash)('sha256').update(key).digest('hex');
        const subdir = hash.substring(0, 2);
        return path.join(this.cacheDir, subdir, `${hash}.json`);
    }
    addToMemoryCache(key, entry) {
        // Implement simple LRU eviction
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
                this.memoryCache.delete(firstKey);
            }
        }
        this.memoryCache.set(key, entry);
    }
    async getStats() {
        let totalFiles = 0;
        let diskCacheSize = 0;
        async function walkDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await walkDir(fullPath);
                    }
                    else if (entry.isFile() && entry.name.endsWith('.json')) {
                        totalFiles++;
                        const stats = await fs.stat(fullPath);
                        diskCacheSize += stats.size;
                    }
                }
            }
            catch (error) {
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
exports.FileCache = FileCache;
//# sourceMappingURL=cache.js.map