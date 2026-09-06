import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPhoneIdentity, isValidPhone, normalizePhone, phonesMatch } from "./phone.ts";

describe("normalizePhone", () => {
  it("keeps international numbers as bare digits", () => {
    assert.equal(normalizePhone("+1 (555) 000-1234"), "15550001234");
    assert.equal(normalizePhone("15550001234"), "15550001234");
    assert.equal(normalizePhone("+44 7700 900123"), "447700900123");
  });

  it("promotes Israeli local formats to 972", () => {
    assert.equal(normalizePhone("050-123-4567"), "972501234567");
    assert.equal(normalizePhone("0501234567"), "972501234567");
    assert.equal(normalizePhone("03-1234567"), "97231234567");
    assert.equal(normalizePhone("+972 050 123 4567"), "972501234567");
    assert.equal(normalizePhone("00972501234567"), "972501234567");
    assert.equal(normalizePhone("501234567"), "972501234567");
  });

  it("does not fabricate a number for short QA identities", () => {
    assert.equal(normalizePhone("1234"), "1234");
    assert.equal(normalizePhone("5678"), "5678");
    assert.equal(normalizePhone("555"), "555");
    assert.equal(normalizePhone("5550001234"), "5550001234");
  });

  it("undoes the old 972555 padding of short test numbers", () => {
    assert.equal(normalizePhone("9725551234"), "1234");
    assert.equal(normalizePhone("97255512345"), "12345");
    // a real 055 mobile has 12 digits and is left alone
    assert.equal(normalizePhone("972555123456"), "972555123456");
  });
});

describe("isPhoneIdentity / isValidPhone", () => {
  it("accepts 4+ digits as an identity but only 8+ as a real phone", () => {
    assert.equal(isPhoneIdentity("1234"), true);
    assert.equal(isValidPhone("1234"), false);
    assert.equal(isPhoneIdentity("555"), false);
    assert.equal(isValidPhone("15550001234"), true);
    assert.equal(isValidPhone("0501234567"), true);
    assert.equal(isValidPhone("1234567890123456"), false);
  });
});

describe("phonesMatch", () => {
  it("resolves short QA identities to the stored long ones", () => {
    assert.equal(phonesMatch("1234", "15550001234"), true);
    assert.equal(phonesMatch("15550001234", "1234"), true);
    assert.equal(phonesMatch("5678", "15550005678"), true);
    assert.equal(phonesMatch("1234", "15550005678"), false);
    assert.equal(phonesMatch("9725551234", "15550001234"), true);
  });

  it("treats country-code and trunk variants of one number as the same", () => {
    assert.equal(phonesMatch("5550001234", "15550001234"), true);
    assert.equal(phonesMatch("0501234567", "972501234567"), true);
    assert.equal(phonesMatch("+972501234567", "050-123-4567"), true);
  });

  it("keeps distinct real numbers apart", () => {
    assert.equal(phonesMatch("972501234567", "972541234567"), false);
    assert.equal(phonesMatch("15550001234", "15550005678"), false);
  });

  it("refuses to match on fewer than 4 digits", () => {
    assert.equal(phonesMatch("555", "15550001234"), false);
    assert.equal(phonesMatch("", "15550001234"), false);
  });
});
