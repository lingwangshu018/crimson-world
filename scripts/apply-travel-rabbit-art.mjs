import fs from "node:fs";

const componentPath = new URL("../app/TravelRabbitRoom.tsx", import.meta.url);
const stylePath = new URL("../app/travel-rabbit.css", import.meta.url);

let component = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

const imageMarkup = `        <div className="travel-rabbit-avatar">
          <img
            src={\`${"${import.meta.env.BASE_URL}"}images/travel-bunny.png\`}
            alt="旅行小兔"
          />
        </div>`;

if (!component.includes('src={`${import.meta.env.BASE_URL}images/travel-bunny.png`}')) {
  const emojiMarkup = '        <div className="travel-rabbit-avatar">🐰</div>';
  if (!component.includes(emojiMarkup)) {
    throw new Error("Travel Rabbit avatar target was not found.");
  }
  component = component.replace(emojiMarkup, imageMarkup);
}

const oldAvatarStyles = `.travel-rabbit-avatar {
  text-align: center;
  font-size: 64px;
  margin: 18px;
}`;

const newAvatarStyles = `.travel-rabbit-avatar {
  display: flex;
  justify-content: center;
  margin: 18px auto 20px;
}

.travel-rabbit-avatar img {
  display: block;
  width: min(230px, 70vw);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 14px 26px rgba(0, 0, 0, .3));
}`;

if (!styles.includes(".travel-rabbit-avatar img")) {
  if (!styles.includes(oldAvatarStyles)) {
    throw new Error("Travel Rabbit avatar styles target was not found.");
  }
  styles = styles.replace(oldAvatarStyles, newAvatarStyles);
}

fs.writeFileSync(componentPath, component);
fs.writeFileSync(stylePath, styles);
console.log("Replaced the Travel Rabbit emoji with the illustrated traveler.");
