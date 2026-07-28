import fs from "node:fs";

const componentPath = "github-pages/library.tsx";
const stylePath = "github-pages/library.css";
let source = fs.readFileSync(componentPath, "utf8").replace(/\r\n/g, "\n");
let styles = fs.readFileSync(stylePath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("CRIMSON_LIBRARY_BOOK_READER")) {
  console.log("Library book reader already integrated.");
  process.exit(0);
}

function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Library reader target not found: ${before.slice(0, 100)}`);
  source = source.replace(before, after);
}

replace(
  `function repoUrl(path: string) {\n  return \`https://github.com/lingwangshu018/crimson-world/blob/main/\${path}\`;\n}\n`,
  `function repoUrl(path: string) {\n  return \`https://github.com/lingwangshu018/crimson-world/blob/main/\${path}\`;\n}\n\n// CRIMSON_LIBRARY_BOOK_READER\nfunction renderMarkdown(markdown: string) {\n  const lines = markdown.replace(/\\r\\n/g, "\\n").split("\\n");\n  const blocks: JSX.Element[] = [];\n  let paragraph: string[] = [];\n  let list: string[] = [];\n  let ordered = false;\n\n  const flushParagraph = () => {\n    const text = paragraph.join(" ").trim();\n    if (text) blocks.push(<p key={\`p-\${blocks.length}\`}>{text}</p>);\n    paragraph = [];\n  };\n  const flushList = () => {\n    if (!list.length) return;\n    const Tag = ordered ? "ol" : "ul";\n    blocks.push(<Tag key={\`l-\${blocks.length}\`}>{list.map((item, index) => <li key={index}>{item}</li>)}</Tag>);\n    list = [];\n  };\n\n  lines.forEach((line) => {\n    const heading = line.match(/^(#{1,4})\\s+(.+)$/);\n    const unorderedItem = line.match(/^\\s*[-*+]\\s+(.+)$/);\n    const orderedItem = line.match(/^\\s*\\d+[.)]\\s+(.+)$/);\n    const quote = line.match(/^>\\s?(.*)$/);\n    const rule = /^(-{3,}|_{3,}|\\*{3,})$/.test(line.trim());\n\n    if (heading) {\n      flushParagraph(); flushList();\n      const level = heading[1].length;\n      const Tag = (\`h\${level}\` as keyof JSX.IntrinsicElements);\n      blocks.push(<Tag key={\`h-\${blocks.length}\`}>{heading[2]}</Tag>);\n    } else if (unorderedItem || orderedItem) {\n      flushParagraph();\n      const nextOrdered = Boolean(orderedItem);\n      if (list.length && nextOrdered !== ordered) flushList();\n      ordered = nextOrdered;\n      list.push((orderedItem || unorderedItem)?.[1] || "");\n    } else if (quote) {\n      flushParagraph(); flushList();\n      blocks.push(<blockquote key={\`q-\${blocks.length}\`}>{quote[1]}</blockquote>);\n    } else if (rule) {\n      flushParagraph(); flushList();\n      blocks.push(<hr key={\`r-\${blocks.length}\`} />);\n    } else if (!line.trim()) {\n      flushParagraph(); flushList();\n    } else {\n      paragraph.push(line.trim());\n    }\n  });\n  flushParagraph(); flushList();\n  return blocks;\n}\n`,
);

replace(
  `  const [rabbitLine, setRabbitLine] = useState("编纂者，今天也要一起记录绯界的美好历史吗？");`,
  `  const [rabbitLine, setRabbitLine] = useState("编纂者，今天也要一起记录绯界的美好历史吗？");\n  const [readingBook, setReadingBook] = useState<Book | null>(null);\n  const [bookContent, setBookContent] = useState("");\n  const [bookLoading, setBookLoading] = useState(false);\n  const [bookError, setBookError] = useState("");`,
);

replace(
  `  const selectSection = (id: string) => {\n    setActive(id);\n    const first = books.find((book) => book.section === id) ?? null;\n    setSelectedBook(first);\n    const section = sections.find((item) => item.id === id);\n    setRabbitLine(section ? \`\${section.name}在这边哦，我已经把书架整理好啦。\` : "欢迎回来，编纂者。这样的世界正在慢慢长大。" );\n  };`,
  `  const selectSection = (id: string) => {\n    setActive(id);\n    const first = books.find((book) => book.section === id) ?? null;\n    setSelectedBook(first);\n    const section = sections.find((item) => item.id === id);\n    setRabbitLine(section ? \`\${section.name}在这边哦，我已经把书架整理好啦。\` : "欢迎回来，编纂者。这样的世界正在慢慢长大。" );\n  };\n\n  async function openBook(book: Book) {\n    if (!book.path) return;\n    setReadingBook(book);\n    setBookContent("");\n    setBookError("");\n    setBookLoading(true);\n    try {\n      const response = await fetch(rawUrl(book.path));\n      if (!response.ok) throw new Error(\`读取失败（HTTP \${response.status}）\`);\n      setBookContent(await response.text());\n    } catch (error) {\n      setBookError(error instanceof Error ? error.message : "暂时没有取到这本馆藏。");\n    } finally {\n      setBookLoading(false);\n    }\n  }\n\n  function closeBook() {\n    setReadingBook(null);\n    setBookContent("");\n    setBookError("");\n  }`,
);

