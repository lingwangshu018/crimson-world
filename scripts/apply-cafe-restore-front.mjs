import fs from "node:fs";

const path = "app/CafeRoom.tsx";
let source = fs.readFileSync(path, "utf8");

if (source.includes("CAFE_RESTORED_FRONT_ORDER")) {
  console.log("Cafe landing order already restored.");
  process.exit(0);
}

if (!source.includes('title: "灯会走散之后"')) {
  source = source.replace(
    '  { title: "初雪来信", category: "恋爱", flavour: "白巧拿铁", premise: "初雪落下时，一封迟到的信改变了两个人原本平静的一天。" },\n];',
    '  { title: "初雪来信", category: "恋爱", flavour: "白巧拿铁", premise: "初雪落下时，一封迟到的信改变了两个人原本平静的一天。" },\n  { title: "灯会走散之后", category: "古风", flavour: "桂花拿铁", premise: "灯会散场时两个人在人潮中走散，又循着彼此留下的线索重新找到对方。" },\n  { title: "魔法失灵的一天", category: "奇幻", flavour: "榛果摩卡", premise: "习以为常的魔法突然失灵，两个人只能用最普通的方法一起解决接踵而来的麻烦。" },\n];',
  );
}

const filteredEnd = '  }), [records, search, filter]);';
if (!source.includes("const today = menu[new Date().getDate() % menu.length]")) {
  source = source.replace(
    filteredEnd,
    `${filteredEnd}\n\n  const today = menu[new Date().getDate() % menu.length];`,
  );
}

if (!source.includes("function orderMenu(")) {
  const marker = `  function randomOrder() {
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
    createRecord({ title: randomTitle, premise: \`围绕“\${randomTitle}”展开一篇符合现有人物关系与世界设定的小剧场。\`, category: "随机剧场", flavour: "甜而克制", kind: "random" });
  }
`;
  const replacement = `${marker}\n  function orderMenu(item: (typeof menu)[number], kind: CafeRecord["kind"] = "menu") {\n    createRecord({ ...item, kind, mustInclude: "", avoid: "", narrative, cupSize });\n  }\n`;
  if (!source.includes(marker)) throw new Error("Could not locate Cafe randomOrder function.");
  source = source.replace(marker, replacement);
}

const returnStart = source.indexOf("  return (\n");
const componentEnd = source.lastIndexOf("\n}");
if (returnStart < 0 || componentEnd < 0 || componentEnd <= returnStart) {
  throw new Error("Could not locate CafeRoom render block.");
}

