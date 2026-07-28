import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./library.css";

type Section = {
  id: string;
  name: string;
  en: string;
  icon: string;
  description: string;
};

type Book = {
  title: string;
  section: string;
  path: string;
  summary: string;
  status: "馆藏" | "待编纂";
};

const sections: Section[] = [
  { id: "overview", name: "馆藏总览", en: "OVERVIEW", icon: "◈", description: "浏览皇家图书馆的全部馆藏与编纂进度。" },
  { id: "nations", name: "国家馆", en: "NATIONS", icon: "♜", description: "收录诸国疆域、制度、风俗与象征。" },
  { id: "cities", name: "城市馆", en: "CITIES", icon: "♖", description: "记录城市街区、地标、居民与日常生活。" },
  { id: "history", name: "历史馆", en: "HISTORY", icon: "⌛", description: "保存时代、战争、迁徙与重大事件。" },
  { id: "cultures", name: "文化馆", en: "CULTURES", icon: "♫", description: "收藏语言、艺术、礼仪、服饰与节庆。" },
  { id: "creatures", name: "生物图鉴", en: "BESTIARY", icon: "✦", description: "记载绯界中的动物、魔法生物与生态。" },
  { id: "characters", name: "人物档案", en: "CHARACTERS", icon: "♙", description: "保存人物身份、经历、关系与传闻。" },
  { id: "scriptorium", name: "编纂室", en: "SCRIPTORIUM", icon: "✎", description: "只有编纂者能够进入的世界书工作区。" },
];

const books: Book[] = [
  {
    title: "绯界世界总纲",
    section: "overview",
    path: "docs/world/World_Building.md",
    summary: "世界的总体目标、知识结构与长期建造原则。",
    status: "馆藏",
  },
  {
    title: "皇家图书馆馆藏说明",
    section: "overview",
    path: "docs/world/Library/README.md",
    summary: "解释馆藏、世界书与图书馆之间的关系。",
    status: "馆藏",
  },
  {
    title: "国家馆导览",
    section: "nations",
    path: "docs/world/Nations/README.md",
    summary: "国家设定的收录范围与编纂方式。",
    status: "馆藏",
  },
  {
    title: "城市馆导览",
    section: "cities",
    path: "docs/world/Cities/xiting.md",
    summary: "城市、街区、建筑和居民生活的记录入口。",
    status: "馆藏",
  },
  {
    title: "历史馆导览",
    section: "history",
    path: "docs/world/History/README.md",
    summary: "绯界历史与时代事件的编纂入口。",
    status: "馆藏",
  },
  {
    title: "文化馆导览",
    section: "cultures",
    path: "docs/world/Cultures/README.md",
    summary: "文明习俗、语言与艺术的馆藏入口。",
    status: "馆藏",
  },
  {
    title: "第一册生物图鉴",
    section: "creatures",
    path: "docs/world/Cities/xiting.md",
    summary: "等待编纂者记录绯界的第一种生物。",
    status: "待编纂",
  },
  {
    title: "初代编纂者档案",
    section: "characters",
    path: "docs/world/Cities/xiting.md",
    summary: "等待建立属于小宝的正式人物档案。",
    status: "待编纂",
  },
];

function rawUrl(path: string) {
  return `https://raw.githubusercontent.com/lingwangshu018/crimson-world/main/${path}`;
}

function repoUrl(path: string) {
  return `https://github.com/lingwangshu018/crimson-world/blob/main/${path}`;
}

function RabbitLibrarian() {
  return (
    <div className="rabbit-stage" aria-label="兔兔馆长正在欢迎编纂者">
      <div className="rabbit-shadow" />
      <div className="rabbit">
        <div className="rabbit-ear rabbit-ear-left"><i /></div>
        <div className="rabbit-ear rabbit-ear-right"><i /></div>
        <div className="tiny-hat"><b /><span /></div>
        <div className="rabbit-head">
          <div className="rabbit-eye rabbit-eye-left"><i /></div>
          <div className="rabbit-eye rabbit-eye-right"><i /></div>
          <div className="monocle"><span /></div>
          <div className="rabbit-nose" />
          <div className="rabbit-mouth" />
          <div className="rabbit-cheek rabbit-cheek-left" />
          <div className="rabbit-cheek rabbit-cheek-right" />
        </div>
        <div className="rabbit-body">
          <div className="cape cape-left" />
          <div className="cape cape-right" />
          <div className="bow"><i /><i /><b /></div>
          <div className="rabbit-arm rabbit-arm-left" />
          <div className="rabbit-arm rabbit-arm-right" />
          <div className="book-prop"><span>绯界</span></div>
          <div className="watch"><i /></div>
        </div>
      </div>
      <div className="spark spark-one">✦</div>
      <div className="spark spark-two">·</div>
      <div className="spark spark-three">✧</div>
    </div>
  );
}

