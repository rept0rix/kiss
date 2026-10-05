import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GENERIC_INVITE_TITLE, inviteTitle } from "./invite-title.ts";

describe("inviteTitle", () => {
  it("attaches מ directly to a Hebrew name", () => {
    assert.equal(inviteTitle("נאור בדיקה"), "נשיקה מנאור בדיקה 💋");
    assert.equal(inviteTitle("נאור"), "נשיקה מנאור 💋");
  });

  it("uses מ- before a Latin (or other non-Hebrew) name", () => {
    assert.equal(inviteTitle("Naor Y"), "נשיקה מ-Naor Y 💋");
    assert.equal(inviteTitle("QA TESTER"), "נשיקה מ-QA TESTER 💋");
    assert.equal(inviteTitle("7even"), "נשיקה מ-7even 💋");
  });

  it("falls back to the generic title without a real name", () => {
    assert.equal(inviteTitle(null), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle(undefined), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle("   "), GENERIC_INVITE_TITLE);
    assert.equal(inviteTitle("Someone"), GENERIC_INVITE_TITLE);
  });

  it("strips control and bidi characters, collapses whitespace, caps length", () => {
    assert.equal(inviteTitle("  Dana\u202e \n Cohen\u0000 "), "נשיקה מ-Dana Cohen 💋");
    assert.equal(inviteTitle("\u200fנאור"), "נשיקה מנאור 💋");
    assert.equal(inviteTitle("x".repeat(80)), `נשיקה מ-${"x".repeat(32)} 💋`);
  });

  it("returns plain text so the renderer escapes it exactly once", () => {
    assert.equal(inviteTitle(`<b>"A&B"</b>`), `נשיקה מ-<b>"A&B"</b> 💋`);
  });
});
