import fs from "node:fs";

const componentPath = new URL("../app/JournalRoom.tsx", import.meta.url);
const stylePath = new URL("../app/journal-room.css", import.meta.url);
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_JOURNAL_READER_TOOLBAR")) {
  console.log("Journal reader toolbar already applied.");
  process.exit(0);
}

const stateMarker = '  const [customBackground, setCustomBackground] = useState("");';
if (!source.includes(stateMarker)) {
  throw new Error("Could not locate Journal reader state marker.");
}
source = source.replace(
  stateMarker,
  `${stateMarker}\n  const [readerMenuOpen, setReaderMenuOpen] = useState(false);`,
);

const oldHeader = /<header className="journal-reader-actions">[\s\S]*?<\/header>/;
if (!oldHeader.test(source)) {
  throw new Error("Could not locate Journal reader action header.");
}

const newHeader = `<header className="journal-reader-actions journal-reader-toolbar">
            <span className="journal-header-spacer" />
            <div className="journal-reader-primary-actions">
              <button type="button" onClick={() => { setReaderMenuOpen(false); setView("list"); }} aria-label="返回日记列表">‹</button>
              <button type="button" onClick={editCurrent} aria-label="编辑日记">编辑</button>
              <div className="journal-reader-more-wrap">
                <button type="button" className={readerMenuOpen ? "active" : ""} onClick={() => setReaderMenuOpen((open) => !open)} aria-expanded={readerMenuOpen} aria-label="更多操作">•••</button>
                {readerMenuOpen ? (
                  <div className="journal-reader-menu">
                    <button type="button" onClick={() => { toggleDiaryFlag(current.id, "pinned"); setReaderMenuOpen(false); }}><span>{current.pinned ? "📌" : "📍"}</span>{current.pinned ? "取消置顶" : "置顶日记"}</button>
                    <button type="button" onClick={() => { toggleDiaryFlag(current.id, "favorite"); setReaderMenuOpen(false); }}><span>{current.favorite ? "★" : "☆"}</span>{current.favorite ? "取消收藏" : "收藏日记"}</button>
                    <button type="button" onClick={() => { pasteReply(); setReaderMenuOpen(false); }}><span>✉</span>贴入回信</button>
                    <button type="button" className="danger" onClick={() => { setReaderMenuOpen(false); deleteCurrent(); }}><span>⌫</span>删除日记</button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>`;
source = source.replace(oldHeader, newHeader);
source = source.replace(
  'export function JournalRoom({ onClose }: { onClose: () => void }) {',
  'export function JournalRoom({ onClose }: { onClose: () => void }) {\n  // CRIMSON_JOURNAL_READER_TOOLBAR',
);

if (!styles.includes("CRIMSON_JOURNAL_READER_TOOLBAR_STYLES")) {
  styles += `

/* CRIMSON_JOURNAL_READER_TOOLBAR_STYLES */
.journal-reader-toolbar{position:sticky;top:0;z-index:12;display:flex;justify-content:flex-end;width:100%;margin:0;padding:14px 18px 8px;pointer-events:none;background:linear-gradient(180deg,rgba(239,231,213,.9),rgba(239,231,213,0));backdrop-filter:blur(5px)}
.paper-night .journal-reader-toolbar{background:linear-gradient(180deg,rgba(23,20,26,.92),rgba(23,20,26,0))}
.journal-reader-toolbar .journal-header-spacer{display:none}
.journal-reader-primary-actions{position:relative;display:flex!important;align-items:center;gap:7px;padding:5px;border:1px solid rgba(120,89,56,.22);border-radius:16px;background:rgba(248,240,220,.88);box-shadow:0 8px 24px rgba(49,31,19,.14);pointer-events:auto}
.paper-night .journal-reader-primary-actions{border-color:rgba(201,169,107,.24);background:rgba(24,20,27,.9)}
.journal-reader-primary-actions>button,.journal-reader-more-wrap>button{min-width:38px!important;width:auto!important;height:38px!important;padding:0 12px!important;border:0!important;border-radius:11px!important;background:transparent!important;box-shadow:none!important;color:#715538!important;font-size:13px!important;line-height:1;white-space:nowrap}
.paper-night .journal-reader-primary-actions>button,.paper-night .journal-reader-more-wrap>button{color:#d8c3a0!important}
.journal-reader-primary-actions>button:first-child{min-width:38px!important;padding:0!important;font-size:25px!important}
.journal-reader-primary-actions>button:hover,.journal-reader-more-wrap>button:hover,.journal-reader-more-wrap>button.active{background:rgba(125,91,53,.12)!important}
.journal-reader-more-wrap{position:relative}
.journal-reader-menu{position:absolute;top:calc(100% + 9px);right:0;display:grid!important;width:178px;overflow:hidden;padding:6px;border:1px solid rgba(120,89,56,.24);border-radius:14px;background:rgba(248,240,220,.98);box-shadow:0 16px 40px rgba(47,29,18,.24)}
.paper-night .journal-reader-menu{border-color:rgba(201,169,107,.24);background:rgba(25,21,28,.98)}
.journal-reader-menu button{display:flex!important;align-items:center;gap:11px;width:100%!important;height:auto!important;min-height:42px!important;padding:10px 12px!important;border:0!important;border-radius:9px!important;background:transparent!important;box-shadow:none!important;color:#5f4934!important;font-size:14px!important;text-align:left}
.paper-night .journal-reader-menu button{color:#ddc9a8!important}
.journal-reader-menu button:hover{background:rgba(125,91,53,.1)!important}
.journal-reader-menu button span{display:grid;width:22px;place-items:center;color:#977140}
.journal-reader-menu button.danger{color:#9b4c56!important}
.journal-reader-menu button.danger span{color:#9b4c56}
@media(max-width:600px){.journal-reader-toolbar{padding:10px 12px 4px}.journal-reader-primary-actions{gap:3px;padding:4px;border-radius:14px}.journal-reader-primary-actions>button,.journal-reader-more-wrap>button{height:36px!important;padding-inline:10px!important}.journal-reader-menu{width:168px}}
`;
}

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied compact Journal reader toolbar and overflow menu.");
