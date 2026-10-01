"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

import { useEmployeeNotifications } from "@/hooks/useEmployeeNotifications";
import { EmployeeNotificationItem } from "@/components/employees/EmployeeNotificationItem";

type Props = { onEmployeesChanged: () => void };

export function EmployeeNotifications({ onEmployeesChanged }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    error,
    enableSound,
    refreshNotifications,
  } = useEmployeeNotifications();

  async function refreshAfterAction() {
    refreshNotifications();
    onEmployeesChanged();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          enableSound();
          setIsOpen((open) => !open);
        }}
        className="relative min-h-10 min-w-10 rounded hover:bg-slate-100"
        aria-label={`การแจ้งเตือน ${notifications.length} รายการ`}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-slate-900/10"
            onClick={() => setIsOpen(false)}
          />
          <section className="fixed right-3 top-16 z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
            <header className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">การแจ้งเตือน HR</h2>
            </header>
            {error ? (
              <p role="alert" className="p-4 text-sm text-red-600">{error}</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">ไม่มีการแจ้งเตือน</p>
            ) : (
              <ul className="max-h-[min(70vh,32rem)] overflow-y-auto">
                {notifications.map((notification) => (
                  <EmployeeNotificationItem
                    key={notification.id}
                    notification={notification}
                    onActionComplete={refreshAfterAction}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
