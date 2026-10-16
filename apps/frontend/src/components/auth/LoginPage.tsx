"use client";

import { type SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPeopleRoof,
  faCalendarCheck,
  faFileInvoiceDollar,
  faChartLine
}
from "@fortawesome/free-solid-svg-icons"

function Circle() {
  return (
    <div className="mx-auto flex w-full max-w-[30rem] justify-between gap-8 py-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-300">
          <FontAwesomeIcon icon={faPeopleRoof} className="h-8 w-8 text-2xl" />
        </div>
        <p className="text-sm font-semibold text-[#102d59] w-24">จัดการข้อมูลพนักงาน</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-300">
          <FontAwesomeIcon icon={faCalendarCheck} className="h-8 w-8 text-2xl" />
        </div>
        <p className="text-sm font-semibold text-[#102d59] w-24">เวลาเข้าออกและการลา</p>
        <br></br>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-300">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-8 w-8 text-2xl" />
        </div>
        <p className="text-sm font-semibold text-[#102d59] w-24">เงินเดือนและสวัสดิการ</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-300">
          <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-2xl" />
        </div>
        <p className="text-sm font-semibold text-[#102d59] w-24">ประเมินผลและพัฒนาบุคลากร</p>
      </div>
    </div>
  );
}

function InvCard() {
  return (
    <div className="w-full max-w-2xl border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.38),transparent)] p-8 text-center shadow-lg backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-[30rem] items-center gap-1 text-left">
        <p className="logo-mark text-3xl font-black tracking-[-0.14em] relative"><span className="logo-mark-g absolute right-4">G</span>H</p>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-sm font-bold tracking-wide pl-6">
            GRAMMIC HOUSE CO., LTD.
          </p>
          <p className="text-[10px] pl-6">Human Resource Management System</p>
        </div>
      </div>

      <div className="py-10">
        <div className="mx-auto flex w-full max-w-[30rem] flex-col items-start text-left">
          <h1 className="text-5xl font-bold">ระบบบริหารงานบุคคล</h1>
          <br></br>
          <p className="text-blue-900 font-bold text-3xl">จัดการง่าย ครบทุกเรื่องบุคคลกร</p>
          <br></br>
          <p className="text-gray-500 text-xl">ดูแลพนักงาน สร้างการเติบโต ไปด้วยกัน</p>
          <br></br>
        </div>
        <Circle />
      </div>
    </div>
  );
}
function Logo() {
  return (
    <div className="mx-auto flex w-full max-w-[30rem] items-center gap-1 text-left">
      <p className="logo-mark relative text-3xl font-black tracking-[-0.14em]"><span className="logo-mark-g absolute right-4">G</span>H</p>
      <div className="flex flex-col items-start leading-tight">
        <p className="pl-6 text-sm font-bold tracking-wide">
          GRAMMIC HOUSE CO., LTD.
        </p>
        <p className="pl-6 text-[10px]">Human Resource Management System</p>
      </div>
    </div>
  );
}



