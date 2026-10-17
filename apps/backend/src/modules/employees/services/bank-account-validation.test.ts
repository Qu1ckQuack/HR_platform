import assert from "node:assert/strict";
import test from "node:test";
import { getBankAccountValidationError } from "./bank-account-validation";

test("requires a bank account with one to fifteen digits", () => {
  assert.equal(getBankAccountValidationError(""), "กรุณากรอกบัญชีธนาคาร");
  assert.equal(getBankAccountValidationError("1"), null);
  assert.equal(getBankAccountValidationError("123456789012345"), null);
  assert.equal(getBankAccountValidationError("1234567890123456"), "เลขบัญชีธนาคารต้องเป็นตัวเลขไม่เกิน 15 หลัก");
  assert.equal(getBankAccountValidationError("12345x"), "เลขบัญชีธนาคารต้องเป็นตัวเลขไม่เกิน 15 หลัก");
});
