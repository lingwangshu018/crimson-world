import type { RoomId } from "./room-registry";

type RoomIconProps = {
  roomId: RoomId;
  size?: number;
  variant?: "map" | "sidebar";
};

const roomIconMap: Partial<Record<RoomId, string>> = {
  tavern: "/assets/map-icons/crimson-tavern.png",
  cafe: "/assets/map-icons/crimson-cafe.png",
  journal: "/assets/map-icons/journal-room.png",
  wheel: "/assets/map-icons/wheel-of-time.png",
  study: "/assets/map-icons/study-rooms.png",
};

export function RoomIcon({ roomId, size, variant = "map" }: RoomIconProps) {
  const src = roomIconMap[roomId] ?? "/assets/map-icons/unknown.png";
  const iconSize = size ?? (variant === "sidebar" ? 48 : 88);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`world-map-room-icon icon-${variant}`}
      style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        objectFit: "contain",
      }}
    />
  );
}
