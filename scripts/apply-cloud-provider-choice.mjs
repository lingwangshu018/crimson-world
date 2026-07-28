import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const cssPath = new URL("../app/cloud-cellar.css", import.meta.url);
let cloud = fs.readFileSync(cloudPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "CRIMSON_CLOUD_PROVIDER_CHOICE";
const defaultUrl = "https://crimson-world.lingwangshu018.workers.dev/api/vault";

if (!cloud.includes(marker)) {
  const initBefore = "    setApiUrl(read(API_URL_KEY) || DEFAULT_API_URL);";
  const initAfter = `    const savedCloudUrl = read(API_URL_KEY) || DEFAULT_API_URL || "${defaultUrl}";
    const normalizedCloudUrl = savedCloudUrl.endsWith("/api/records")
      ? savedCloudUrl.slice(0, -"/api/records".length) + "/api/vault"
      : savedCloudUrl;
    if (normalizedCloudUrl !== savedCloudUrl) write(API_URL_KEY, normalizedCloudUrl);
    setApiUrl(normalizedCloudUrl);`;
  if (!cloud.includes(initBefore)) throw new Error("Cloud provider initialization target not found");
  cloud = cloud.replace(initBefore, initAfter);

  const fieldBefore = '<label className="cloud-service-field">云端服务地址<input value={apiUrl} placeholder="https://你的云端地址/api/vault" onChange={(event) => setApiUrl(event.target.value)} onBlur={() => write(API_URL_KEY, apiUrl.trim())} /></label>';
  const fieldAfter = `<section className="cloud-provider-choice">\n                  {/* CRIMSON_CLOUD_PROVIDER_CHOICE */}\n                  <span className="cloud-provider-title">云端服务</span>\n                  <button\n                    className={apiUrl === "${defaultUrl}" ? "cloud-provider-default is-selected" : "cloud-provider-default"}\n                    type="button"\n                    onClick={() => { setApiUrl("${defaultUrl}"); write(API_URL_KEY, "${defaultUrl}"); }}\n                  >\n                    <strong>✨ 使用绯界默认云端</strong>\n                    <small>无需填写地址，直接同步全部档案</small>\n                  </button>\n                  <label className={apiUrl && apiUrl !== "${defaultUrl}" ? "cloud-service-field is-selected" : "cloud-service-field"}>\n                    <span>自选云端</span>\n                    <input\n                      value={apiUrl === "${defaultUrl}" ? "" : apiUrl}\n                      placeholder="Cloudflare Worker 或 Supabase 接口地址"\n                      onChange={(event) => setApiUrl(event.target.value)}\n                      onBlur={() => write(API_URL_KEY, apiUrl.trim())}\n                    />\n                    <small>可连接你自己的 Cloudflare 或 Supabase 云端。</small>\n                  </label>\n                </section>`;
  if (!cloud.includes(fieldBefore)) throw new Error("Cloud provider field target not found");
  cloud = cloud.replace(fieldBefore, fieldAfter);
  fs.writeFileSync(cloudPath, cloud);
}

if (!css.includes(marker)) {
  css += `\n/* ${marker} */\n.cloud-provider-choice{display:grid;gap:10px}.cloud-provider-title{font-size:12px;color:rgba(255,244,231,.72)}.cloud-provider-default{display:grid;gap:4px;width:100%;padding:13px 14px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:rgba(255,255,255,.055);color:#fff4e7;cursor:pointer}.cloud-provider-default strong{font-size:13px}.cloud-provider-default small,.cloud-service-field small{font-size:10px;line-height:1.5;color:rgba(255,244,231,.54)}.cloud-provider-default.is-selected,.cloud-service-field.is-selected{border-color:rgba(241,191,126,.58);background:rgba(196,124,70,.14);box-shadow:0 0 0 1px rgba(241,191,126,.12) inset}.cloud-service-field{padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.035)}.cloud-service-field>span{font-weight:700;color:#fff4e7}.cloud-service-field input{margin-top:2px}\n`;
  fs.writeFileSync(cssPath, css);
}

console.log("Applied default and custom cloud provider choice.");