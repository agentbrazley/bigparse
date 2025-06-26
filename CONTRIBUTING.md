# Contributing to BigParse

First off, thank you for considering contributing to BigParse! It's people like you that make BigParse such a great tool for the Claude community.

## Code of Conduct

By participating in this project, you are expected to uphold our values of being respectful, inclusive, and collaborative.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/BigParse.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Build the project: `npm run build`
6. Run tests: `npm test`

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm 8+
- TypeScript knowledge
- Understanding of Language Server Protocol (helpful but not required)

### Running Locally

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Adding Language Support

To add support for a new language:

1. Add the language configuration to `src/config/languages.json`:
```json
{
  "languages": {
    "yourlang": {
      "command": "yourlang-language-server",
      "args": ["--stdio"],
      "fileExtensions": [".yl", ".yourlang"],
      "installCommand": "npm install -g yourlang-language-server"
    }
  }
}
```

2. Update the file pattern mappings in `src/indexing/indexer.ts`
3. Add tests for the new language
4. Update the README with installation instructions

## Code Style

### TypeScript Style

- Use TypeScript for all new code
- Follow the existing code style (2 spaces, no semicolons optional)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `async/await` over callbacks
- Use early returns to reduce nesting

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add support for Ruby language server

- Implement Ruby LSP configuration
- Add tests for Ruby symbol extraction
- Update documentation with Ruby examples

Fixes #123
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test with and without language servers installed
- Test error cases and edge conditions

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue that pull request!

### Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code lints (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)

## Reporting Issues

### Bugs

Before creating bug reports, please check existing issues. When you are creating a bug report, please include:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include any error messages or logs**
- **Include your environment details** (OS, Node version, etc.)

### Feature Requests

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate how it would work**
- **Explain why this enhancement would be useful**

## License

By contributing, you agree that your contributions will be licensed under the MIT License.