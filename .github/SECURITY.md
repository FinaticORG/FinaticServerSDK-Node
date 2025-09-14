# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send an email to security@finatic.dev
2. **Subject**: Use "SECURITY: " followed by a brief description
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide regular updates on our progress
- We will credit you in our security advisories (unless you prefer to remain anonymous)

### Scope

This security policy applies to:
- The Finatic Server SDK for Node.js
- All related documentation
- All example code

### Out of Scope

- Issues in third-party dependencies (please report these to the respective maintainers)
- Issues in the Finatic API itself (please report these to our API security team)

## Security Best Practices

When using this SDK:

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive configuration
3. **Keep the SDK updated** to the latest version
4. **Validate all inputs** before passing them to the SDK
5. **Use HTTPS** for all API communications
6. **Implement proper error handling** for authentication failures

## Disclosure Policy

- We follow responsible disclosure practices
- We will not disclose vulnerabilities until they are fixed
- We will provide advance notice of security updates when possible
- We will work with you to coordinate disclosure if you wish to publish your own advisory

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1, 0.1.2) and will be available immediately on npm.

## Contact

For security-related questions or concerns, please contact security@finatic.dev.
