# Support

We're here to help! If you're having trouble with the Finatic Server SDK for Node.js, here are the best ways to get support.

## 📚 Documentation

Before reaching out, please check our documentation:

- **[README.md](README.md)** - Getting started guide and basic usage
- **[API Reference](docs/api-reference/)** - Complete API documentation
- **[Examples](examples/)** - Code examples and tutorials
- **[Changelog](CHANGELOG.md)** - Recent changes and updates

## 🐛 Bug Reports

Found a bug? Please report it so we can fix it:

1. **Check existing issues** - Search [GitHub Issues](https://github.com/FinaticORG/FinaticServerSDK-Node/issues) to see if it's already reported
2. **Create a new issue** - Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. **Include details**:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, SDK version)
   - Code snippet that reproduces the issue
   - Full error message

## 💡 Feature Requests

Have an idea for a new feature? We'd love to hear it:

1. **Check existing requests** - Search [GitHub Issues](https://github.com/FinaticORG/FinaticServerSDK-Node/issues) for similar requests
2. **Create a new issue** - Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. **Include details**:
   - Clear description of the feature
   - Use case and why it would be useful
   - Proposed solution or implementation
   - Code example of how you'd use it

## ❓ Questions & Help

Need help getting started or have questions?

### GitHub Discussions
- **[General Discussions](https://github.com/FinaticORG/FinaticServerSDK-Node/discussions)** - Ask questions, share ideas, get help
- **[Q&A](https://github.com/FinaticORG/FinaticServerSDK-Node/discussions/categories/q-a)** - Quick questions and answers
- **[Show and Tell](https://github.com/FinaticORG/FinaticServerSDK-Node/discussions/categories/show-and-tell)** - Share your projects and implementations

### Email Support
- **General questions**: support@finatic.dev
- **Technical issues**: tech@finatic.dev
- **Security concerns**: security@finatic.dev

### Response Times
- **GitHub Issues**: 1-3 business days
- **GitHub Discussions**: 1-2 business days
- **Email**: 1-2 business days
- **Security issues**: 24 hours

## 🔧 Troubleshooting

### Common Issues

#### Authentication Problems
```typescript
// Make sure you're using the correct API key
const client = new FinaticServerClient('your-api-key');

// Ensure you're calling initialize() before other methods
await client.initialize();
```

#### Session Issues
```typescript
// Check if session is properly initialized
if (!client.is_authenticated()) {
  console.log('Not authenticated. Please complete authentication first.');
}
```

#### Network Errors
```typescript
// Check your internet connection and API endpoint
const client = new FinaticServerClient('api-key', 'https://api.finatic.dev');
```

#### TypeScript Issues
```typescript
// Make sure you have the latest types
npm install @finatic/server-node@latest

// Check your tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Debug Mode

Enable debug logging to see what's happening:

```typescript
// Set environment variable
process.env.DEBUG = 'finatic:*';

// Or enable in your code
const client = new FinaticServerClient('api-key', 'https://api.finatic.dev', undefined, 30000);
```

## 🤝 Contributing

Want to contribute to the project? Great! Check out our [Contributing Guide](.github/CONTRIBUTING.md).

## 📞 Emergency Support

For critical production issues:

- **Email**: emergency@finatic.dev
- **Phone**: +1 (555) 123-4567 (Business hours: 9 AM - 5 PM PST)
- **Response time**: 2-4 hours

## 🔒 Security Issues

If you discover a security vulnerability:

- **Email**: security@finatic.dev
- **Subject**: "SECURITY: " + brief description
- **Do NOT** create public GitHub issues for security problems

## 📋 Before You Contact Us

To help us help you faster, please include:

1. **SDK version**: `npm list @finatic/server-node`
2. **Node.js version**: `node --version`
3. **Operating system**: `uname -a` or `systeminfo`
4. **Error messages**: Full error stack trace
5. **Code snippet**: Minimal code that reproduces the issue
6. **Steps to reproduce**: Detailed steps
7. **Expected behavior**: What you expected to happen
8. **Actual behavior**: What actually happened

## 🎯 Getting the Most Out of Support

- **Be specific**: Include exact error messages and code snippets
- **Be patient**: We'll get back to you as soon as possible
- **Be respectful**: We're here to help, and we appreciate your patience
- **Be thorough**: Include all relevant information upfront

## 📖 Additional Resources

- **[Finatic API Documentation](https://docs.finatic.dev)** - Complete API reference
- **[Node.js Documentation](https://nodejs.org/docs/)** - Node.js official docs
- **[TypeScript Documentation](https://www.typescriptlang.org/docs/)** - TypeScript official docs
- **[Axios Documentation](https://axios-http.com/docs/intro)** - HTTP client we use

## 🙏 Thank You

Thank you for using the Finatic Server SDK! We appreciate your feedback and are committed to making this project the best it can be.
