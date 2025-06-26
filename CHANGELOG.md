# Changelog

All notable changes to BigParse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-26

### Added
- Initial release of BigParse MCP server
- Multi-language support for TypeScript, JavaScript, Python, Rust, Go, Dart/Flutter, and more
- Language Server Protocol (LSP) integration for accurate symbol extraction
- Lightning-fast regex-based code search across entire codebases
- Intelligent caching system for 1000x+ faster re-indexing
- Symbol extraction (classes, functions, interfaces, variables)
- Find references functionality to locate all uses of a symbol
- Go to definition support for navigating codebases
- Secure subprocess handling for language server installation
- Command validation and whitelisting for security
- MCP tool integration for Claude Desktop and Claude Code
- Elicitation system that prompts for language server installation
- Support for incremental indexing of changed files
- Helper scripts for easy installation and workspace management
- Comprehensive test suite and demo scripts

### Features
- `index_codebase` - Index project files with language filtering
- `search_code` - Search with regex patterns and file type filtering
- `get_symbols` - Extract symbols from specific files
- `find_references` - Find all references to a symbol at a specific location
- `go_to_definition` - Navigate to symbol definitions
- `check_language_servers` - Check which language servers are installed
- `install_language_server` - Safely install language servers

### Security
- Command whitelisting for subprocess execution
- Pattern detection to prevent command injection
- Validation of all external commands

### Performance
- Sub-20ms indexing for typical projects
- 1000x+ speed improvement on re-indexing with cache
- Minimal context usage (50 tokens vs 5000+ without BigParse)

### Documentation
- Comprehensive README with installation and usage instructions
- Visual demonstrations of BigParse benefits
- Helper scripts for Claude Code integration
- Troubleshooting guide

## Future Releases

### [Planned Features]
- Additional language support (Kotlin, Scala, Elixir)
- Enhanced symbol relationships and call graphs
- Project-wide refactoring suggestions
- Integration with more MCP-compatible tools
- Web UI for visualizing codebase structure