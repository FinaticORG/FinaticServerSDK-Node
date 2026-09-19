/**
 * Main SDK entry point.
 *
 * Hand-authored exports compose ``src/openapi/`` (OpenAPI Generator output) with wrappers and utilities.
 *
 * Regenerate: ``make openapi-generate`` from the Finatic workspace root.
 */

// Re-export SDK wrappers and utilities
export * from './wrappers';
export * from './utils';
export * from './config';

export { FinaticServer } from './FinaticServer';
export type { FinaticV1Response, FinaticV1Error, FinaticV1ErrorCode } from './wrappers/v1';

export type { AccountOrderCommandRequest } from './openapi/models/account-order-command-request';
export type { AccountOrderPayload } from './openapi/models/account-order-payload';
export type { FDXBrokerOrder } from './openapi/models/fdxbroker-order';
export type { FDXBrokerOrderCommandResult } from './openapi/models/fdxbroker-order-command-result';
export type { FDXBrokerOrderEvent } from './openapi/models/fdxbroker-order-event';
export type { FDXBrokerOrderFill } from './openapi/models/fdxbroker-order-fill';
export type { FDXBrokerPosition } from './openapi/models/fdxbroker-position';
export type { FDXBrokerPositionLot } from './openapi/models/fdxbroker-position-lot';
export type { FDXBrokerPositionLotFill } from './openapi/models/fdxbroker-position-lot-fill';
export type { FDXFutureInstrumentDetails } from './openapi/models/fdxfuture-instrument-details';
export { FDXFutureInstrumentDetailsIdentityQualityEnum } from './openapi/models/fdxfuture-instrument-details';
export type { FDXInstrumentDescriptor } from './openapi/models/fdxinstrument-descriptor';
export { FDXInstrumentDescriptorVersionEnum } from './openapi/models/fdxinstrument-descriptor';
export type { FDXOrderLeg } from './openapi/models/fdxorder-leg';
