import { EventEmitter } from 'events';
export interface InstallProgress {
    status: 'starting' | 'running' | 'success' | 'error';
    message: string;
    output?: string;
    error?: string;
}
export declare class LanguageServerInstaller extends EventEmitter {
    private allowedCommands;
    installLanguageServer(language: string): Promise<InstallProgress>;
    private validateCommand;
    private runInstallCommand;
    private verifyInstallation;
    getInstallScript(language: string): Promise<string | null>;
}
//# sourceMappingURL=installer.d.ts.map