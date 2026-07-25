import fs from "node:fs";

const recordsApi = "https://crimson-world.lingwangshu018.workers.dev/api/records";

function patchTavern() {
  const path = new URL("../app/page.tsx", import.meta.url);
  let source = fs.readFileSync(path, "utf8");
  if (source.includes("CRIMSON_TAVERN_DIRECT_REPLY_COLLECTION")) return;

  const start = source.indexOf("  async function pullVaultNotes(options?: {");
  const end = source.indexOf("  async function copyVaultReadKey()", start);
  if (start < 0 || end < 0) throw new Error("Tavern pullVaultNotes block not found");

  const replacement = `  async function pullVaultNotes(options?: {
    ownerKey?: string;
    silent?: boolean;
  }) {
    if (pullingVaultNotes && !options?.silent) return;
    const accessKey = options?.ownerKey || vaultOwnerKey || vaultReadKey;
    if (!VAULT_KEY_PATTERN.test(accessKey)) {
      if (!options?.silent) showToast("请先发送一次酒签，酒馆才能收取 AI 手记。");
      return;
    }

    if (!options?.silent) setPullingVaultNotes(true);
    try {
      const response = await fetch("${recordsApi}?module=tavern&limit=250", {
        headers: {
          Authorization: \`Bearer \${accessKey}\`,
          "X-Crimson-Key": accessKey,
          Accept: "application/json",
        },
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        records?: Array<{ id?: string; note?: string; noteUpdatedAt?: string | null }>;
      };
      if (!response.ok) throw new Error(result.error || "收取手记失败");

      const cloudById = new Map(
        (result.records || []).map((record) => [String(record.id || ""), record]),
      );
      const replacements = new Map<string, TavernRecord>();
      const nextRecords = records.map((record) => {
        const cloudRecord = cloudById.get(record.id);
        const note = String(cloudRecord?.note || "").trim();
        if (!cloudRecord || !note || note === record.note) return record;
        const merged: TavernRecord = {
          ...record,
          note,
          noteUpdatedAt: cloudRecord.noteUpdatedAt || new Date().toISOString(),
        };
        replacements.set(record.id, merged);
        return merged;
      });

      if (replacements.size) {
        persistRecords(nextRecords);
        setCurrent((record) =>
          record && replacements.has(record.id)
            ? replacements.get(record.id) || record
            : record,
        );
        setDrafts((previous) => {
          const next = { ...previous };
          replacements.forEach((record, id) => { next[id] = record.note; });
          return next;
        });
      }
      setPendingVaultNotes(0);
      if (!options?.silent) {
        showToast(
          replacements.size
            ? \`已收取 \${replacements.size} 篇 AI 手记，并填入对应酒签。\`
            : "暂时没有新的 AI 手记。",
        );
      }
    } catch (error) {
      if (!options?.silent) {
        const message = error instanceof Error ? error.message : "收取手记失败";
        showToast(\`\${message.slice(0, 80)}，请稍后再试。\`);
      }
    } finally {
      if (!options?.silent) setPullingVaultNotes(false);
    }
  }

  // CRIMSON_TAVERN_DIRECT_REPLY_COLLECTION

`;
  source = source.slice(0, start) + replacement + source.slice(end);
  fs.writeFileSync(path, source);
}

