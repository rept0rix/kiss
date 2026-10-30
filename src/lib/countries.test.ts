import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COUNTRIES, validatePhoneForCountry } from "./countries.ts";

describe("validatePhoneForCountry", () => {
  const israel = COUNTRIES.find((c) => c.code === "IL")!;
  const us = COUNTRIES.find((c) => c.code === "US")!;

  it("validates Israeli 10-digit mobile number", () => {
    const res = validatePhoneForCountry(israel, "050-123-4567");
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedPhone, "972501234567");
  });

  it("validates Israeli 9-digit mobile number without leading 0", () => {
    const res = validatePhoneForCountry(israel, "501234567");
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedPhone, "972501234567");
  });

  it("rejects Israeli numbers with too few digits", () => {
    const res = validatePhoneForCountry(israel, "050123");
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Missing 4 digits/);
  });

  it("rejects Israeli numbers with too many digits", () => {
    const res = validatePhoneForCountry(israel, "050123456789");
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Too many digits/);
  });

  it("validates US 10-digit number", () => {
    const res = validatePhoneForCountry(us, "(555) 123-4567");
    assert.equal(res.isValid, true);
    assert.equal(res.normalizedPhone, "15551234567");
  });

  it("rejects US numbers with too few digits", () => {
    const res = validatePhoneForCountry(us, "555123");
    assert.equal(res.isValid, false);
    assert.match(res.error || "", /Number too short/);
  });
});
