# BigParse Scripts

This directory contains helper scripts for managing BigParse.

## Installation Scripts

### install-for-claude.sh
Quick installation script for Claude Code integration.

```bash
./scripts/install-for-claude.sh
```

### update-workspace.sh
Update the workspace directory that BigParse analyzes.

```bash
./scripts/update-workspace.sh /path/to/your/project
```

## Making Scripts Executable

If scripts aren't executable, run:

```bash
chmod +x scripts/*.sh
```

## Script Details

### install-for-claude.sh
- Checks if BigParse is already installed
- Adds BigParse to Claude's MCP configuration
- Provides usage instructions

### update-workspace.sh
- Removes existing BigParse configuration
- Re-adds with new workspace path
- Useful for switching between projects