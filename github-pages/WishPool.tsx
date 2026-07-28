import { FormEvent, useEffect, useMemo, useState } from "react";

type Wish = {
  id: string;
  type: string;
  title: string;
  content: string;
  authorName: string;
  status: string;
  lights: number;
  createdAt: string;
};

const OFFICIAL_WISH_API = "https://crimson-world.lingwangshu018.workers.dev/api/wishes";
const types = { bug: "🐞 问题反馈", feature: "✨ 功能愿望", world: "🏰 世界提案", note: "💌 自由留言" } as const;
const statuses: Record<string, string> = { waiting: "等待回应", seen: "已看见", considering: "考虑中", building: "制作中", done: "已经实现", declined: "暂不计划" };

export function WishPool() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<keyof typeof types>("feature");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");

  const visitorId = useMemo(() => {
    const key = "crimson-world.wish-visitor.v1";
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value;
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(OFFICIAL_WISH_API);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "许愿池暂时没有回应。");
      setWishes(Array.isArray(data.wishes) ? data.wishes : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "许愿池暂时没有回应。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(OFFICIAL_WISH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
      body: JSON.stringify({ type, title, content, authorName: name || "匿名旅人" }),
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || "愿望没有投进去。");
      return;
    }
    setTitle("");
    setContent("");
    setName("");
    setOpen(false);
    await load();
  }

  async function light(id: string) {
    const response = await fetch(OFFICIAL_WISH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
      body: JSON.stringify({ action: "light", wishId: id }),
    });
    const data = await response.json();
    if (response.ok) setWishes((items) => items.map((item) => item.id === id ? { ...item, lights: Number(data.lights || item.lights) } : item));
  }

  return (
    <section className="wish-pool">
      <div className="wish-pool-hero">
        <div><span>OFFICIAL COMMUNITY</span><h2>许愿池</h2><p>这里连接绯界官方云端，不会跟随访客的私人云端设置改变。</p></div>
        <button type="button" onClick={() => setOpen(true)}>＋ 投下愿望</button>
      </div>
      <div className="wish-filter"><b>全部愿望</b><span>{wishes.length} 枚愿望正在发光</span></div>
      {loading ? <div className="wish-state">兔兔正在捞取愿望……</div> : null}
      {error ? <div className="wish-state error">{error}<button onClick={load}>重新查看</button></div> : null}
      <div className="wish-list">
        {wishes.map((wish) => (
          <article className="wish-card" key={wish.id}>
            <header><span>{types[wish.type as keyof typeof types] || types.note}</span><em>{statuses[wish.status] || wish.status}</em></header>
            <h3>{wish.title}</h3><p>{wish.content}</p>
            <footer><small>{wish.authorName || "匿名旅人"} · {new Date(wish.createdAt).toLocaleString("zh-CN")}</small><button type="button" onClick={() => light(wish.id)}>✦ 点亮 {wish.lights}</button></footer>
          </article>
        ))}
      </div>
      {!loading && !error && !wishes.length ? <div className="wish-state">池水还很安静，来投下第一枚愿望吧。</div> : null}
      {open ? (
        <div className="wish-compose-backdrop" onClick={() => setOpen(false)}>
          <form className="wish-compose" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <header><div><small>TO THE CREATOR</small><h3>投下愿望</h3></div><button type="button" onClick={() => setOpen(false)}>×</button></header>
            <label>愿望类型<select value={type} onChange={(event) => setType(event.target.value as keyof typeof types)}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>标题<input value={title} maxLength={80} required onChange={(event) => setTitle(event.target.value)} placeholder="一句话说说你的愿望" /></label>
            <label>正文<textarea value={content} maxLength={1500} required onChange={(event) => setContent(event.target.value)} placeholder="把问题、想法或建议详细写下来……" /></label>
            <label>署名（可选）<input value={name} maxLength={30} onChange={(event) => setName(event.target.value)} placeholder="匿名旅人" /></label>
            <button className="submit-wish" type="submit">让愿望落入池中</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
