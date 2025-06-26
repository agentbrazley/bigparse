export interface LSPElicitation {
    type: 'language_server_missing';
    language: string;
    serverName: string;
    installCommand: string;
    benefits: string[];
}
export declare function checkAndElicitLSP(language: string): Promise<LSPElicitation | null>;
export declare function createElicitationPrompt(elicitation: LSPElicitation): string;
//# sourceMappingURL=lsp-check.d.ts.map