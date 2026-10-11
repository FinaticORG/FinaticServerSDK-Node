# Changelog

## 1.0.4

- Release from 95bca51d1efa2746bfc8e7f82483b32392d0237e.


## 1.0.3

- Release from faea98ca23f28566aea3934c6a9a6b862ff70265.


## 1.0.2

- Release from 68be79f911d348e6234ca032078c4ef8ceeadff2.


## 1.0.1

- Release from 3cdbcb965306e931341a963c110c651ed4023bab.


## Unreleased

- Added generated exact/root-only instrument descriptor, order/fill/event/position/lot, and canonical placement types to the public v1 facade. Regenerated from FinaticAPI PR #748 head `a7e80ac708d34f20cb241b8152b3c672674022b5`, OpenAPI blob `59908b0ad6d1ffb1541a0280fb14e9a0c56099a3`, SHA-256 `5c450a4e43aaad1e0f30d0bf0705183b0b882c86308ff78d9ff05cf2bde8054f`.
- Added server session status, authoritative user identity, rejection flags, and an `authenticated` result to `v1.startSession`; rejected or missing server identities no longer fall back to caller input or retain stale SDK identity.
- Removed legacy beta generated broker/company API clients, connection-first models, and position-lot generated types from the 1.0 SDK source.

## 0.9.16

- Release from c851294cba6c578b21ff0d01e76c2ceb48876971.
