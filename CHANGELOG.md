cd  npm run build

> @finatic/server-node@0.1.0 build
> tsc

src/core/client/FinaticServerClient.ts:39:11 - error TS6133: 'baseUrl' is declared but its value is never read.

39 private baseUrl: string;

```

src/core/client/FinaticServerClient.ts:40:11 - error TS6133: 'deviceInfo' is declared but its value is never read.

40 private deviceInfo?: DeviceInfo;
```

src/core/client/FinaticServerClient.ts:41:11 - error TS6133: 'timeout' is declared but its value is never read.

41 private timeout: number;

```

src/core/client/FinaticServerClient.ts:60:5 - error TS2412: Type 'DeviceInfo | undefined' is not assignable to type 'DeviceInfo' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'DeviceInfo'.

60 this.deviceInfo = deviceInfo || undefined;
```

src/core/client/FinaticServerClient.ts:106:7 - error TS2412: Type 'string | undefined' is not assignable to type 'string' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'string'.

106 this.sessionId = response.data?.session_id || undefined;

```

src/core/client/FinaticServerClient.ts:107:7 - error TS2412: Type 'string | undefined' is not assignable to type 'string' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'string'.

107 this.companyId = response.data?.company_id || undefined;
```

src/core/client/FinaticServerClient.ts:110:7 - error TS2412: Type 'string | undefined' is not assignable to type 'string' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'string'.

110 this.sessionId = response.session_id || undefined;

```

src/core/client/FinaticServerClient.ts:111:7 - error TS2412: Type 'string | undefined' is not assignable to type 'string' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'string'.

111 this.companyId = response.company_id || undefined;
```

src/core/client/FinaticServerClient.ts:373:5 - error TS6133: 'connectionId' is declared but its value is never read.

373 connectionId?: string

```

src/core/client/FinaticServerClient.ts:421:5 - error TS6133: 'broker' is declared but its value is never read.

421 broker?: string,
~~~~~~

src/core/client/FinaticServerClient.ts:422:5 - error TS6133: 'connectionId' is declared but its value is never read.

422 connectionId?: string
```

src/types/common.ts:98:5 - error TS2412: Type 'NavigationCallback<T> | undefined' is not assignable to type 'NavigationCallback<T>' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.
Type 'undefined' is not assignable to type 'NavigationCallback<T>'.

98 this.navigationCallback = navigationCallback || undefined;

```

Found 12 errors in 2 files.

Errors Files
11 src/core/client/FinaticServerClient.ts:39
1 src/types/common.ts:98
 # Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Finatic Server SDK for Node.js
- Authentication support with API key and session management
- Portfolio management capabilities
- Trading operations (place, modify, cancel orders)
- Broker integration (Robinhood, TastyTrade, NinjaTrader)
- Full TypeScript support
- Comprehensive error handling
- Pagination support for large datasets
- Memory-based token and session storage

### Features

- **Authentication**: Multiple authentication methods including portal, direct, and OTP
- **Portfolio**: Access to holdings, positions, and portfolio data
- **Trading**: Complete order management across supported brokers
- **Brokers**: Broker discovery, account management, and connection handling
- **Types**: Full TypeScript definitions for all API responses
- **Errors**: Specific error types for different failure scenarios

## [0.2.0] - 2025-10-30

### Added

- New helper: `getToken(apiKey?)` to mint a one-time token for the Client SDK.
- Demo app updated to initialize, fetch a token, and print it.
- Website docs updated with server get token flow and code samples.

### Notes

- `initialize()` is required before calling `getToken()`.
- `getToken()` does not modify the server session; `start_session()` still performs its own init+start.

## [0.1.0] - 2024-09-13

### Added

- Initial implementation
- Core client functionality
- Type definitions
- Basic examples and documentation
```
