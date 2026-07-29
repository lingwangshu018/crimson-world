"use client";

import { useEffect } from "react";
import "./time-wheel-room.css";

type TimeWheelRoomProps = { onClose: () => void };
const THEME_ID = "crimson-world-time-wheel-theme";

export function TimeWheelRoom({ onClose }: TimeWheelRoomProps) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "crimson:close-time-wheel") onClose();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onClose]);

  const base = import.meta.env.BASE_URL || "/";
  const src = `${base}time-wheel/index.html`;
  const backgroundUrl = `${base}assets/time-wheel-bg.webp`;

  function applyTheme(frame: HTMLIFrameElement) {
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;
      doc.getElementById(THEME_ID)?.remove();
      const style = doc.createElement("style");
      style.id = THEME_ID;
      style.textContent = `
        :root {
          color-scheme: dark !important;
          --tw-ink: #f8f1e8;
          --tw-muted: rgba(237, 226, 216, .66);
          --tw-paper: rgba(28, 17, 24, .82);
          --tw-paper-strong: rgba(37, 23, 31, .94);
          --tw-blue: #9fb8d8;
          --tw-blue-soft: rgba(159, 184, 216, .14);
          --tw-gold: #d8bd82;
          --tw-gold-soft: rgba(216, 189, 130, .18);
          --tw-line: rgba(216, 189, 130, .25);
          --tw-danger: #e7a1aa;
        }
        * { box-sizing: border-box !important; }
        html, body { min-height: 100% !important; background-color: #090609 !important; color: var(--tw-ink) !important; }
        body {
          position: relative !important;
          overflow-x: hidden !important;
          background-image:
            linear-gradient(180deg, rgba(8, 5, 8, .36), rgba(8, 5, 8, .72)),
            url("${backgroundUrl}") !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-attachment: fixed !important;
          font-family: "PingFang SC", "Microsoft YaHei", sans-serif !important;
        }
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 6%, rgba(159, 184, 216, .13), transparent 32%),
            linear-gradient(90deg, rgba(0,0,0,.16), transparent 22%, transparent 78%, rgba(0,0,0,.16));
        }
        main, #root, #app, .app, .page, .container { background: transparent !important; }
        .page { max-width: 760px !important; margin: 0 auto !important; padding-bottom: 52px !important; }

        .header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          min-height: 88px !important;
          padding: 18px 74px !important;
          justify-content: center !important;
          color: var(--tw-ink) !important;
          background: linear-gradient(180deg, rgba(18, 11, 16, .98), rgba(18, 11, 16, .86)) !important;
          border-bottom: 1px solid var(--tw-line) !important;
          box-shadow: 0 12px 36px rgba(0,0,0,.24) !important;
          backdrop-filter: blur(18px) !important;
        }
        .header > div:first-child {
          color: var(--tw-ink) !important;
          font-family: Georgia, "Songti SC", "STSong", serif !important;
          font-size: 19px !important;
          font-weight: 600 !important;
          letter-spacing: .18em !important;
          text-align: center !important;
        }
        .header > div:first-child::after {
          content: "CRIMSON TIME ARCHIVE";
          display: block;
          margin-top: 7px;
          color: var(--tw-gold) !important;
          font-family: Georgia, serif !important;
          font-size: 9px !important;
          font-weight: 500 !important;
          letter-spacing: .3em !important;
          opacity: .74;
        }
        .header .add-btn {
          position: absolute !important;
          right: 20px !important;
          top: 50% !important;
          display: grid !important;
          width: 42px !important;
          height: 42px !important;
          margin: 0 !important;
          padding: 0 !important;
          place-items: center !important;
          transform: translateY(-50%) !important;
          border: 1px solid rgba(216,189,130,.42) !important;
          border-radius: 50% !important;
          color: var(--tw-gold) !important;
          background: rgba(216,189,130,.08) !important;
          font-size: 23px !important;
        }
        .header .add-btn:active { transform: translateY(-50%) scale(.96) !important; }

        .content { position: relative !important; padding: 26px 18px !important; }
        body:has(.module-card) .content::before {
          content: "我的时间模块";
          display: block;
          margin: 0 2px 14px;
          color: var(--tw-gold);
          font-family: Georgia, "Songti SC", serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .16em;
        }
        .card, .modal-content {
          color: var(--tw-ink) !important;
          border: 1px solid var(--tw-line) !important;
          background:
            linear-gradient(145deg, rgba(255,255,255,.035), transparent 42%),
            var(--tw-paper) !important;
          box-shadow: 0 18px 50px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.04) !important;
          backdrop-filter: blur(14px) !important;
        }
        .card { border-radius: 24px !important; }

        .module-card {
          position: relative !important;
          overflow: hidden !important;
          padding: 22px !important;
          margin-bottom: 18px !important;
        }
        .module-card::after {
          content: "";
          position: absolute;
          right: -28px;
          bottom: -42px;
          width: 132px;
          height: 132px;
          border: 1px solid rgba(159,184,216,.12);
          border-radius: 50%;
          box-shadow: inset 0 0 0 18px rgba(159,184,216,.025), inset 0 0 0 19px rgba(216,189,130,.07);
          pointer-events: none;
        }
        .module-card .module-header { align-items: flex-start !important; margin-bottom: 16px !important; }
        .module-card .icon {
          width: 50px !important;
          height: 50px !important;
          margin-right: 14px !important;
          border: 1px solid rgba(159,184,216,.36) !important;
          border-radius: 16px !important;
          color: var(--tw-blue) !important;
          background: var(--tw-blue-soft) !important;
          font-family: Georgia, serif !important;
          font-size: 13px !important;
          box-shadow: inset 0 0 18px rgba(159,184,216,.06) !important;
        }
        .module-card .title { color: var(--tw-ink) !important; font-size: 18px !important; letter-spacing: .04em !important; }
        .module-card .date { margin-top: 5px !important; color: var(--tw-muted) !important; font-size: 11px !important; }
        .module-card .status {
          padding: 5px 10px !important;
          border: 1px solid rgba(159,184,216,.28) !important;
          border-radius: 999px !important;
          color: var(--tw-blue) !important;
          background: var(--tw-blue-soft) !important;
          font-size: 10px !important;
        }
        .module-card .status.disabled { border-color: rgba(255,255,255,.12) !important; color: var(--tw-muted) !important; background: rgba(255,255,255,.045) !important; }
        .module-card .desc {
          position: relative !important;
          z-index: 1 !important;
          min-height: 22px !important;
          margin: 0 0 20px !important;
          color: var(--tw-muted) !important;
          font-family: Georgia, "Songti SC", serif !important;
          font-size: 14px !important;
          line-height: 1.75 !important;
        }
        .module-card .actions {
          position: relative !important;
          z-index: 1 !important;
          display: grid !important;
          grid-template-columns: minmax(132px, 1.6fr) repeat(5, minmax(52px, .75fr)) !important;
          gap: 7px !important;
          padding-top: 16px !important;
          border-top: 1px solid rgba(216,189,130,.15) !important;
        }
        .module-card .actions button {
          min-width: 0 !important;
          padding: 10px 7px !important;
          border: 1px solid rgba(255,255,255,.08) !important;
          border-radius: 11px !important;
          color: rgba(248,241,232,.72) !important;
          background: rgba(255,255,255,.035) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
        .module-card .actions button.run-btn {
          border-color: rgba(159,184,216,.38) !important;
          color: #eef5ff !important;
          background: linear-gradient(135deg, rgba(92,119,154,.86), rgba(68,91,123,.9)) !important;
          box-shadow: 0 8px 22px rgba(38,57,82,.3) !important;
        }
        .module-card .actions button.danger { border-color: transparent !important; color: var(--tw-danger) !important; background: transparent !important; }

        .section-title {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin: 34px 2px 14px !important;
          color: var(--tw-gold) !important;
          font-family: Georgia, "Songti SC", serif !important;
          font-size: 13px !important;
          letter-spacing: .16em !important;
        }
        .section-title::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, var(--tw-line), transparent); }
        .history-card {
          min-height: 76px !important;
          padding: 16px 18px !important;
          border-radius: 18px !important;
        }
        .history-card .icon {
          width: 42px !important;
          height: 42px !important;
          margin-right: 13px !important;
          border: 1px solid rgba(216,189,130,.28) !important;
          border-radius: 50% !important;
          color: var(--tw-gold) !important;
          background: var(--tw-gold-soft) !important;
          font-size: 16px !important;
        }
        .history-card .title { color: var(--tw-ink) !important; font-size: 14px !important; }
        .history-card .topic, .history-card .date { color: var(--tw-muted) !important; }
        .history-card .delete { color: var(--tw-danger) !important; opacity: .7 !important; }

        .form-group { margin-bottom: 22px !important; }
        .form-group label, .form-row label { color: var(--tw-gold) !important; font-family: Georgia, "Songti SC", serif !important; letter-spacing: .08em !important; }
        .form-group input, .form-group textarea, button, input, select, textarea {
          color: var(--tw-ink) !important;
          border-color: rgba(216,189,130,.22) !important;
          background-color: rgba(15,10,14,.58) !important;
        }
        .form-group input, .form-group textarea {
          border-radius: 15px !important;
          padding: 15px !important;
          line-height: 1.65 !important;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: rgba(159,184,216,.72) !important; box-shadow: 0 0 0 3px rgba(159,184,216,.09) !important; }
        .form-row { border-top-color: var(--tw-line) !important; }
        .form-row input[type="checkbox"] { accent-color: #7897bc !important; }
        .btn-primary, .btn-secondary { border-radius: 14px !important; }
        .btn-primary {
          border: 1px solid rgba(159,184,216,.45) !important;
          color: #f8fbff !important;
          background: linear-gradient(135deg, #718eb2, #536f94) !important;
          box-shadow: 0 12px 28px rgba(38,57,82,.32) !important;
        }
        .btn-secondary { border: 1px solid var(--tw-line) !important; color: var(--tw-gold) !important; background: rgba(216,189,130,.07) !important; }
        .modal-overlay { background: rgba(5,3,5,.76) !important; backdrop-filter: blur(8px) !important; }
        .modal-content { max-width: 440px !important; border-radius: 24px !important; padding: 26px !important; }
        .preview-page { background: rgba(10,7,10,.7) !important; }
        .preview-content { color: var(--tw-ink) !important; background: rgba(255,255,255,.96) !important; }
        .empty-state {
          margin-top: 70px !important;
          padding: 42px 24px !important;
          border: 1px dashed rgba(216,189,130,.3) !important;
          border-radius: 24px !important;
          color: var(--tw-muted) !important;
          background: rgba(28,17,24,.52) !important;
          line-height: 1.8 !important;
        }

        @media (max-width: 700px) {
          body { background-position: 60% center !important; }
          .page { max-width: none !important; }
          .content { padding: 20px 13px 34px !important; }
          .module-card { padding: 18px !important; border-radius: 21px !important; }
          .module-card .actions { grid-template-columns: repeat(3, 1fr) !important; }
          .module-card .actions button.run-btn { grid-column: span 2 !important; }
        }
        @media (max-width: 430px) {
          .header { min-height: 80px !important; padding-right: 62px !important; padding-left: 62px !important; }
          .header > div:first-child { font-size: 17px !important; letter-spacing: .12em !important; }
          .header > div:first-child::after { font-size: 8px !important; letter-spacing: .18em !important; }
          .header .add-btn { right: 13px !important; width: 38px !important; height: 38px !important; }
          .module-card .actions { grid-template-columns: repeat(2, 1fr) !important; }
          .module-card .actions button.run-btn { grid-column: span 2 !important; }
        }
      `;
      doc.head.appendChild(style);
    } catch {
      // Keep the embedded module usable even when styling cannot be injected.
    }
  }

  return (
    <section className="time-wheel-room" aria-label="时光之轮">
      <iframe
        className="time-wheel-frame"
        src={src}
        title="时光之轮"
        allow="clipboard-write"
        onLoad={(event) => applyTheme(event.currentTarget)}
      />
    </section>
  );
}
