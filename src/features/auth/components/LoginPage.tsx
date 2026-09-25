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
        <p className="logo-mark text-3xl font-black tracking-[-0.14em]"><span className="logo-mark-g">G</span>H</p>
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
    <div className="w">
      <p className="logo-mark text-3xl font-black tracking-[-0.14em]"><span className="logo-mark-g">G</span>H</p>
      <p className="text-sm font-bold tracking-wide">GRAMMIC HOUSE CO., LTD.</p>
      <p className="text-[10px]">Human Resource Management System</p>
    </div>
  );
}



export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe,
    });

    setIsLoading(false);

    if (result.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return;
    }

    router.push("/employees");
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
          onSubmit={submit}
          className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-10"
        >
          <div className="mb-9 text-center">
            <div className="mx-auto w-fit">
              <Logo />
            </div>
            <h1 className="mt-6 text-xl font-bold">
              ยินดีต้อนรับเข้าสู่ระบบ HR
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              กรุณาเข้าสู่ระบบเพื่อใช้งาน
            </p>
          </div>
          <label className="text-sm font-medium text-slate-600">
            อีเมล
            <input
              name="email"
              required
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]"
              placeholder="กรอกอีเมล"
            />
          </label>
          <label className="mt-5 block text-sm font-medium text-slate-600">
            รหัสผ่าน
            <input
              name="password"
              required
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#2867b4]"
              placeholder="กรอกรหัสผ่าน"
            />
          </label>
          <div className="mt-5 flex justify-between text-sm">
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              จดจำฉันไว้
            </label>
            <button
              type="button"
              disabled
              className="cursor-not-allowed text-slate-400"
            >
              ลืมรหัสผ่าน? (ยังไม่เปิดใช้)
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
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ  →"}
          </button>
        </form>
      </section>
    </main>
  );
}
