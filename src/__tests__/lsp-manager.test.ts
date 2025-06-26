import { LSPManager } from '../lsp/manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';

describe('LSPManager', () => {
  let manager: LSPManager;
  let testFile: string;

  beforeEach(async () => {
    manager = new LSPManager();
    testFile = path.join(process.cwd(), 'test-file.ts');
    await fs.writeFile(testFile, `
      export class Calculator {
        add(a: number, b: number): number {
          return a + b;
        }
        
        subtract(a: number, b: number): number {
          return a - b;
        }
      }
      
      const calc = new Calculator();
      const result = calc.add(1, 2);
    `);
  });

  afterEach(async () => {
    await manager.shutdown();
    await fs.unlink(testFile).catch(() => {});
  });

  describe('language detection', () => {
    it('should detect TypeScript files', async () => {
      const symbols = await manager.getDocumentSymbols(testFile);
      expect(symbols).toBeDefined();
    });

    it('should throw error for unsupported extensions', async () => {
      const unsupportedFile = 'test.xyz';
      await expect(manager.getDocumentSymbols(unsupportedFile))
        .rejects.toThrow('Unsupported file extension');
    });
  });

  describe('getDocumentSymbols', () => {
    it('should extract class and method symbols', async () => {
      const symbols = await manager.getDocumentSymbols(testFile);
      
      const classSymbol = symbols.find(s => s.name === 'Calculator');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.kind).toBe(5); // Class
      
      const methodSymbols = symbols.filter(s => s.name === 'add' || s.name === 'subtract');
      expect(methodSymbols).toHaveLength(2);
    });

    it('should filter symbols by type', async () => {
      const symbols = await manager.getDocumentSymbols(testFile, 'class');
      
      expect(symbols.every(s => s.kind === 5)).toBe(true);
    });
  });

  describe('server lifecycle', () => {
    it('should start and stop language servers', async () => {
      await manager.startServer('typescript');
      await manager.stopServer('typescript');
      
      // Should be able to restart
      await manager.startServer('typescript');
    });

    it('should reuse running servers', async () => {
      const server1 = await manager.startServer('typescript');
      const server2 = await manager.startServer('typescript');
      
      expect(server1).toBe(server2);
    });
  });
});