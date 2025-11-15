"use strict";
/**
 * Input validation utility with zod package (Phase 2B).
 *
 * Generated - do not edit directly.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = validateParams;
exports.numberSchema = numberSchema;
exports.stringSchema = stringSchema;
const z = __importStar(require("zod"));
// Import ValidationError but don't re-export to avoid duplicate exports
const error_handling_1 = require("./error-handling");
/**
 * Validate parameters using zod schema.
 */
function validateParams(schema, params, config) {
    if (!config?.validationEnabled) {
        return params;
    }
    try {
        return schema.parse(params);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const message = `Validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
            if (config?.validationStrict) {
                throw new error_handling_1.ValidationError(message);
            }
            else {
                console.warn(`[Validation Warning] ${message}`);
                return params;
            }
        }
        throw error;
    }
}
/**
 * Create a number schema with min/max constraints.
 */
function numberSchema(min, max, defaultVal) {
    let schema = z.number();
    if (min !== undefined)
        schema = schema.min(min);
    if (max !== undefined)
        schema = schema.max(max);
    if (defaultVal !== undefined) {
        // Use .default() which automatically makes the field optional
        // This avoids the ZodUnion issue with .optional().default()
        schema = schema.default(defaultVal);
    }
    return schema;
}
/**
 * Create a string schema with length constraints.
 */
function stringSchema(min, max, defaultVal) {
    let schema = z.string();
    if (min !== undefined)
        schema = schema.min(min);
    if (max !== undefined)
        schema = schema.max(max);
    if (defaultVal !== undefined) {
        // Use .default() which automatically makes the field optional
        // This avoids the ZodUnion issue with .optional().default()
        schema = schema.default(defaultVal);
    }
    return schema;
}
//# sourceMappingURL=validation.js.map