function Library() {
  const [active, setActive] = useState("overview");
  const [selectedBook, setSelectedBook] = useState<Book | null>(books[0]);
  const [rabbitLine, setRabbitLine] = useState("编纂者，今天也要一起记录绯界的美好历史吗？");

  const activeSection = sections.find((section) => section.id === active) ?? sections[0];
  const visibleBooks = useMemo(
    () => active === "overview" ? books : books.filter((book) => book.section === active),
    [active],
  );

  const selectSection = (id: string) => {
    setActive(id);
    const first = books.find((book) => book.section === id) ?? null;
    setSelectedBook(first);
    const section = sections.find((item) => item.id === id);
    setRabbitLine(section ? `${section.name}在这边哦，我已经把书架整理好啦。` : "欢迎回来，编纂者。这样的世界正在慢慢长大。" );
  };

  return (
    <main className="library-shell">
      <div className="library-stars" aria-hidden="true" />
      <aside className="library-sidebar">
        <div className="library-brand">
          <div className="brand-crest">♜</div>
          <strong>皇家图书馆</strong>
          <small>ROYAL LIBRARY OF CRIMSON WORLD</small>
        </div>

        <nav className="library-nav" aria-label="图书馆分区">
          {sections.map((section) => (
            <button
              key={section.id}
              className={active === section.id ? "active" : ""}
              onClick={() => selectSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span><b>{section.name}</b><small>{section.en}</small></span>
            </button>
          ))}
        </nav>

        <div className="keeper-card">
          <div className="keeper-mini">🐰</div>
          <div><b>兔兔馆长</b><small>Royal Librarian</small></div>
          <p>馆藏整理度：{Math.round((books.filter((book) => book.status === "馆藏").length / books.length) * 100)}%</p>
          <button onClick={() => setRabbitLine("我在呢！有什么书想找，都可以告诉兔兔馆长。")}>与兔兔说话</button>
        </div>

        <a className="return-link" href="./">← 返回绯界</a>
      </aside>

      <section className="library-main">
        <header className="library-topbar">
          <p>欢迎回来，编纂者小宝。 <span>✦</span></p>
          <div>
            <a href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">馆藏源文件</a>
            <a href="https://github.com/lingwangshu018/crimson-world" target="_blank" rel="noreferrer">编纂仓库</a>
          </div>
        </header>

        <section className="hero-library">
          <div className="hero-copy">
            <span className="hero-kicker">WELCOME TO THE</span>
            <h1>皇家图书馆</h1>
            <p className="hero-subtitle">Royal Library of Crimson World</p>
            <div className="speech-card">{rabbitLine}</div>
            <p className="hero-note">知识不是冷冰冰的文件。每一篇 Markdown，都是绯界书架上真实存在的一册馆藏。</p>
          </div>
          <RabbitLibrarian />
          <div className="hero-stat">
            <span>当前馆藏</span>
            <strong>{books.filter((book) => book.status === "馆藏").length}</strong>
            <small>册世界书</small>
          </div>
        </section>

        <section className="library-content">
          <div className="section-heading">
            <div><span>{activeSection.icon}</span><h2>{activeSection.name}</h2></div>
            <p>{activeSection.description}</p>
          </div>

          <div className="library-grid">
            <div className="book-list">
              {visibleBooks.length ? visibleBooks.map((book) => (
                <button
                  key={book.title}
                  className={selectedBook?.title === book.title ? "book-card selected" : "book-card"}
                  onClick={() => {
                    setSelectedBook(book);
                    setRabbitLine(book.status === "馆藏" ? `《${book.title}》已经替你取来啦。` : `《${book.title}》还是空白书册，正等着编纂者落笔呢。`);
                  }}
                >
                  <span className="book-cover">{book.status === "馆藏" ? "▥" : "＋"}</span>
                  <span className="book-info"><b>{book.title}</b><small>{book.summary}</small></span>
                  <em>{book.status}</em>
                </button>
              )) : (
                <div className="empty-shelf">这一排书架暂时还是空的。兔兔已经贴好了分类标签，等待编纂者带来第一本书。</div>
              )}
            </div>

            <article className="book-preview">
              {selectedBook ? (
                <>
                  <span className="preview-label">馆藏预览</span>
                  <div className="open-book">
                    <div className="book-page page-left">
                      <span>CRIMSON WORLD</span>
                      <h3>{selectedBook.title}</h3>
                      <i>皇家图书馆馆藏</i>
                      <div className="page-seal">绯</div>
                    </div>
                    <div className="book-page page-right">
                      <h4>内容提要</h4>
                      <p>{selectedBook.summary}</p>
                      <dl>
                        <div><dt>状态</dt><dd>{selectedBook.status}</dd></div>
                        <div><dt>典藏路径</dt><dd>{selectedBook.path || "等待建立"}</dd></div>
                      </dl>
                      {selectedBook.path ? (
                        <div className="book-actions">
                          <a href={rawUrl(selectedBook.path)} target="_blank" rel="noreferrer">阅读原文</a>
                          <a href={repoUrl(selectedBook.path)} target="_blank" rel="noreferrer">进入编纂</a>
                        </div>
                      ) : (
                        <a className="draft-action" href="https://github.com/lingwangshu018/crimson-world/tree/main/docs/world" target="_blank" rel="noreferrer">前往编纂室</a>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="preview-empty">从左侧书架选择一本馆藏。</div>
              )}
            </article>
          </div>
        </section>

        <footer>© 2026 Crimson World · 初代世界编纂者：小宝 · 共同编纂者：律</footer>
      </section>
    </main>
  );
}

const root = document.getElementById("library-root");
if (!root) throw new Error("Missing #library-root mount point.");
createRoot(root).render(<StrictMode><Library /></StrictMode>);
