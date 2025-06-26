import { Resource } from '@modelcontextprotocol/sdk/types.js';
interface LanguageServerInfo {
    name: string;
    command: string;
    installCommand: string;
    installInstructions: string;
    checkCommand: string;
}
export declare const LANGUAGE_SERVERS: Record<string, LanguageServerInfo>;
export declare function checkLanguageServer(language: string): Promise<boolean>;
export declare function getLanguageServerStatus(): Promise<Record<string, boolean>>;
export declare function createLanguageServerResources(): Resource[];
export declare function handleResourceRead(uri: string): Promise<{
    content: string;
}>;
export {};
//# sourceMappingURL=language-servers.d.ts.map