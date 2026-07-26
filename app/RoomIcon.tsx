import type { RoomId } from "./room-registry";

type RoomIconProps = {
  roomId: RoomId;
  size?: number;
  variant?: "map" | "sidebar";
};

const roomIconMap: Record<RoomId, string> = {
  tavern: "🍷",
  cafe: "☕",
  journal: "📖",
  wheel: "⏳",
  study: "📚",
};

export function RoomIcon({ roomId, size, variant = "map" }: RoomIconProps) {
  const icon = roomIconMap[roomId] ?? "✦";
  const iconSize = size ?? (variant === "sidebar" ? 36 : 64);
  const fontScale = variant === "sidebar" ? 0.55 : 0.55;

  return (
    <span
      aria-hidden="true"
      className={`world-map-room-icon icon-${variant}`}
      style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: `${iconSize * fontScale}px`,
        lineHeight: 1,
        transform: "none",
      }}
    >
      {icon}
    </span>
  );
}