export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"contact" | "otp" | "password">("contact");
  const [recoveryContact, setRecoveryContact] = useState("");
  const [authToken, setAuthToken] = useState("");

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        rememberMe,
      });
      if (result.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        return;
      }
      router.push("/employees");
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }

  };

  const submitReset = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const endpoint = resetStep === "contact"
        ? "/api/auth/password/reset/request-otp"
        : resetStep === "otp"
          ? "/api/auth/password/reset/verify-otp"
          : "/api/auth/password/reset/complete";
      const body = resetStep === "contact"
        ? { contact: data.get("contact") }
        : resetStep === "otp"
          ? { contact: recoveryContact, code: data.get("code") }
          : { authToken, newPassword: data.get("newPassword"), confirmPassword: data.get("confirmPassword") };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string; authToken?: string };
      if (!response.ok) throw new Error(result.error ?? "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      if (resetStep === "contact") {
        setRecoveryContact(String(data.get("contact") ?? ""));
        setResetStep("otp");
        setError("");
        setNotice("หากข้อมูลตรงกับพนักงาน HR ที่ใช้งานอยู่ ระบบจะส่งรหัส OTP ไปยังอีเมลที่ลงทะเบียนไว้ หากไม่ได้รับ โปรดลองขอรหัสอีกครั้ง");
      } else if (resetStep === "otp" && result.authToken) {
        setAuthToken(result.authToken);
        setResetStep("password");
        setError("");
      } else if (resetStep === "otp") {
        throw new Error("ไม่สามารถยืนยันรหัส OTP ได้ กรุณาลองอีกครั้ง");
      } else {
        setResetMode(false);
        setResetStep("contact");
        setAuthToken("");
        setNotice("เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      }
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#eef5fb] text-[#102d59] lg:grid lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative hidden h-full min-h-screen w-full overflow-hidden lg:block">
        <Image
          src="/office.png"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 z-10 bg-white/35" />
        <div className="relative z-20 flex h-full min-h-screen w-full items-center justify-center p-10">
          <InvCard />
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center p-5 sm:p-10">
        <form
          onSubmit={resetMode ? submitReset : submit}
          className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-10"
        >
          <div className="mb-9 text-center">
            <div className="mx-auto w-fit">
              <Logo />
            </div>
            <h1 className="mt-6 text-xl font-bold">{resetMode ? "รีเซ็ตรหัสผ่าน" : "ยินดีต้อนรับเข้าสู่ระบบ HR"}</h1>
            <p className="mt-1 text-sm text-slate-400">
              กรุณาเข้าสู่ระบบเพื่อใช้งาน
            </p>
          </div>
          {(!resetMode || resetStep === "contact") && <label className="text-sm font-medium text-slate-600">
            {resetMode ? "อีเมลหรือเบอร์โทรศัพท์" : "อีเมล"}
            <input name={resetMode ? "contact" : "email"} required type={resetMode ? "text" : "email"}
              value={resetMode ? recoveryContact : loginEmail} onChange={(event) => resetMode ? setRecoveryContact(event.target.value) : setLoginEmail(event.target.value)}
              autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]"
              placeholder={resetMode ? "กรอกอีเมลหรือเบอร์โทรศัพท์" : "กรอกอีเมล"} />
          </label>}
          {!resetMode && <label className="mt-5 block text-sm font-medium text-slate-600">รหัสผ่าน
            <input name="password" required type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]" placeholder="กรอกรหัสผ่าน" />
          </label>}
          {resetMode && resetStep === "otp" && <label className="mt-5 block text-sm font-medium text-slate-600">กรอกรหัส OTP หากได้รับทางอีเมล
            <input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]" />
          </label>}
          {notice && <p role="status" className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}
          {resetMode && resetStep === "otp" && <button type="button" onClick={() => { setResetStep("contact"); setNotice(""); }} className="mt-3 text-sm text-[#2867b4] underline">เปลี่ยนอีเมลหรือเบอร์โทร / ขอรหัสใหม่</button>}
          {resetMode && resetStep === "password" && <>
            <label className="mt-5 block text-sm font-medium text-slate-600">รหัสผ่านใหม่<input name="newPassword" required minLength={12} type="password" autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]" /></label>
            <label className="mt-5 block text-sm font-medium text-slate-600">ยืนยันรหัสผ่านใหม่<input name="confirmPassword" required minLength={12} type="password" autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]" /></label>
          </>}
          <div className="mt-5 flex justify-between text-sm">
            {!resetMode && <label className="flex gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              จดจำฉันไว้
            </label>}
            <button
              type="button"
              onClick={() => { setResetMode((current) => !current); setResetStep("contact"); setAuthToken(""); setError(""); setNotice(""); }}
              className="text-[#2867b4] underline"
            >
              {resetMode ? "กลับไปเข้าสู่ระบบ" : "ลืมรหัสผ่าน?"}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-7 min-h-12 w-full rounded-lg bg-[#2867b4] font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "กำลังดำเนินการ…" : resetMode ? resetStep === "contact" ? "ส่งรหัส OTP" : resetStep === "otp" ? "ยืนยัน OTP" : "บันทึกรหัสผ่านใหม่" : "เข้าสู่ระบบ  →"}
          </button>
        </form>
      </section>
    </main>
  );
}

