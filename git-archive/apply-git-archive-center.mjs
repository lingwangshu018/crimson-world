import fs from "node:fs";

const cloudPath = new URL("../app/CloudCellar.tsx", import.meta.url);
const cssPath = new URL("../app/cloud-cellar.css", import.meta.url);
let cloud = fs.readFileSync(cloudPath, "utf8").replace(/\r\n/g, "\n");
let css = fs.readFileSync(cssPath, "utf8").replace(/\r\n/g, "\n");

const marker = "CRIMSON_GIT_ARCHIVE_CENTER_V1";
if (!cloud.includes(marker)) {
  const stateAnchor = '  const [position, setPosition] = useState<OrbPosition | null>(null);';
  if (!cloud.includes(stateAnchor)) throw new Error("Git archive state anchor not found");
  cloud = cloud.replace(stateAnchor, `${stateAnchor}
  // ${marker}
  const [gitProvider, setGitProvider] = useState("gitee");
  const [gitRepository, setGitRepository] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitDirectory, setGitDirectory] = useState("crimson-world-vault");
  const [gitToken, setGitToken] = useState("");
  const gitImportRef = useRef<HTMLInputElement>(null);`);

  const initAnchor = '    setGuestName(read(GUEST_NAME_KEY) || "客人");';
  if (!cloud.includes(initAnchor)) throw new Error("Git archive init anchor not found");
  cloud = cloud.replace(initAnchor, `${initAnchor}
    try {
      const savedGit = JSON.parse(read("crimson.git-archive.config.v1") || "{}");
      setGitProvider(String(savedGit.provider || "gitee"));
      setGitRepository(String(savedGit.repository || ""));
      setGitBranch(String(savedGit.branch || "main"));
      setGitDirectory(String(savedGit.directory || "crimson-world-vault"));
      setGitToken(read("crimson.git-archive.token.v1"));
    } catch {}`);

  const functionAnchor = '  async function copyKey() {';
  if (!cloud.includes(functionAnchor)) throw new Error("Git archive function anchor not found");
  const helpers = `  function saveGitArchiveConfig() {
    const config = {
      schema: "crimson-git-archive-config",
      schemaVersion: 1,
      provider: gitProvider,
      repository: gitRepository.trim(),
      branch: gitBranch.trim() || "main",
      directory: gitDirectory.trim() || "crimson-world-vault",
      updatedAt: new Date().toISOString(),
    };
    write("crimson.git-archive.config.v1", JSON.stringify(config));
    if (gitToken) write("crimson.git-archive.token.v1", gitToken);
    setMessage("Git 仓库存档配置已保存在当前浏览器。访问令牌不会写入导出文件。");
  }

  function collectGitArchive() {
    const excluded = new Set([OWNER_KEY, READ_KEY, NOTE_KEY, "crimson.git-archive.token.v1"]);
    const storage: Record<string, string | null> = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || excluded.has(key)) continue;
      if (!key.startsWith("crimson") && !key.startsWith("public_tm_") && !key.startsWith("journal") && !key.startsWith("travel")) continue;
      storage[key] = window.localStorage.getItem(key);
    }
    return {
      manifest: {
        schema: "crimson-world-vault",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        source: "git-archive-center",
      },
      config: {
        provider: gitProvider,
        repository: gitRepository.trim(),
        branch: gitBranch.trim() || "main",
        directory: gitDirectory.trim() || "crimson-world-vault",
      },
      storage,
    };
  }

  function exportGitArchive() {
    const archive = collectGitArchive();
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crimson-world-git-archive-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Git 仓库存档已导出。可以把这个 JSON 上传到仓库，也可以稍后直接导回绯界。");
  }

  async function importGitArchive(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { manifest?: { schema?: string }; storage?: Record<string, unknown> };
      if (parsed?.manifest?.schema !== "crimson-world-vault" || !parsed.storage || typeof parsed.storage !== "object") {
        throw new Error("这不是可识别的绯界 Git 仓库存档。");
      }
      const entries = Object.entries(parsed.storage);
      if (!entries.length) throw new Error("存档中没有可导入的数据。");
      const confirmed = window.confirm("将把 Git 存档合并到当前浏览器。相同键会由导入文件覆盖，云端钥匙不会被导入。确定继续吗？");
      if (!confirmed) return;
      entries.forEach(([key, value]) => {
        if (typeof value === "string") window.localStorage.setItem(key, value);
      });
      setMessage("Git 仓库存档已导入，页面即将刷新。");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Git 仓库存档导入失败。");
    } finally {
      if (gitImportRef.current) gitImportRef.current.value = "";
    }
  }

${functionAnchor}`;
  cloud = cloud.replace(functionAnchor, helpers);

  const providerEnd = '                </section>';
  const providerMarker = '{/* CRIMSON_CLOUD_PROVIDER_CHOICE */}';
  const markerIndex = cloud.indexOf(providerMarker);
  if (markerIndex < 0) throw new Error("Cloud provider section marker not found");
  const sectionEnd = cloud.indexOf(providerEnd, markerIndex);
  if (sectionEnd < 0) throw new Error("Cloud provider section end not found");
  const insertionPoint = sectionEnd + providerEnd.length;
  const gitPanel = `
                <section className="git-archive-center">
                  <div className="git-archive-heading">
                    <div><span>GIT ARCHIVE</span><strong>接入 Git 仓库存档</strong></div>
                    <small>与 Cloudflare / Supabase 分开配置</small>
                  </div>
                  <p>Git 是长期存档与迁移通道，不替代实时云端。你可以把导出的文件上传到 GitHub、Gitee 或 GitLab，下载后再直接导回绯界。</p>
                  <div className="git-provider-tabs">
                    {[{ id: "gitee", label: "Gitee" }, { id: "github", label: "GitHub" }, { id: "gitlab", label: "GitLab" }, { id: "custom", label: "其他 Git" }].map((item) => (
                      <button key={item.id} type="button" className={gitProvider === item.id ? "is-selected" : ""} onClick={() => setGitProvider(item.id)}>{item.label}</button>
                    ))}
                  </div>
                  <label>仓库地址或 owner/repository<input value={gitRepository} placeholder={gitProvider === "gitee" ? "例如：用户名/crimson-world-vault" : "例如：owner/crimson-world-vault"} onChange={(event) => setGitRepository(event.target.value)} /></label>
                  <div className="git-archive-row"><label>分支<input value={gitBranch} placeholder="main" onChange={(event) => setGitBranch(event.target.value)} /></label><label>存档目录<input value={gitDirectory} placeholder="crimson-world-vault" onChange={(event) => setGitDirectory(event.target.value)} /></label></div>
                  <label>访问令牌（可选，仅用于后续自动同步）<input type="password" value={gitToken} autoComplete="off" placeholder="不会写入导出文件" onChange={(event) => setGitToken(event.target.value)} /></label>
                  <button className="git-save-config" type="button" onClick={saveGitArchiveConfig}>保存 Git 配置</button>
                  <div className="git-archive-actions">
                    <button type="button" onClick={exportGitArchive}><span>↓</span><strong>导出 Git 存档</strong><small>生成可上传仓库的 JSON</small></button>
                    <button type="button" onClick={() => gitImportRef.current?.click()}><span>↑</span><strong>导入 Git 存档</strong><small>下载仓库文件后直接恢复</small></button>
                  </div>
                  <input ref={gitImportRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importGitArchive(file); }} />
                  <small className="git-archive-note">建议使用私有仓库。主钥匙、读取钥匙、回复钥匙和 Git 访问令牌都不会进入导出文件。</small>
                </section>`;
  cloud = cloud.slice(0, insertionPoint) + gitPanel + cloud.slice(insertionPoint);
  fs.writeFileSync(cloudPath, cloud);
}

