import type { RoomId } from "./room-registry";

type RoomIconProps = {
  roomId: RoomId;
};

const roomIconMap: Partial<Record<RoomId, string>> = {
  tavern: "/assets/map-icons/crimson-tavern.png",
  cafe: "/assets/map-icons/crimson-cafe.png",
  journal: "/assets/map-icons/journal-room.png",
  wheel: "/assets/map-icons/wheel-of-time.png",
  study: "/assets/map-icons/study-rooms.png",
};

export function RoomIcon({ roomId }: RoomIconProps) {
  const src = roomIconMap[roomId] ?? "/assets/map-icons/unknown.png";

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="world-map-room-icon"
      style={{
        width: "88px",
        height: "88px",
        objectFit: "contain",
      }}
    />
  );
}
