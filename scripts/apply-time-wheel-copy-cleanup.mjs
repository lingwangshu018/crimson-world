import fs from "node:fs";

const path = new URL("../public/time-wheel/index.html", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const marker = "CRIMSON_TIME_WHEEL_COPY_CLEANUP";

if (source.includes(marker)) {
  console.log("Time Wheel copy cleanup already applied.");
  process.exit(0);
}

function replaceRequired(before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Time Wheel cleanup target not found: ${label}`);
  }
  source = source.replace(before, after);
}

replaceRequired(
  '<div class="form-group"><label>模块说明</label><textarea v-model="form.description" placeholder="功能说明..." style="min-height: 80px;"></textarea></div>',
  '',
  "module description field",
);

replaceRequired(
  '<button @click="copyModule(m.id)">复制</button>',
  '',
  "copy module action",
);

replaceRequired(
  '<button @click="toggleModule(m.id)">{{m.enabled ? \'停用\' : \'启用\'}}</button>',
  '',
  "toggle module action",
);

replaceRequired(
  '<label>本次主题 (可选)</label>',
  '<label>主题（选填）</label>',
  "run topic label",
);

replaceRequired(
  '<label>补充要求 (可选)</label>',
  '<label>详细说明（选填）</label>',
  "run details label",
);

source = source.replace(
  '<head>',
  `<head><!-- ${marker} -->`,
);

fs.writeFileSync(path, source);
console.log("Applied Time Wheel copy cleanup.");
