"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageServerInstaller = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
const language_servers_js_1 = require("../resources/language-servers.js");
class LanguageServerInstaller extends events_1.EventEmitter {
    allowedCommands = new Set([
        'npm',
        'pip',
        'pip3',
        'go',
        'rustup',
        'gem',
        'dotnet',
        'dart',
        'flutter'
    ]);
    async installLanguageServer(language) {
        const lsInfo = language_servers_js_1.LANGUAGE_SERVERS[language];
        if (!lsInfo) {
            return {
                status: 'error',
                message: `Unknown language: ${language}`,
                error: 'Language not supported'
            };
        }
        // Validate the install command for security
        const validation = this.validateCommand(lsInfo.installCommand);
        if (!validation.safe) {
            return {
                status: 'error',
                message: 'Install command validation failed',
                error: validation.reason
            };
        }
        this.emit('progress', {
            status: 'starting',
            message: `Starting installation of ${lsInfo.name}...`
        });
        try {
            const result = await this.runInstallCommand(lsInfo.installCommand, lsInfo.name);
            if (result.success) {
                // Verify installation
                const verified = await this.verifyInstallation(language);
                if (verified) {
                    this.emit('progress', {
                        status: 'success',
                        message: `✅ ${lsInfo.name} installed successfully!`,
                        output: result.output
                    });
                    return {
                        status: 'success',
                        message: `${lsInfo.name} installed successfully`,
                        output: result.output
                    };
                }
                else {
                    return {
                        status: 'error',
                        message: `Installation appeared to succeed but ${lsInfo.name} is not available`,
                        error: 'Verification failed',
                        output: result.output
                    };
                }
            }
            else {
                return {
                    status: 'error',
                    message: `Failed to install ${lsInfo.name}`,
                    error: result.error,
                    output: result.output
                };
            }
        }
        catch (error) {
            return {
                status: 'error',
                message: `Installation error: ${error}`,
                error: String(error)
            };
        }
    }
    validateCommand(command) {
        // Basic security validation
        const parts = command.split(' ');
        const mainCommand = parts[0];
        if (!this.allowedCommands.has(mainCommand)) {
            return {
                safe: false,
                reason: `Command '${mainCommand}' is not in the allowed list`
            };
        }
        // Check for dangerous patterns
        const dangerousPatterns = [
            /[;&|]/, // Command chaining
            /[<>]/, // Redirects
            /\$\(/, // Command substitution
            /`/, // Backticks
            /\.\./, // Path traversal
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                return {
                    safe: false,
                    reason: 'Command contains potentially dangerous characters'
                };
            }
        }
        return { safe: true };
    }
    async runInstallCommand(command, serverName) {
        return new Promise((resolve) => {
            const parts = command.split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);
            let output = '';
            let errorOutput = '';
            const options = {
                shell: false, // Safer - no shell interpretation
                env: {
                    ...process.env,
                    FORCE_COLOR: '0', // Disable color output for cleaner logs
                }
            };
            const proc = (0, child_process_1.spawn)(cmd, args, options);
            proc.stdout?.on('data', (data) => {
                const text = data.toString();
                output += text;
                this.emit('progress', {
                    status: 'running',
                    message: `Installing ${serverName}...`,
                    output: text.trim()
                });
            });
            proc.stderr?.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                // Some installers write normal output to stderr
                this.emit('progress', {
                    status: 'running',
                    message: `Installing ${serverName}...`,
                    output: text.trim()
                });
            });
            proc.on('error', (error) => {
                resolve({
                    success: false,
                    output: output + errorOutput,
                    error: error.message
                });
            });
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output + errorOutput
                    });
                }
                else {
                    resolve({
                        success: false,
                        output: output + errorOutput,
                        error: `Process exited with code ${code}`
                    });
                }
            });
        });
    }
    async verifyInstallation(language) {
        const lsInfo = language_servers_js_1.LANGUAGE_SERVERS[language];
        if (!lsInfo)
            return false;
        try {
            return new Promise((resolve) => {
                const parts = lsInfo.checkCommand.split(' ');
                const cmd = parts[0];
                const args = parts.slice(1);
                const proc = (0, child_process_1.spawn)(cmd, args, { shell: false });
                proc.on('error', () => {
                    resolve(false);
                });
                proc.on('close', (code) => {
                    resolve(code === 0);
                });
            });
        }
        catch {
            return false;
        }
    }
    async getInstallScript(language) {
        const lsInfo = language_servers_js_1.LANGUAGE_SERVERS[language];
        if (!lsInfo)
            return null;
        return `#!/bin/bash
# BigParse Language Server Installer
# Installing: ${lsInfo.name}

echo "🚀 BigParse Language Server Installer"
echo "Installing ${lsInfo.name}..."
echo ""

# Check if already installed
if command -v ${lsInfo.command} &> /dev/null; then
    echo "✅ ${lsInfo.name} is already installed"
    ${lsInfo.checkCommand}
    exit 0
fi

# Install
echo "Running: ${lsInfo.installCommand}"
${lsInfo.installCommand}

# Verify installation
echo ""
echo "Verifying installation..."
if command -v ${lsInfo.command} &> /dev/null; then
    echo "✅ ${lsInfo.name} installed successfully!"
    ${lsInfo.checkCommand}
else
    echo "❌ Installation may have failed"
    echo ""
    echo "Manual installation instructions:"
    echo "${lsInfo.installInstructions}"
    exit 1
fi`;
    }
}
exports.LanguageServerInstaller = LanguageServerInstaller;
//# sourceMappingURL=installer.js.map