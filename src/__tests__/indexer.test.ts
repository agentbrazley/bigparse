import { CodeIndexer } from '../indexing/indexer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';

describe('CodeIndexer', () => {
  let indexer: CodeIndexer;
  let testDir: string;

  beforeEach(async () => {
    indexer = new CodeIndexer();
    testDir = path.join(process.cwd(), 'test-workspace');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await indexer.shutdown();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('indexCodebase', () => {
    it('should index TypeScript files', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, `
        export class TestClass {
          constructor(private name: string) {}
          
          getName(): string {
            return this.name;
          }
        }
        
        export function testFunction(param: number): number {
          return param * 2;
        }
      `);

      const result = await indexer.indexCodebase(testDir, ['typescript']);
      
      expect(result.filesIndexed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle multiple languages', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'const x = 1;');
      await fs.writeFile(path.join(testDir, 'test.py'), 'def test(): pass');
      await fs.writeFile(path.join(testDir, 'test.rs'), 'fn main() {}');

      const result = await indexer.indexCodebase(testDir);
      
      expect(result.filesIndexed).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip node_modules', async () => {
      const nodeModules = path.join(testDir, 'node_modules');
      await fs.mkdir(nodeModules, { recursive: true });
      await fs.writeFile(path.join(nodeModules, 'test.js'), 'module.exports = {}');
      await fs.writeFile(path.join(testDir, 'test.js'), 'const x = 1;');

      const result = await indexer.indexCodebase(testDir);
      
      expect(result.filesIndexed).toBe(1);
    });
  });

  describe('searchCode', () => {
    beforeEach(async () => {
      const testFile = path.join(testDir, 'search-test.ts');
      await fs.writeFile(testFile, `
        function findUser(id: string) {
          return users.find(u => u.id === id);
        }
        
        function findProduct(name: string) {
          return products.find(p => p.name === name);
        }
      `);
      
      await indexer.indexCodebase(testDir);
    });

    it('should find code by regex pattern', async () => {
      const results = await indexer.searchCode('find.*\\(');
      
      expect(results).toHaveLength(1);
      expect(results[0].matches).toHaveLength(2);
      expect(results[0].matches[0].text).toContain('findUser');
      expect(results[0].matches[1].text).toContain('findProduct');
    });

    it('should respect file type filter', async () => {
      await fs.writeFile(path.join(testDir, 'test.js'), 'function findItem() {}');
      await indexer.indexCodebase(testDir);
      
      const results = await indexer.searchCode('find', { fileTypes: ['.ts'] });
      
      expect(results).toHaveLength(1);
      expect(results[0].file).toContain('.ts');
    });

    it('should respect result limit', async () => {
      const results = await indexer.searchCode('find', { limit: 1 });
      
      expect(results).toHaveLength(1);
    });
  });
});