# FinaticServerSDK-Node Architecture and Runtime

## Package Role

`FinaticServerSDK-Node` provides server-side Node integration with API-key/session flows and broker-domain operations.

## Internal Structure

- **Public entrypoints**: `src/index.ts`, `src/FinaticServer.ts`
- **Core runtime**: `src/FinaticServerCore.ts`
- **Generated API client**: `src/openapi`
- **Domain wrappers**: `src/wrappers`
- **Cross-cutting utilities**: `src/utils`

## Runtime Flow (High Level)

1. SDK initializes with API key and runtime config.
2. Session/token helper methods establish secure call context.
3. Wrapper methods execute broker-domain operations via generated clients.
4. Utility layers enforce retry/validation/response normalization.

## Operational Boundaries

- Browser portal UX ownership is in `FinaticClientSDK`/`FinaticConnect`.
- Backend service authority remains in `finaticAPI`.
