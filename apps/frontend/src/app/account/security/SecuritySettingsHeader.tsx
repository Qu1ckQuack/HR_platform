import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faXmark } from "@fortawesome/free-solid-svg-icons";

export function SecuritySettingsHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#102d59] px-5 py-5 text-white sm:px-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">ความปลอดภัยบัญชี</h1>
          <p className="mt-1 text-sm text-blue-100">
            ตั้งค่า Authenticator สำหรับการรีเซ็ตรหัสผ่าน
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิดและกลับหน้าพนักงาน"
        title="กลับหน้าพนักงาน"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <FontAwesomeIcon icon={faXmark} className="h-5 w-5" aria-hidden="true" />
      </button>
    </header>
  );
}
