import type { RoomId } from "./room-registry";

type RoomIconProps = {
  roomId: RoomId;
  size?: number;
  variant?: "map" | "sidebar";
};

const common = {
  viewBox: "0 0 48 48",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function RoomIcon({ roomId, size, variant = "map" }: RoomIconProps) {
  const iconSize = size ?? (variant === "sidebar" ? 24 : 38);
  const props = { ...common, width: iconSize, height: iconSize };

  if (roomId === "tavern") return <svg {...props}><path d="M12 16h21v11a9 9 0 0 1-9 9h-3a9 9 0 0 1-9-9V16Z"/><path d="M33 19h3a5 5 0 0 1 0 10h-3"/><path d="M16 12c1.8-2 4.2-2 6 0s4.2 2 6 0"/></svg>;
  if (roomId === "cafe") return <svg {...props}><path d="M11 18h22v10a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8V18Z"/><path d="M33 21h3a4 4 0 0 1 0 8h-3"/><path d="M17 13c-2-2 2-3 0-6M24 13c-2-2 2-3 0-6M31 13c-2-2 2-3 0-6"/></svg>;
  if (roomId === "journal") return <svg {...props}><path d="M9 12h12a7 7 0 0 1 7 7v18H16a7 7 0 0 0-7 3V12Z"/><path d="M39 12H27a7 7 0 0 0-7 7v18h12a7 7 0 0 1 7 3V12Z"/></svg>;
  if (roomId === "wheel") return <svg {...props}><circle cx="24" cy="24" r="16"/><path d="M24 12v4M24 32v4M12 24h4M32 24h4"/></svg>;
  return <svg {...props}><path d="M10 15h28v21H10z"/><path d="M15 15v-3h18v3M15 22h18M20 22v14M28 22v14"/></svg>;
}