replace(
  `      <div className="library-stars" aria-hidden="true" />`,
  `      <div className="library-stars" aria-hidden="true" />\n      {readingBook ? (\n        <div className="library-reader-backdrop" role="dialog" aria-modal="true" aria-label={\`阅读《\${readingBook.title}》\`}>\n          <article className="library-reader">\n            <header>\n              <div><small>ROYAL LIBRARY · 馆藏原文</small><h2>{readingBook.title}</h2><span>{readingBook.path}</span></div>\n              <button type="button" onClick={closeBook} aria-label="关闭阅读">×</button>\n            </header>\n            <div className="library-reader-paper">\n              {bookLoading ? <div className="reader-state">兔兔馆长正在从书架上取书……</div> : null}\n              {bookError ? <div className="reader-state is-error">{bookError}</div> : null}\n              {!bookLoading && !bookError ? <div className="markdown-book">{renderMarkdown(bookContent)}</div> : null}\n            </div>\n            <footer><button type="button" onClick={closeBook}>合上书册</button><a href={repoUrl(readingBook.path)} target="_blank" rel="noreferrer">进入编纂</a></footer>\n          </article>\n        </div>\n      ) : null}`,
);

replace(
  `<a href={rawUrl(selectedBook.path)} target="_blank" rel="noreferrer">阅读原文</a>`,
  `<button type="button" onClick={() => openBook(selectedBook)}>阅读原文</button>`,
);

styles += `

/* CRIMSON_LIBRARY_BOOK_READER_STYLES */
.library-reader-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:rgba(8,4,8,.78);backdrop-filter:blur(10px)}
.library-reader{display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:min(920px,100%);height:min(88vh,900px);overflow:hidden;border:1px solid rgba(214,177,109,.52);border-radius:22px;background:linear-gradient(145deg,#25130f,#10090a);box-shadow:0 30px 90px rgba(0,0,0,.7),inset 0 1px rgba(255,242,208,.08)}
.library-reader>header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 24px;border-bottom:1px solid rgba(214,177,109,.24);background:linear-gradient(180deg,rgba(72,37,27,.72),rgba(34,17,16,.64))}
.library-reader>header small,.library-reader>header h2,.library-reader>header span{display:block}.library-reader>header small{color:#c59675;font:11px Georgia,serif;letter-spacing:.2em}.library-reader>header h2{margin:5px 0;color:#f4dfb4;font-size:24px}.library-reader>header span{color:rgba(235,213,177,.5);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}.library-reader>header button{width:42px;height:42px;border:1px solid rgba(214,177,109,.38);border-radius:50%;background:rgba(255,255,255,.025);color:#e5c687;font-size:28px;cursor:pointer}
.library-reader-paper{overflow:auto;margin:18px;padding:clamp(24px,5vw,58px);color:#3c2d24;background:#eee2c8;background-image:linear-gradient(rgba(255,251,235,.5),rgba(255,251,235,.5)),repeating-linear-gradient(0deg,transparent 0 33px,rgba(105,78,48,.1) 33px 34px);box-shadow:inset 0 0 48px rgba(75,49,24,.16);scrollbar-color:#9a7447 transparent}
.markdown-book{width:min(720px,100%);margin:auto;font-family:"Songti SC","STSong","Noto Serif SC",serif;font-size:16px;line-height:2}.markdown-book h1{margin:0 0 28px;padding-bottom:16px;border-bottom:2px solid rgba(104,73,39,.32);font-size:34px;line-height:1.35}.markdown-book h2{margin:42px 0 16px;font-size:25px}.markdown-book h3{margin:30px 0 12px;font-size:20px}.markdown-book h4{margin:24px 0 10px;font-size:17px}.markdown-book p{margin:0 0 17px}.markdown-book ul,.markdown-book ol{margin:0 0 22px;padding-left:1.7em}.markdown-book li{margin:6px 0}.markdown-book blockquote{margin:24px 0;padding:14px 18px;border-left:4px solid #a57b43;background:rgba(151,111,62,.1);color:#654a31}.markdown-book hr{margin:38px auto;width:60%;border:0;border-top:1px solid rgba(92,62,34,.35)}
.reader-state{display:grid;min-height:280px;place-items:center;color:#735635;font-size:16px}.reader-state.is-error{color:#91474f}
.library-reader>footer{display:flex;justify-content:flex-end;gap:12px;padding:14px 22px;border-top:1px solid rgba(214,177,109,.2)}.library-reader>footer button,.library-reader>footer a,.book-actions button{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border:1px solid rgba(214,177,109,.42);border-radius:999px;background:linear-gradient(135deg,#76502d,#4a2d1c);color:#fff0cf;font:inherit;text-decoration:none;cursor:pointer}.library-reader>footer a{background:rgba(255,255,255,.025)}
@media(max-width:640px){.library-reader-backdrop{padding:0}.library-reader{width:100%;height:100%;border:0;border-radius:0}.library-reader>header{padding:16px}.library-reader>header h2{font-size:20px}.library-reader-paper{margin:0;padding:28px 20px}.markdown-book{font-size:16px;line-height:1.9}.markdown-book h1{font-size:28px}.markdown-book h2{font-size:22px}.library-reader>footer{padding:12px 16px calc(12px + env(safe-area-inset-bottom))}}
`;

fs.writeFileSync(componentPath, source);
fs.writeFileSync(stylePath, styles);
console.log("Applied styled in-app reader for Royal Library Markdown books.");
