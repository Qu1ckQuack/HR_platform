import assert from "node:assert/strict";
import test from "node:test";

import { getRateLimitRetryAfterSeconds } from "./rate-limit-retry";

test("reports only the remaining rate-limit window", () => {
  assert.equal(getRateLimitRetryAfterSeconds(1_000_000, 900, 1_300_000), 600);
});

test("does not return a negative retry delay after the window expires", () => {
  assert.equal(getRateLimitRetryAfterSeconds(1_000_000, 900, 1_901_000), 0);
});
