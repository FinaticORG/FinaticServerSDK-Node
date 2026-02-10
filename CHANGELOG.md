# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Features and improvements in development

## [0.9.11] - 2026-02-10

### Changed

- Version bump for production release alignment

## [0.9.8] - 2025-01-XX

### Fixed

- Fixed CommonJS compatibility issue by bundling `p-retry` dependency
  - `p-retry` v7+ is ESM-only and cannot be `require()`'d in CommonJS builds
  - Now bundled into the CommonJS output to support clients using `require()`
  - Resolves `ERR_REQUIRE_ESM` error when using the SDK in CommonJS environments

## [0.9.0] - 2025-11-28

### Added

- Initial SDK release
- Node.js SDK for Finatic Server API
- Full TypeScript support with comprehensive type definitions
- Standardized API interface for multiple brokerages
- Comprehensive error handling
- Request retry and caching capabilities
