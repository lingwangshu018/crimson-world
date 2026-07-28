import fs from "node:fs";

const roomPath = "app/TravelRabbitRoom.tsx";
const cssPath = "app/travel-rabbit.css";

let room = fs.readFileSync(roomPath, "utf8");
const oldAvatar = '<div className="travel-rabbit-avatar">🐰</div>';
const newAvatar = `<div className="travel-rabbit-avatar">
          <img
            src={\`${"${import.meta.env.BASE_URL}"}images/travel-benny.png\`}
            alt="正在旅行的小兔"
            className="travel-rabbit-avatar-image"
          />
        </div>`;

if (room.includes(oldAvatar)) {
  room = room.replace(oldAvatar, newAvatar);
} else if (!room.includes("travel-rabbit-avatar-image")) {
  throw new Error("Travel rabbit avatar anchor not found.");
}

fs.writeFileSync(roomPath, room);

let css = fs.readFileSync(cssPath, "utf8");
const marker = "/* travel-benny-art */";
if (!css.includes(marker)) {
  css += `\n\n${marker}\n.travel-rabbit-avatar {\n  width: min(100%, 680px);\n  margin: 22px auto;\n  overflow: hidden;\n  border: 1px solid rgba(215, 180, 106, .48);\n  border-radius: 22px;\n  background: rgba(18, 10, 8, .72);\n  box-shadow: 0 16px 38px rgba(0, 0, 0, .32);\n}\n\n.travel-rabbit-avatar-image {\n  display: block;\n  width: 100%;\n  height: auto;\n  aspect-ratio: 16 / 10;\n  object-fit: cover;\n}\n\n@media (max-width: 640px) {\n  .travel-rabbit-avatar {\n    margin: 18px auto;\n    border-radius: 17px;\n  }\n}\n`;
  fs.writeFileSync(cssPath, css);
}

console.log("✓ Travel Benny artwork applied");
