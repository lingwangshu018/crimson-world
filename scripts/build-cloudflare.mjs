import fs from "node:fs";

const outputDirectory = "dist-pages";

if (!fs.existsSync(outputDirectory)) {
  throw new Error(`找不到构建目录：${outputDirectory}`);
}

console.log("Cloudflare 前端构建完成，统一记录 API 使用当前配置的云端地址。");
