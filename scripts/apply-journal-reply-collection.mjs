import fs from "node:fs";

const componentPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const stylePath = new URL("../app/journal-room.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8");
let styles = fs.readFileSync(stylePath, "utf8");

if (!source.includes("CRIMSON_JOURNAL_REPLY_COLLECTION")) {
  const stateAnchor = '  const [customBackground, setCustomBackground] = useState("");';
  if (!source.includes(stateAnchor)) {
    throw new Error("Journal reply collection state anchor not found");
  }
  source = source.replace(
    stateAnchor,
    `${stateAnchor}\n  const [replyBusy, setReplyBusy] = useState(false);\n  // CRIMSON_JOURNAL_REPLY_COLLECTION`,
  );

  const uploadAnchor = "  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {";
  if (!source.includes(uploadAnchor)) {
    throw new Error("Journal reply collection function anchor not found");
  }
  source = source.replace(
    uploadAnchor,
    `  async function collectReply() {
    if (!current || replyBusy) return;

    const accessKeys = [
      localStorage.getItem(READ_KEY) || "",
      localStorage.getItem(OWNER_KEY) || "",
    ].filter((value, index, values) => value && values.indexOf(value) === index);

    if (!accessKeys.length) {
      window.alert("没有找到绯界读取钥匙，请先重新发送一次任务单。");
      return;
    }

    setReplyBusy(true);
    try {
      const url = new URL(RECORDS_API_URL);
      url.searchParams.set("recordId", current.id);
      url.searchParams.set("limit", "1");

      let response: Response | null = null;
      let data: {
        error?: string;
        records?: Array<{
          id?: string;
          note?: string;
          noteUpdatedAt?: string | null;
        }>;
      } = {};

      for (const accessKey of accessKeys) {
        response = await fetch(url.toString(), {
          headers: {
            Authorization: \`Bearer \${accessKey}\`,
            "X-Crimson-Key": accessKey,
            Accept: "application/json",
          },
        });
        data = (await response.json().catch(() => ({}))) as typeof data;
        if (response.ok) break;
      }

      if (!response?.ok) {
        throw new Error(data.error || \`收取失败（HTTP \${response?.status || 0}）\`);
      }

      const record = (data.records || []).find((item) => item.id === current.id);
      if (!record) {
        throw new Error("云端没有找到这篇日记，请重新发送任务单后再试。");
      }

      const reply = String(record.note || "").trim();
      if (!reply) {
        window.alert("AI 还没有把回信写回这篇日记，请稍后再检查一次。");
        return;
      }

      const parsedReplyAt = record.noteUpdatedAt
        ? new Date(record.noteUpdatedAt).getTime()
        : Date.now();
      const replyAt = Number.isNaN(parsedReplyAt) ? Date.now() : parsedReplyAt;
      const nextDiaries = diaries.map((diary) => {
        if (diary.id !== current.id) return diary;
        const nextDiary: Diary = {
          ...diary,
          reply,
          replyAt,
          vaultSyncedAt: Date.now(),
        };
        return {
          ...nextDiary,
          vaultFingerprint: recordFingerprint(nextDiary),
        };
      });
      persist(nextDiaries);
      window.alert("💌 回信已经收取，并放进这篇日记里了。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "收取失败，请稍后重试。";
      window.alert(\`回信收取失败：\${message}\`);
    } finally {
      setReplyBusy(false);
    }
  }

${uploadAnchor}`,
  );

  const replyUiAnchor = '{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : <button className="journal-reply" onClick={requestReply}>呼唤机回信</button>}';
  if (!source.includes(replyUiAnchor)) {
    throw new Error("Journal reply collection UI anchor not found");
  }
  source = source.replace(
    replyUiAnchor,
    `{current.reply ? <aside><b>机的回音</b><p>{current.reply}</p><time>落笔于 {formatDate(current.replyAt)}</time></aside> : null}<div className="journal-reply-actions"><button className="journal-reply" onClick={requestReply}>{current.vaultSyncedAt ? "重发任务" : "呼唤回信"}</button><button className="journal-reply journal-reply-pull" onClick={collectReply} disabled={replyBusy}>{replyBusy ? "收取中…" : current.reply ? "检查新回信" : "收取回信"}</button></div>`,
  );

  fs.writeFileSync(componentPath, source);
}

if (!styles.includes("CRIMSON_JOURNAL_REPLY_COLLECTION_STYLES")) {
  styles += `

/* CRIMSON_JOURNAL_REPLY_COLLECTION_STYLES */
.journal-read-content{min-height:180px}
.journal-reply-actions{display:flex;gap:8px;margin:14px 0 0;align-items:center;justify-content:flex-end;flex-wrap:wrap;padding-top:12px;border-top:1px dashed rgba(113,84,52,.18)}
.journal-reply-actions .journal-reply{width:auto;min-width:104px;height:40px;margin:0;padding:0 16px;border:1px solid rgba(120,89,56,.3);border-radius:999px;background:rgba(255,248,231,.72);color:#765638;font-size:13px;font-weight:700;letter-spacing:.04em;box-shadow:none}
.journal-reply-actions .journal-reply:hover{background:rgba(145,105,60,.12)}
.journal-reply-actions .journal-reply-pull{border-color:rgba(132,75,85,.34);background:rgba(116,76,67,.12);color:#81535b}
.journal-reply-actions .journal-reply:disabled{opacity:.55;cursor:wait}
.paper-night .journal-reply-actions{border-top-color:rgba(255,255,255,.12)}
.paper-night .journal-reply-actions .journal-reply{background:rgba(255,255,255,.05);color:#dbc49d;border-color:rgba(201,169,107,.28)}
@media(max-width:560px){.journal-read-content{min-height:150px}.journal-reply-actions{justify-content:flex-end;gap:7px;margin-top:12px;padding-top:10px}.journal-reply-actions .journal-reply{min-width:96px;height:38px;padding:0 13px;font-size:12px}}
`;
  fs.writeFileSync(stylePath, styles);
}

console.log("Applied native Journal reply collection from the unified records API.");