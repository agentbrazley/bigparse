import { checkLanguageServer, LANGUAGE_SERVERS } from '../resources/language-servers.js';

export interface LSPElicitation {
  type: 'language_server_missing';
  language: string;
  serverName: string;
  installCommand: string;
  benefits: string[];
}

export async function checkAndElicitLSP(language: string): Promise<LSPElicitation | null> {
  // Check if the language server is installed
  const isInstalled = await checkLanguageServer(language);
  
  if (isInstalled) {
    return null; // No elicitation needed
  }
  
  const lsInfo = LANGUAGE_SERVERS[language];
  if (!lsInfo) {
    return null; // Unknown language
  }
  
  // Return elicitation data
  return {
    type: 'language_server_missing',
    language,
    serverName: lsInfo.name,
    installCommand: lsInfo.installCommand,
    benefits: [
      'Extract accurate symbols (classes, functions, interfaces)',
      'Find all references to a symbol across files',
      'Jump to symbol definitions',
      'Get type information and documentation',
      'Enable semantic code navigation'
    ]
  };
}

export function createElicitationPrompt(elicitation: LSPElicitation): string {
  return `
The ${elicitation.serverName} is not installed. This language server would enable:

${elicitation.benefits.map(b => `• ${b}`).join('\n')}

Without it, BigParse can still:
• Index and search files
• Use regex patterns
• Cache results for fast access

You have several options:

1. **Install automatically** - Use the \`install_language_server\` tool with language: "${elicitation.language}"
2. **Install manually** - Run: ${elicitation.installCommand}
3. **Continue without** - Proceed with basic features only
4. **Check all servers** - Use the \`check_language_servers\` tool to see what's installed

The language server uses ~150-300MB of memory when active.
`.trim();
}