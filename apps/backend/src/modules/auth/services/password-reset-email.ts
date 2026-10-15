import nodemailer from "nodemailer";

type SmtpEnvironment = Record<string, string | undefined>;
type SmtpConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
};

export function getSmtpConfiguration(env: SmtpEnvironment = process.env): SmtpConfiguration {
  const host = env.SMTP_HOST?.trim();
  const from = env.SMTP_FROM?.trim();
  if (!host || !from) throw new Error("SMTP_HOST and SMTP_FROM are required");

  const port = Number(env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535");
  }
  const secureFlag = env.SMTP_SECURE?.trim().toLowerCase();
  if (secureFlag && secureFlag !== "true" && secureFlag !== "false") {
    throw new Error("SMTP_SECURE must be true or false");
  }

  const user = env.SMTP_USER?.trim();
  const password = env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  }
  return {
    host,
    port,
    secure: secureFlag ? secureFlag === "true" : port === 465,
    auth: user && password ? { user, pass: password } : undefined,
    from,
  };
}

export async function sendResetOtpEmail(email: string, code: string) {
  const configuration = getSmtpConfiguration();
  const { from, ...transportOptions } = configuration;
  const transport = nodemailer.createTransport(transportOptions);
  await transport.sendMail({
    from,
    to: email,
    subject: "HR Platform password reset code",
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  });
}
