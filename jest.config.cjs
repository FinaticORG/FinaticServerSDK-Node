module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns:
    process.env.FINATIC_INTEGRATION === "1" ? [] : ["<rootDir>/tests/integration/"],
  testTimeout: process.env.FINATIC_INTEGRATION === "1" ? 120000 : 10000,
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
    "^.+\\.js$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(p-retry|is-network-error|uuid)/)",
  ],
  collectCoverageFrom: [
    "src/wrappers/v1.ts",
    "src/FinaticServerCore.ts",
    "src/config.ts",
    "src/utils/**/*.ts",
    "src/index.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    // Generated OpenAPI legacy wrappers — covered by smoke tests, excluded from gate denominator.
    "!src/openapi/**",
    "!src/openapi-legacy/**",
    "!src/wrappers/brokers.ts",
    "!src/wrappers/session.ts",
    "!src/wrappers/company.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  // Phase 7 gate — hand-maintained SDK surface (v1 facade, utils, config).
  coverageThreshold: {
    global: {
      branches: 36,
      functions: 68,
      lines: 50,
      statements: 49,
    },
  },
};
