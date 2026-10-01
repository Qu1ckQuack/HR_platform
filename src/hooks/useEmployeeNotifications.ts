"use client";

import { useEffect, useRef, useState } from "react";

import { playHrNotificationTone } from "@/lib/notification-tone";
import type { NotificationData } from "@/types/notification-type";

type NotificationResponse = { notifications: NotificationData[]; error?: string };

export function useEmployeeNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const soundEnabled = useRef(false);
  const seenIds = useRef(new Set<string>());
  const heardIds = useRef(new Set<string>());

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/employees/notifications");
        const body = (await response.json()) as NotificationResponse;
        if (!response.ok || !Array.isArray(body.notifications)) {
          throw new Error(body.error ?? "ไม่สามารถโหลดการแจ้งเตือนได้");
        }

        const currentIds = new Set(body.notifications.map((notification) => notification.id));
        const newIds = Array.from(currentIds).filter((id) => !seenIds.current.has(id));
        if (newIds.length > 0 && soundEnabled.current) {
          playHrNotificationTone();
          newIds.forEach((id) => heardIds.current.add(id));
        }
        seenIds.current = currentIds;
        heardIds.current = new Set(
          Array.from(heardIds.current).filter((id) => currentIds.has(id)),
        );
        if (active) {
          setNotifications(body.notifications);
          setError("");
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "ไม่สามารถโหลดการแจ้งเตือนได้");
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [refreshVersion]);

  function enableSound() {
    soundEnabled.current = true;
    const unheard = notifications.some((notification) => !heardIds.current.has(notification.id));
    if (unheard) {
      playHrNotificationTone();
      notifications.forEach((notification) => heardIds.current.add(notification.id));
    }
  }

  return {
    notifications,
    error,
    enableSound,
    refreshNotifications: () => setRefreshVersion((version) => version + 1),
  };
}
