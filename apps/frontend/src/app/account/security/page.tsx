"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecuritySettingsHeader } from "./SecuritySettingsHeader";

export default function AccountSecurityPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/totp/setup", { method: "POST", credentials: "include" });
      const result = await response.json() as { secret?: string; error?: string };
      if (!response.ok || !result.secret) throw new Error(result.error ?? "ลงทะเบียน Authenticator ไม่สำเร็จ");
      setSecret(result.secret);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "ลงทะเบียน Authenticator ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function enableTotp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "ตรวจสอบรหัสไม่สำเร็จ");
      setSecret("");
      setToken("");
      setMessageType("success");
      setMessage("เปิดใช้ Authenticator สำหรับรีเซ็ตรหัสผ่านแล้ว");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "ตรวจสอบรหัสไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <SecuritySettingsHeader onClose={() => router.push("/employees")} />
        <div className="space-y-5 p-5 sm:p-7">
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
            ใช้รหัสจากแอป Authenticator เพื่อยืนยันตัวตนตอนรีเซ็ตรหัสผ่าน หากยังไม่ตั้งค่าหรือสูญเสียอุปกรณ์ จะไม่สามารถรีเซ็ตรหัสผ่านด้วยตนเองได้
          </p>
          {!secret ? (
            <button type="button" onClick={() => void startSetup()} disabled={busy} className="min-h-11 rounded-lg bg-[#102d59] px-5 py-2.5 font-semibold text-white transition hover:bg-[#183e75] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102d59] disabled:cursor-wait disabled:opacity-60">
              {busy ? "กำลังเริ่มตั้งค่า…" : "เริ่มตั้งค่า Authenticator"}
            </button>
          ) : (
            <form onSubmit={enableTotp} className="space-y-4 rounded-xl border border-slate-300 bg-slate-50 p-4 sm:p-5">
              <div>
                <h2 className="font-semibold text-slate-900">เชื่อมต่อแอป Authenticator</h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">เพิ่มบัญชีนี้ในแอป แล้วกรอกรหัสลับเพื่อยืนยันการเชื่อมต่อ</p>
              </div>
              <code className="block break-all rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900">{secret}</code>
              <label className="block text-sm font-semibold text-slate-900">รหัส 6 หลักจากแอป
                <input value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 block min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#102d59] focus:ring-2 focus:ring-blue-200" required />
              </label>
              <button type="submit" disabled={busy || token.length !== 6} className="min-h-11 rounded-lg bg-[#102d59] px-5 py-2.5 font-semibold text-white transition hover:bg-[#183e75] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102d59] disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "กำลังตรวจสอบ…" : "ยืนยันและเปิดใช้"}
              </button>
            </form>
          )}
          {message && <p role={messageType === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm font-medium leading-6 ${messageType === "error" ? "border-rose-300 bg-rose-50 text-rose-950" : "border-emerald-300 bg-emerald-50 text-emerald-950"}`}>{message}</p>}
        </div>
      </section>
    </main>
  );
}