if (!css.includes(marker)) {
  css += `
/* ${marker} */
.git-archive-center{display:grid;gap:12px;margin-top:14px;padding:15px;border:1px solid rgba(113,174,144,.28);border-radius:18px;background:linear-gradient(145deg,rgba(63,114,89,.16),rgba(255,255,255,.025))}.git-archive-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.git-archive-heading div{display:grid;gap:3px}.git-archive-heading span{font-size:9px;letter-spacing:.22em;color:#9dd4b4}.git-archive-heading strong{font-size:15px;color:#f7fff9}.git-archive-heading>small{font-size:9px;color:rgba(239,255,245,.52)}.git-archive-center>p{margin:0;color:rgba(239,255,245,.66);font-size:11px;line-height:1.65}.git-provider-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.git-provider-tabs button{padding:8px 4px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.05);color:rgba(245,255,248,.68);font-size:10px;cursor:pointer}.git-provider-tabs button.is-selected{border-color:rgba(125,211,162,.56);background:rgba(70,145,102,.22);color:#eafff1}.git-archive-center label{display:grid;gap:6px;font-size:10px;color:rgba(239,255,245,.62)}.git-archive-center input{width:100%;box-sizing:border-box}.git-archive-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.git-save-config{padding:10px;border:1px solid rgba(125,211,162,.32);border-radius:12px;background:rgba(70,145,102,.14);color:#eafff1;cursor:pointer}.git-archive-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.git-archive-actions button{display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:center;padding:12px;text-align:left;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.055);color:#f5fff8;cursor:pointer}.git-archive-actions button>span{grid-row:1/3;font-size:21px;color:#9dd4b4}.git-archive-actions strong{font-size:11px}.git-archive-actions small{font-size:9px;color:rgba(239,255,245,.5)}.git-archive-note{line-height:1.6;color:rgba(239,255,245,.48)}
@media(max-width:520px){.git-provider-tabs{grid-template-columns:1fr 1fr}.git-archive-row,.git-archive-actions{grid-template-columns:1fr}.git-archive-heading{align-items:flex-start;flex-direction:column}.git-archive-center{padding:13px}}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("Applied separate Git archive connection and import/export center.");
