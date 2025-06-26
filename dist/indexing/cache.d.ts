export declare class FileCache<T> {
    private cacheDir;
    private version;
    private memoryCache;
    private maxMemoryCacheSize;
    constructor(cacheDir: string);
    initialize(): Promise<void>;
    get(key: string, fileHash?: string): Promise<T | null>;
    set(key: string, data: T, fileHash: string): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    private getCachePath;
    private addToMemoryCache;
    getStats(): Promise<{
        memoryCacheSize: number;
        diskCacheSize: number;
        totalFiles: number;
    }>;
}
//# sourceMappingURL=cache.d.ts.map