import { describe, it, expect } from "vitest";

describe("Basic Setup", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should validate email format", () => {
    function isValidEmail(email) {
      return !!(email && email.includes("@") && email.includes("."));
    }

    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("should validate docket number format", () => {
    function isValidDocketNumber(docket) {
      return /^\d{2}-\d+$/.test(docket);
    }

    expect(isValidDocketNumber("23-108")).toBe(true);
    expect(isValidDocketNumber("11-42")).toBe(true);
    expect(isValidDocketNumber("invalid")).toBe(false);
    expect(isValidDocketNumber("23-")).toBe(false);
  });
});
