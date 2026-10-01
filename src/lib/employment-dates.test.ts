import assert from "node:assert/strict";
import test from "node:test";

import {
  getCurrentBangkokDate,
  getProbationCompletionDate,
} from "./employment-dates";

test("uses the Bangkok calendar date for the current instant", () => {
  assert.equal(
    getCurrentBangkokDate(new Date("2026-09-30T17:00:00.000Z")),
    "2026-10-01",
  );
});

test("calculates probation completion 120 calendar days after start", () => {
  assert.equal(getProbationCompletionDate("2026-01-01"), "2026-05-01");
});

test("rejects an invalid start date", () => {
  assert.throws(() => getProbationCompletionDate("2026-02-30"), RangeError);
});
