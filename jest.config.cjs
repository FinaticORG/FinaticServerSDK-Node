module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
      },
    ],
    "^.+\\.js$": [
      "ts-jest",
      {
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(p-retry|is-network-error)/)",
  ],
};
