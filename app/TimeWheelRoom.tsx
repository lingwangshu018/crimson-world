"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

export function TimeWheelRoom({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onClose]);

  const base = import.meta.env.BASE_URL || "/";
  return (
    <section className="time-wheel-room" aria-label="时光之轮">
      <iframe className="time-wheel-frame" src={`${base}time-wheel/index.html`} title="时光之轮" allow="clipboard-write" />
    </section>
  );
}
