# Contributing to Finatic Server SDK for Node.js

Thank you for your interest in contributing to the Finatic Server SDK! We welcome contributions from the community and appreciate your help in making this project better.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/FinaticServerSDK-Node.git
   cd FinaticServerSDK-Node
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run tests** to ensure everything is working:
   ```bash
   npm test
   ```

5. **Run the linter** to check code quality:
   ```bash
   npm run lint
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for new broker integration
fix: resolve authentication token refresh issue
docs: update README with new examples
```

### Pull Request Process

1. **Create a feature branch** from `develop`
2. **Make your changes** following our coding standards
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Run all tests** and ensure they pass
6. **Run the linter** and fix any issues
7. **Create a pull request** to `develop`

### Code Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow our ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Tests**: Write tests for new functionality
- **Documentation**: Update documentation for new features

### Testing

- Write unit tests for new functionality
- Ensure all existing tests pass
- Aim for high test coverage
- Use descriptive test names

### Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update CHANGELOG.md for significant changes
- Include code examples in documentation

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce the bug
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: Node.js version, OS, SDK version
- **Code Snippet**: Minimal code that reproduces the issue
- **Error Message**: Full error message if applicable

### Feature Requests

When requesting features, please include:

- **Description**: Clear description of the feature
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you think it should work
- **Alternatives**: Other solutions you've considered
- **Code Example**: How you'd like to use the feature

## Code Review Process

1. **Automated Checks**: All PRs must pass automated checks
2. **Code Review**: At least one team member must review
3. **Testing**: All tests must pass
4. **Documentation**: Documentation must be updated
5. **Approval**: PR must be approved before merging

## Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Tag**: Create a git tag for the release
4. **Publish**: Publish to npm
5. **Documentation**: Update documentation if needed

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow our code of conduct
- Ask questions if you're unsure

## Getting Help

- **Documentation**: Check our README and docs
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact us at support@finatic.dev

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## Thank You

Thank you for contributing to the Finatic Server SDK! Your contributions help make this project better for everyone.