const render = `  // CAFE_RESTORED_FRONT_ORDER
  return (
    <section
      id="cafe"
      className="cafe-room cafe-tavern-layout"
      style={{
        backgroundImage: 'linear-gradient(180deg, rgba(15,5,8,.18), rgba(15,5,8,.48)), url("images/crimson-cafe-background.webp")',
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className={\`cafe-toast \${toast ? "show" : ""}\`}>{toast}</div>

      <header className="cafe-hero">
        <div>
          <p>CRIMSON CAFÉ · NOW SERVING STORIES</p>
          <h2>点一杯咖啡，<br /><em>看一段只属于你们的故事。</em></h2>
          <span>咖啡馆负责日常、陪伴与小剧场。今天想喝点什么？</span>
        </div>
        <div className="cafe-cup" aria-hidden="true"><i /><b>☕</b><small>CAFÉ</small></div>
      </header>

      <div className="cafe-dashboard">
        <article className="cafe-daily">
          <p className="cafe-label">TODAY&apos;S RECOMMENDATION · 今日推荐</p>
          <h3>{today.title}</h3>
          <span>{today.flavour} · {today.category}</span>
          <p>{today.premise}</p>
          <button type="button" onClick={() => orderMenu(today, "daily")}>点今日推荐</button>
        </article>
        <article className="cafe-random">
          <p className="cafe-label">BARISTA&apos;S CHOICE · 随机剧场</p>
          <h3>把今天交给咖啡师</h3>
          <p>不用填写任何内容，随机抽取一份只演一次的故事订单。</p>
          <button type="button" onClick={randomOrder}>🎲 随机特调</button>
        </article>
      </div>

      <div className="cafe-menu" aria-label="选取剧本">
        {menu.map((item) => (
          <button type="button" key={item.title} onClick={() => orderMenu(item)}>
            <small>{item.category}</small>
            <strong>{item.title}</strong>
            <span>{item.flavour}</span>
          </button>
        ))}
      </div>

      <section id="cafe-workshop" className="cafe-workshop cafe-order-studio">
        <header><p className="cafe-label">STORY RECIPE · 剧场工坊</p><h3>调一份私人故事配方</h3></header>
        <div className="cafe-form cafe-order-form">
          <label><span>今天想看什么</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：初雪那天，他终于来接我" /></label>
          <label className="wide"><span>核心设定</span><textarea value={premise} onChange={(event) => setPremise(event.target.value)} placeholder="想发生的事情、故事起点和主要冲突……" /></label>
          <label><span>必须出现</span><textarea value={mustInclude} onChange={(event) => setMustInclude(event.target.value)} placeholder="对白、动作、场景或关键情节" /></label>
          <label><span>不要出现</span><textarea value={avoid} onChange={(event) => setAvoid(event.target.value)} placeholder="不喜欢的桥段、角色或走向" /></label>
          <label><span>故事味道</span><input value={flavour} onChange={(event) => setFlavour(event.target.value)} /></label>
          <label><span>叙事偏好</span><input value={narrative} onChange={(event) => setNarrative(event.target.value)} /></label>
        </div>
        <div className="cup-selector cafe-cup-selector-v2">
          {(Object.keys(cupLabels) as CupSize[]).map((size) => (
            <button type="button" className={cupSize === size ? "active" : ""} key={size} onClick={() => setCupSize(size)}>
              <strong>{cupLabels[size].name}</strong><small>{cupLabels[size].hint}</small>
            </button>
          ))}
        </div>
        <div className="cafe-form-actions cafe-order-actions"><button type="button" onClick={saveRecipe}>保存配方</button><button className="primary" type="button" onClick={orderCustom}>开始演绎</button></div>
      </section>

      {recipes.length ? (
        <section className="recipe-shelf cafe-recipe-shelf-v2">
          <header><p className="cafe-label">PRIVATE RECIPES · 私人配方</p><h3>配方柜</h3></header>
          <div>{recipes.map((recipe) => <button type="button" key={recipe.id} onClick={() => useRecipe(recipe)}><strong>{recipe.title}</strong><span>{recipe.flavour} · {cupLabels[recipe.cupSize].name}</span></button>)}</div>
        </section>
      ) : null}

      <header className="cafe-ledger-hero">
        <p>THE STORY LEDGER</p>
        <h2><em>{String(records.length).padStart(2, "0")}</em> 剧场档案</h2>
        <span>每一杯故事都留下一张剧场卡，展开它，继续书写未完的片段。</span>
      </header>

      <section className="cafe-ledger-stats">
        <p className="cafe-label">PRIVATE COLLECTION</p>
        <strong>{String(records.length).padStart(2, "0")}</strong>
        <span>杯故事留下手札</span>
        <dl><div><dt>★ 收藏</dt><dd>{records.filter((item) => item.favorite).length}</dd></div><div><dt>✎ 手记</dt><dd>{records.filter((item) => item.note.trim()).length}</dd></div><div><dt>☕ 配方</dt><dd>{recipes.length}</dd></div></dl>
      </section>

      <div className="cafe-archive-actions">
        <button type="button" onClick={exportRecords}><span>↓</span><b>导出全部档案</b><small>剧场卡与配方保存为 JSON</small></button>
        <button type="button" onClick={() => importRef.current?.click()}><span>↑</span><b>导入咖啡馆档案</b><small>自动合并，不覆盖不同记录</small></button>
        <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importRecords(file); event.currentTarget.value = ""; }} />
      </div>

      <section className="cafe-ai-panel">
        <header><p>AI STORY NOTE</p><span>静候回信</span></header>
        <h3>把这一杯交给 AI 继续书写</h3>
        <label><span>订单编号</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="例如 CF-0001" /></label>
        <div><button type="button" onClick={sendSelectedToAI} disabled={syncing}>{syncing ? "正在准备……" : "✉ 发送给 AI"}</button><button type="button" onClick={pullSelectedNote} disabled={pulling}>{pulling ? "正在收取……" : "▣ 收取新手记"}</button></div>
      </section>

      <section className="cafe-ledger">
        <div className="cafe-ledger-toolbar">
          <label><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索剧场、味道或手记……" /></label>
          <div><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>全部</button><button className={filter === "favorite" ? "active" : ""} onClick={() => setFilter("favorite")}>收藏</button><button className={filter === "notes" ? "active" : ""} onClick={() => setFilter("notes")}>手记</button></div>
        </div>

        <div className="cafe-record-list-v2">
          {filtered.length ? filtered.map((record) => {
            const expanded = active?.id === record.id;
            return (
              <article className={\`cafe-record-card-v2 \${expanded ? "expanded" : ""}\`} key={record.id}>
                <button type="button" className="cafe-record-summary-v2" onClick={() => setActiveId(expanded ? null : record.id)}>
                  <span className="cafe-record-code" onContextMenu={(event) => { event.preventDefault(); copyCode(record); }}>{displayNumber(record)}</span>
                  <span><small>BARISTA&apos;S CHOICE · {formatDate(record.createdAt)}</small><strong>{record.title}</strong><em>{record.flavour} · {cupLabels[record.cupSize].name}{record.note ? " · 已有手记" : ""}</em></span>
                  <b>{expanded ? "−" : "+"}</b>
                </button>
                {expanded ? (
                  <div className="cafe-record-details-v2">
                    <section className="cafe-recipe-panel-v2">
                      <p>THE RECIPE · 本杯订单</p>
                      <dl><div><dt>分类</dt><dd>{record.category}</dd></div><div><dt>味道</dt><dd>{record.flavour}</dd></div><div><dt>杯型</dt><dd>{cupLabels[record.cupSize].name}<small>{cupLabels[record.cupSize].hint}</small></dd></div><div><dt>设定</dt><dd>{record.premise}</dd></div>{record.mustInclude ? <div><dt>必须出现</dt><dd>{record.mustInclude}</dd></div> : null}{record.avoid ? <div><dt>避免出现</dt><dd>{record.avoid}</dd></div> : null}</dl>
                    </section>
                    <section className="cafe-notebook-v2">
                      <header><div><p>STORY NOTE · 剧场手记</p><span>上次保存于 {record.noteUpdatedAt ? formatDate(record.noteUpdatedAt) : "尚未保存"}</span></div><em>PAGE 01</em></header>
                      <textarea value={record.note} maxLength={20000} onChange={(event) => updateNote(record, event.target.value)} placeholder="AI 的完整小剧场会收取到这里，也可以自己编写……" />
                      <footer><span>{record.note.length} / 20000</span><div><button onClick={() => persist(records.map((item) => item.id === record.id ? { ...item, favorite: !item.favorite } : item))}>{record.favorite ? "取消收藏" : "收藏故事"}</button><button onClick={() => clearNote(record)} className="danger">删除手记</button><button onClick={() => removeRecord(record)} className="danger">移除订单</button><button onClick={() => notify("剧场手记已经保存在本机。")}>保存手记</button></div></footer>
                    </section>
                  </div>
                ) : null}
              </article>
            );
          }) : <div className="cafe-empty-v2">还没有符合条件的剧场卡。</div>}
        </div>
      </section>
    </section>
  );`;

source = `${source.slice(0, returnStart)}${render}${source.slice(componentEnd)}`;
fs.writeFileSync(path, source);
console.log("Restored Cafe landing, menu and workshop before the archive.");
