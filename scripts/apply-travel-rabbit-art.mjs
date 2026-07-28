import fs from "node:fs";

const componentPath = new URL("../app/TravelRabbitRoom.tsx", import.meta.url);
const stylePath = new URL("../app/travel-rabbit.css", import.meta.url);

let component = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

const imageMarkup = `        <div className="travel-rabbit-avatar">
          <img
            src={\`${"${import.meta.env.BASE_URL}"}images/travel-benny.png\`}
            alt="正在旅行的小兔"
          />
        </div>`;

const legacyMarkups = [
  '        <div className="travel-rabbit-avatar">🐰</div>',
  `        <div className="travel-rabbit-avatar">
          <img
            src={\`${"${import.meta.env.BASE_URL}"}images/travel-bunny.png\`}
            alt="旅行小兔"
          />
        </div>`,
];

if (!component.includes('images/travel-benny.png')) {
  const target = legacyMarkups.find((markup) => component.includes(markup));
  if (!target) throw new Error("Travel Rabbit avatar target was not found.");
  component = component.replace(target, imageMarkup);
}

const oldAvatarStyles = `.travel-rabbit-avatar {
  text-align: center;
  font-size: 64px;
  margin: 18px;
}`;

const compactAvatarStyles = `.travel-rabbit-avatar {
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

const heroArtworkStyles = `.travel-rabbit-avatar {
  width: min(100%, 680px);
  margin: 22px auto 24px;
  overflow: hidden;
  border: 1px solid rgba(215, 180, 106, .48);
  border-radius: 22px;
  background: rgba(18, 10, 8, .72);
  box-shadow: 0 16px 38px rgba(0, 0, 0, .32);
}

.travel-rabbit-avatar img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

@media (max-width: 640px) {
  .travel-rabbit-avatar {
    margin: 18px auto 22px;
    border-radius: 17px;
  }
}`;

if (styles.includes(compactAvatarStyles)) {
  styles = styles.replace(compactAvatarStyles, heroArtworkStyles);
} else if (styles.includes(oldAvatarStyles)) {
  styles = styles.replace(oldAvatarStyles, heroArtworkStyles);
} else if (!styles.includes("aspect-ratio: 16 / 10")) {
  styles += `\n\n${heroArtworkStyles}\n`;
}

fs.writeFileSync(componentPath, component);
fs.writeFileSync(stylePath, styles);
console.log("Replaced the Travel Rabbit emoji with the travel-benny hero artwork.");
