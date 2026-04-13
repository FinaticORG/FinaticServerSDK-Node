/**
 * Contract tests for stable public exports (regen-safe).
 * See docs/sdk-public-api-inventory.md at repo root.
 */
import {
  BrokersWrapper,
  CompanyWrapper,
  FinaticServer,
  SessionWrapper,
} from "../../src/index";

describe("public surface @finatic/server-node", () => {
  it("exports FinaticServer", () => {
    expect(FinaticServer).toBeDefined();
    expect(typeof FinaticServer).toBe("function");
    expect(FinaticServer.init).toBeDefined();
    expect(typeof FinaticServer.init).toBe("function");
  });

  it("exports domain wrappers", () => {
    expect(BrokersWrapper).toBeDefined();
    expect(CompanyWrapper).toBeDefined();
    expect(SessionWrapper).toBeDefined();
  });
});
