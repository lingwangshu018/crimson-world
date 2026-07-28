import fs from "node:fs";

const componentPath = "github-pages/library.tsx";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_LIBRARY_TRAVELER_PUBLIC")) {
  console.log("Royal Library traveler-facing labels already applied.");
  process.exit(0);
}

source = source.replace(
  /\n\s*\{ id: "scriptorium", name: "编纂室", en: "SCRIPTORIUM", icon: "✎", description: "只有编纂者能够进入的世界书工作区。" \},/,
  "",
);

source = source.replace(
  'aria-label="兔兔馆长正在欢迎编纂者"',
  'aria-label="兔兔馆长正在欢迎旅行者"',
);
source = source.replace(
  'useState("编纂者，今天也要一起记录绯界的美好历史吗？")',
  'useState("旅行者，今天也要一起阅读绯界的故事吗？")',
);
source = source.replace(
  '"欢迎回来，编纂者。这样的世界正在慢慢长大。"',
  '"欢迎回来，旅行者。这样的世界正在慢慢长大。"',
);
source = source.replace(
  '<p>欢迎回来，编纂者小宝。 <span>✦</span></p>',
  '<p>欢迎回来，旅行者。 <span>✦</span></p>',
);
source = source.replace(
  '`《${book.title}》还是空白书册，正等着编纂者落笔呢。`',
  '`《${book.title}》还是空白书册，等待新的馆藏被收入书架。`',
);
source = source.replace(
  '这一排书架暂时还是空的。兔兔已经贴好了分类标签，等待编纂者带来第一本书。',
  '这一排书架暂时还是空的。兔兔已经贴好了分类标签，等待新的馆藏到来。',
);
source = source.replace(
  '<div>\n            <a href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">馆藏源文件</a>\n            <a href="https://github.com/lingwangshu018/crimson-world" target="_blank" rel="noreferrer">编纂仓库</a>\n          </div>',
  '',
);

source = source.replace(
  'function Library() {',
  '// CRIMSON_LIBRARY_TRAVELER_PUBLIC\nfunction Library() {',
);

fs.writeFileSync(componentPath, source);
console.log("Changed Royal Library public identity to traveler and removed the scriptorium.");
