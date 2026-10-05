import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GENERIC_INVITE_TITLE, inviteTitle } from "./invite-title.ts";

describe("inviteTitle", () => {
  it("puts the sender name first", () => {
    assert.equal(inviteTitle("Naor"), "Naor שלח לך נשיקה 💋");
    assert.equal(inviteTitle("נאור"), "נאור שלח לך נשיקה 💋");
  });

  it("falls back to the generic title without a real name", () => {
    assert.equal(inviteTitle(null), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle(undefined), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle("   "), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle("Someone"), GENERIC_INVITE_TITLE);
  });

  it("strips control and bidi characters, collapses whitespace, caps length", () => {
    assert.equal(inviteTitle("  Dana\u202e \n Cohen\u0000 "), "Dana Cohen שלח לך נשיקה 💋");
    assert.equal(inviteTitle("x".repeat(80)), `${"x".repeat(32)} שלח לך נשיקה 💋`);
  });

  it("returns plain text so the renderer escapes it exactly once", () => {
    assert.equal(inviteTitle(`<b>"A&B"</b>`), `<b>"A&B"</b> שלח לך נשיקה 💋`);
  });
});
