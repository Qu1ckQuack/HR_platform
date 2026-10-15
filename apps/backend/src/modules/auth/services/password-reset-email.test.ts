import assert from "node:assert/strict";
import { test } from "node:test";
import { getSmtpConfiguration } from "./password-reset-email";

const validEnvironment = {
  SMTP_HOST: "smtp.example.test",
  SMTP_FROM: "noreply@example.test",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
};

test("builds a STARTTLS configuration for port 587", () => {
  assert.deepEqual(getSmtpConfiguration(validEnvironment), {
    host: "smtp.example.test",
    from: "noreply@example.test",
    port: 587,
    secure: false,
    auth: undefined,
  });
});

test("defaults port 465 to implicit TLS", () => {
  assert.equal(getSmtpConfiguration({ ...validEnvironment, SMTP_PORT: "465", SMTP_SECURE: undefined }).secure, true);
});

test("rejects missing host or sender", () => {
  assert.throws(() => getSmtpConfiguration({}), /SMTP_HOST and SMTP_FROM are required/);
});

test("rejects invalid port and TLS flag", () => {
  assert.throws(() => getSmtpConfiguration({ ...validEnvironment, SMTP_PORT: "not-a-port" }), /SMTP_PORT/);
  assert.throws(() => getSmtpConfiguration({ ...validEnvironment, SMTP_SECURE: "yes" }), /SMTP_SECURE/);
});

test("rejects incomplete SMTP authentication", () => {
  assert.throws(() => getSmtpConfiguration({ ...validEnvironment, SMTP_USER: "mailer" }), /must be configured together/);
  assert.throws(() => getSmtpConfiguration({ ...validEnvironment, SMTP_PASSWORD: "password" }), /must be configured together/);
});