function patchTimeWheel() {
  const path = new URL("../public/time-wheel/index.html", import.meta.url);
  let source = fs.readFileSync(path, "utf8");
  if (source.includes("CRIMSON_TIME_WHEEL_DIRECT_REPLY_COLLECTION")) return;

  const sendStart = source.indexOf("  async function sendRecordToAI(id) {");
  const pullStart = source.indexOf("  async function pullReplies() {", sendStart);
  const pullEnd = source.indexOf("  function locateRecord(id) {", pullStart);
  if (sendStart < 0 || pullStart < 0 || pullEnd < 0) {
    throw new Error("Time Wheel send/pull blocks not found");
  }

  const replacement = `  async function sendRecordToAI(id) {
    const history = readHistory();
    const index = history.findIndex(item => String(item.id) === String(id));
    const item = history[index];
    if (!item) return setStatus("没有找到这条记录。");

    const keys = ensureKeys();
    if (!keys) return setStatus("⚠️ 请前往绯界控制中心生成并配置共享读取钥匙与回复钥匙。");
    setStatus("正在同步这条时光记录……");
    try {
      const response = await fetch("${recordsApi}", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + keys.owner,
          "X-Crimson-Key": keys.owner,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          readKey: keys.read,
          replyKey: keys.reply,
          records: [{
            id: String(item.id),
            module: "time-wheel",
            title: item.module_name || "时光之轮记录",
            summary: item.topic || "无主题",
            content: item.content || "",
            note: item.ai_reply || "",
            createdAt: new Date(item.created_at || Date.now()).toISOString(),
            updatedAt: item.ai_reply_at ? new Date(item.ai_reply_at).toISOString() : new Date(item.created_at || Date.now()).toISOString(),
            noteUpdatedAt: item.ai_reply_at ? new Date(item.ai_reply_at).toISOString() : null,
            metadata: {
              moduleName: "时光之轮",
              displayNumber: displayId(item, index, history.length),
              topic: item.topic || "",
            },
          }],
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !(result.syncedIds || []).includes(String(item.id))) {
        throw new Error(result.error || "记录同步失败");
      }
    } catch (error) {
      return setStatus((error && error.message) || "记录同步失败，请稍后再试。");
    }

    const text = [
      "请读取我的绯界记录，并继续完成这一事件。",
      "",
      "模块：时光之轮",
      "",
      "【记录编号】",
      displayId(item, index, history.length),
      "",
      "【记录ID】",
      String(id),
      "",
      "【读取钥匙】",
      keys.read,
      "",
      "【回复钥匙】",
      keys.reply,
      "",
      "请读取这条记录的完整内容。",
      "",
      "结合当前聊天已经加载的角色卡、世界书和近期记忆，继续完成这一事件。",
      "",
      "完成后，请使用回复钥匙，将完整回复写回本条记录的 note 字段。",
      "不要修改原始记录，不要创建新的记录，不要回复到其它记录。",
      "只处理这一条记录即可。",
    ].join("\\n");
    await copyText(text, "记录已同步，AI 任务单已复制。");
  }

  async function pullReplies() {
    const keys = ensureKeys();
    if (!keys) return setStatus("请先发送一次记录。");
    setStatus("正在收取 AI 回复……");
    try {
      const response = await fetch("${recordsApi}?module=time-wheel&limit=250", {
        headers: {
          Authorization: "Bearer " + keys.owner,
          "X-Crimson-Key": keys.owner,
          Accept: "application/json",
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "收取失败");
      const cloud = new Map((result.records || []).map(item => [String(item.id), item]));
      let count = 0;
      const next = readHistory().map(item => {
        const remote = cloud.get(String(item.id));
        const note = String(remote && remote.note || "").trim();
        if (note && note !== String(item.ai_reply || "")) {
          count += 1;
          return {
            ...item,
            ai_reply: note,
            ai_reply_at: remote.noteUpdatedAt ? new Date(remote.noteUpdatedAt).getTime() : Date.now(),
          };
        }
        return item;
      });
      writeHistory(next);
      setStatus(count ? "已收取 " + count + " 条新回复。" : "暂时没有新的 AI 回复。");
      refreshHistoryTools();
    } catch (error) {
      setStatus((error && error.message) || "收取失败，请稍后再试。");
    }
  }

  // CRIMSON_TIME_WHEEL_DIRECT_REPLY_COLLECTION

`;
  source = source.slice(0, sendStart) + replacement + source.slice(pullEnd);
  fs.writeFileSync(path, source);
}

patchTavern();
patchTimeWheel();
console.log("Applied direct unified reply collection to Tavern and Time Wheel.");
