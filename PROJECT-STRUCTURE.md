# BigParse v1 Project Structure

```
BigParse-v1/
├── src/                        # TypeScript source code
│   ├── index.ts               # MCP server entry point
│   ├── lsp/                   # Language Server Protocol integration
│   │   └── manager.ts         # LSP connection management
│   ├── indexing/              # Code indexing system
│   │   ├── indexer.ts         # Main indexing logic
│   │   └── cache.ts           # Caching implementation
│   ├── tools/                 # MCP tool implementations
│   │   └── index.ts           # Tool definitions
│   ├── subprocess/            # Secure subprocess handling
│   │   └── installer.ts       # Language server installer
│   ├── resources/             # MCP resources
│   │   └── language-servers.ts # Language server info
│   ├── elicitation/           # User prompting system
│   │   └── lsp-check.ts       # LSP installation prompts
│   ├── utils/                 # Utility functions
│   │   └── language-detection.ts # File type detection
│   └── config/                # Configuration files
│       └── languages.json     # Language server configs
│
├── dist/                      # Compiled JavaScript (git ignored)
│
├── examples/                  # Example scripts
│   ├── test-indexing-only.js  # Basic indexing demo
│   ├── test-fcp-with-lsp.js   # Full LSP integration demo
│   ├── visual-demo.js         # Performance comparison
│   ├── demo.js                # MCP protocol demo
│   └── README.md              # Examples documentation
│
├── scripts/                   # Helper scripts
│   ├── install-for-claude.sh  # Quick Claude installation
│   ├── update-workspace.sh    # Workspace switcher
│   └── README.md              # Scripts documentation
│
├── docs/                      # Additional documentation
│   ├── CLAUDE-SETUP.md        # Claude integration guide
│   ├── HOW-IT-WORKS.md        # Technical explanation
│   ├── demo-output-explanation.md # Output examples
│   └── test-results.md        # Test run results
│
├── .github/                   # GitHub configuration
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
│
├── config/                    # Configuration files
│   └── languages.json         # Language server definitions
│
├── README.md                  # Main documentation
├── INSTALL.md                 # Installation guide
├── CONTRIBUTING.md            # Contribution guidelines
├── CHANGELOG.md               # Version history
├── LICENSE                    # MIT license
├── package.json               # Node.js package config
├── tsconfig.json              # TypeScript configuration
├── .gitignore                 # Git ignore rules
└── PROJECT-STRUCTURE.md       # This file
```

## Key Directories

### `/src`
Contains all TypeScript source code. Each subdirectory handles a specific aspect of BigParse functionality.

### `/examples`
Demonstration scripts showing BigParse capabilities. Run these to see BigParse in action.

### `/scripts`
Shell scripts for easy installation and management of BigParse with Claude Code.

### `/docs`
Additional documentation explaining how BigParse works and its benefits.

## Build Output

The `/dist` directory contains compiled JavaScript and is created by running `npm run build`. This directory is git-ignored but included in npm packages.