"use strict";
/**
 * Structured logger utility with pino package (Phase 2B).
 *
 * Generated - do not edit directly.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = getLogger;
// @ts-ignore - pino types available via @types/pino
const pino_1 = __importDefault(require("pino"));
let _loggerInstance = null;
/**
 * Get or create a pino logger instance.
 */
function getLogger(config) {
    if (_loggerInstance) {
        return _loggerInstance;
    }
    const logLevel = (config?.logLevel || process.env['FINATIC_LOG_LEVEL'] || 'error');
    const pinoConfig = {
        level: logLevel === 'silent' ? 'silent' : logLevel,
        ...(config?.structuredLogging !== false && {
            formatters: {
                level: (label) => {
                    return { level: label };
                },
            },
            timestamp: pino_1.default.stdTimeFunctions.isoTime,
        }),
    };
    _loggerInstance = (0, pino_1.default)(pinoConfig);
    return _loggerInstance;
}
//# sourceMappingURL=logger.js.map