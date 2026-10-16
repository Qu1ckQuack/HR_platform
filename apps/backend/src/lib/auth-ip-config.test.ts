import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAuthIpAddressOptionsConfigured,
  getAuthIpAddressOptions,
  isUnresolvedClientIpKey,
} from "./auth-ip-config";

test("uses Better Auth's standard forwarded header when unset", () => {
  assert.deepEqual(getAuthIpAddressOptions({}), {
    ipAddressHeaders: ["x-forwarded-for"],
    trustedProxies: [],
  });
});

test("parses configured headers and proxy CIDRs", () => {
  assert.deepEqual(
    getAuthIpAddressOptions({
      BETTER_AUTH_IP_ADDRESS_HEADERS: " CF-Connecting-IP, x-forwarded-for ",
      BETTER_AUTH_TRUSTED_PROXIES: "10.0.0.10, 10.0.1.0/24",
    }),
    {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      trustedProxies: ["10.0.0.10", "10.0.1.0/24"],
    },
  );
});

test("falls back to the standard header when the configured list is blank", () => {
  assert.deepEqual(getAuthIpAddressOptions({ BETTER_AUTH_IP_ADDRESS_HEADERS: " , " }), {
    ipAddressHeaders: ["x-forwarded-for"],
    trustedProxies: [],
  });
});

test("requires an explicit forwarded-IP header in production", () => {
  assert.throws(
    () => assertAuthIpAddressOptionsConfigured({ NODE_ENV: "production" }),
    /BETTER_AUTH_IP_ADDRESS_HEADERS/,
  );
  assert.doesNotThrow(() =>
    assertAuthIpAddressOptionsConfigured({
      NODE_ENV: "production",
      BETTER_AUTH_IP_ADDRESS_HEADERS: "cf-connecting-ip",
    }),
  );
  assert.doesNotThrow(() => assertAuthIpAddressOptionsConfigured({ NODE_ENV: "development" }));
});

test("recognizes Better Auth's unresolved-IP rate-limit key", () => {
  assert.equal(isUnresolvedClientIpKey("no-trusted-ip|/sign-in/email"), true);
  assert.equal(isUnresolvedClientIpKey("127.0.0.1|/sign-in/email"), false);
});
