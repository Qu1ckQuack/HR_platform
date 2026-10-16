import { Resend } from "resend";

export function getResendConfiguration(env: Record<string, string | undefined> = process.env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and RESEND_FROM are required");
  return { apiKey, from };
}

export async function sendResetOtpEmail(email: string, code: string) {
  const { apiKey, from } = getResendConfiguration();

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: [email],
    subject: "HR Platform password reset code",
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  });
  if (error) throw new Error(`Resend email delivery failed: ${error.message}`);
}
