import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./rabbit-rig.css";

type Layer = {
  id: string;
  label: string;
  file: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  z: number;
  hidden?: boolean;
  src?: string;
};

const ASSET_BASE = `${import.meta.env.BASE_URL}assets/library/rabbit/`;

const initialLayers: Layer[] = [
  { id: "ear-left", label: "左耳", file: "ear-left.webp", x: 180, y: 36, scale: .48, rotate: -5, z: 1 },
  { id: "ear-right", label: "右耳", file: "ear-right.webp", x: 360, y: 42, scale: .48, rotate: 5, z: 1 },
  { id: "body", label: "身体", file: "body.webp", x: 250, y: 165, scale: .78, rotate: 0, z: 2 },
  { id: "cape", label: "披风", file: "cape.webp", x: 94, y: 300, scale: .78, rotate: 0, z: 3 },
  { id: "bow", label: "蝴蝶结", file: "bow.webp", x: 235, y: 330, scale: .38, rotate: 0, z: 4 },
  { id: "eyes-open", label: "睁眼", file: "eyes-open.webp", x: 245, y: 258, scale: .37, rotate: 0, z: 5 },
  { id: "eyes-closed", label: "闭眼", file: "eyes-closed.webp", x: 240, y: 278, scale: .37, rotate: 0, z: 6, hidden: true },
  { id: "monocle", label: "单边眼镜", file: "monocle.webp", x: 388, y: 240, scale: .23, rotate: 0, z: 7 },
  { id: "hat", label: "小礼帽", file: "hat.webp", x: 330, y: 120, scale: .42, rotate: -8, z: 8 },
  { id: "book", label: "编年史", file: "book.webp", x: 125, y: 475, scale: .46, rotate: -8, z: 9 },
  { id: "watch", label: "怀表", file: "watch.webp", x: 370, y: 475, scale: .34, rotate: 0, z: 10 },
];

function App() {
  const [layers, setLayers] = useState(initialLayers);
  const [selected, setSelected] = useState("body");
  const [animate, setAnimate] = useState(true);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const current = useMemo(() => layers.find((item) => item.id === selected) ?? layers[0], [layers, selected]);

  function patch(id: string, values: Partial<Layer>) {
    setLayers((items) => items.map((item) => item.id === id ? { ...item, ...values } : item));
  }

  function loadLocal(files: FileList | null) {
    if (!files) return;
    const byName = new Map(Array.from(files).map((file) => [file.name, URL.createObjectURL(file)]));
    setLayers((items) => items.map((item) => ({ ...item, src: byName.get(item.file) ?? item.src })));
  }

  function exportConfig() {
    const clean = layers.map(({ src: _src, label: _label, ...item }) => item);
    const blob = new Blob([JSON.stringify({ canvas: { width: 720, height: 900 }, layers: clean }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rabbit-rig.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <main className="rig-page">
    <header>
      <div><p>CRIMSON WORLD · ROYAL LIBRARY</p><h1>兔兔馆长动画校准台</h1><span>载入拆件、拖动对齐，再预览呼吸、眨眼、耳朵与怀表待机动作。</span></div>
      <a href={`${import.meta.env.BASE_URL}library.html`}>返回图书馆</a>
    </header>

    <section className="workspace">
      <aside className="panel layers-panel">
        <label className="upload">载入本地拆件<input type="file" multiple accept="image/webp,image/png" onChange={(event) => loadLocal(event.target.files)} /></label>
        <button onClick={() => setAnimate((value) => !value)}>{animate ? "暂停待机动画" : "播放待机动画"}</button>
        <button onClick={exportConfig}>导出坐标 JSON</button>
        <h2>图层</h2>
        <div className="layer-list">{[...layers].sort((a,b) => b.z-a.z).map((layer) => <button key={layer.id} className={selected === layer.id ? "active" : ""} onClick={() => setSelected(layer.id)}><span>{layer.label}</span><small>{layer.file}</small></button>)}</div>
      </aside>

      <div className={`stage-wrap ${animate ? "is-animated" : ""}`}>
        <div className="stage" onPointerMove={(event) => {
          if (!drag.current) return;
          const rect = event.currentTarget.getBoundingClientRect();
          patch(drag.current.id, { x: event.clientX - rect.left - drag.current.dx, y: event.clientY - rect.top - drag.current.dy });
        }} onPointerUp={() => drag.current = null} onPointerLeave={() => drag.current = null}>
          <div className="guide vertical" /><div className="guide horizontal" />
          {layers.map((layer) => <img
            key={layer.id}
            className={`rig-layer layer-${layer.id} ${selected === layer.id ? "selected" : ""}`}
            src={layer.src ?? `${ASSET_BASE}${layer.file}`}
            alt={layer.label}
            draggable={false}
            hidden={layer.hidden}
            style={{ left: layer.x, top: layer.y, zIndex: layer.z, transform: `rotate(${layer.rotate}deg) scale(${layer.scale})`, transformOrigin: layer.id.includes("ear") ? "50% 92%" : layer.id === "watch" ? "50% 8%" : "50% 50%" }}
            onError={(event) => event.currentTarget.classList.add("missing")}
            onPointerDown={(event) => {
              event.preventDefault();
              setSelected(layer.id);
              const rect = event.currentTarget.parentElement!.getBoundingClientRect();
              drag.current = { id: layer.id, dx: event.clientX - rect.left - layer.x, dy: event.clientY - rect.top - layer.y };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          />)}
          <div className="missing-note">图片未上传到仓库时，请先点“载入本地拆件”。</div>
        </div>
      </div>

      <aside className="panel controls-panel">
        <p>正在调整</p><h2>{current.label}</h2>
        {(["x", "y", "scale", "rotate", "z"] as const).map((key) => <label key={key}><span>{key}</span><input type="number" step={key === "scale" ? .01 : 1} value={current[key]} onChange={(event) => patch(current.id, { [key]: Number(event.target.value) })} /></label>)}
        <label className="visibility"><input type="checkbox" checked={!current.hidden} onChange={(event) => patch(current.id, { hidden: !event.target.checked })} />显示图层</label>
        <button onClick={() => setLayers(initialLayers)}>恢复初始坐标</button>
        <div className="tips"><strong>操作方法</strong><p>直接拖动图层；右侧精调数值。眼睛闭合图层默认隐藏，播放待机动画时会自动闪现。</p></div>
      </aside>
    </section>
  </main>;
}

const root = document.getElementById("rabbit-rig-root");
if (!root) throw new Error("Missing rabbit rig root");
createRoot(root).render(<StrictMode><App /></StrictMode>);
