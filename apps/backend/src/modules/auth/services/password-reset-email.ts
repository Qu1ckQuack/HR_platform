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
    subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน HR Platform",
    text: `รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ ${code}\nรหัสนี้มีอายุ 10 นาที\nหากคุณไม่ได้ร้องขอรีเซ็ตรหัสผ่าน โปรดเพิกเฉยต่ออีเมลฉบับนี้`,
  });
  if (error) throw new Error(`Resend email delivery failed: ${error.message}`, { cause: error });
}
