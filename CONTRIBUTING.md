# Contributing to Visual Memory Search

## Welcome Contributors!

We're thrilled that you're interested in contributing to Visual Memory Search. This document provides guidelines for contributing to the project.

## Development Workflow

### Prerequisites
- Node.js (v18+)
- pnpm package manager
- Convex account

### Setup
```bash
# Fork the repository
# Clone your forked repository
git clone https://github.com/your-username/visual-memory-search.git
cd visual-memory-search

# Install dependencies
pnpm install

# Set up Convex project
pnpm setup-convex

# Start development server
pnpm dev
```

## Contribution Types

### 1. Code Contributions
- Follow TypeScript best practices
- Maintain consistent code style
- Write comprehensive tests
- Update documentation

### 2. Bug Reports
- Use GitHub Issues
- Provide detailed reproduction steps
- Include environment details
- Attach screenshots if applicable

### 3. Feature Requests
- Open a GitHub Issue
- Describe the proposed feature
- Explain its value and use cases
- Provide potential implementation ideas

## Development Guidelines

### Code Style
- Use ESLint and Prettier
- Follow TypeScript strict mode
- Write clear, concise comments
- Keep functions small and focused

### Testing
```bash
# Run all tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Update documentation
7. Submit pull request

### Commit Message Convention
```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation update
- style: Code formatting
- refactor: Code restructuring
- test: Test additions/modifications
- chore: Maintenance tasks
```

## Code of Conduct

### Our Pledge
- Welcoming and inclusive environment
- Harassment-free experience
- Constructive and respectful communication

### Responsibilities
- Be respectful of differing viewpoints
- Accept constructive criticism
- Focus on what's best for the community

## Recognition

Contributors will be recognized in:
- README.md
- CONTRIBUTORS.md
- GitHub repository credits

## Questions?

Open a GitHub Issue or contact the maintainers directly.

Thank you for contributing!