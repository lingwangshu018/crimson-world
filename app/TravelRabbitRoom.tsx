"use client";

import { useState } from "react";
import { createTravelRecord, readTravelRecords } from "./travel-rabbit/travel-storage";
import { startTravel } from "./travel-rabbit/travel-engine";

export default function TravelRabbitRoom({ onClose }: { onClose?: () => void }) {
  const [record, setRecord] = useState(() => readTravelRecords()[0] ?? null);
  const [history, setHistory] = useState(() => readTravelRecords());

  function beginTravel() {
    const result = startTravel();
    createTravelRecord(result);
    setRecord(result);
    setHistory(readTravelRecords());
  }

  return (
    <div className="travel-rabbit-room">
      <section className="travel-header">
        <h1>🐰 小兔旅行</h1>
        <p>带着好奇出发，把远方的故事带回来。</p>
        <button type="button" onClick={beginTravel}>🚪 开始旅行</button>
      </section>

      <section className="travel-result-card">
        <h2>今日旅行结果</h2>
        {record ? (
          <div>
            <p>目的地：{record.continent} · {record.city}</p>
            <p>地点：{record.location}</p>
            <p>遇见：{record.encounter.join("、")}</p>
            <p>发现：{record.discoveries.join("、")}</p>
            <p>带回：{record.souvenirs.join("、")}</p>
            <p>品尝：{record.food.join("、")}</p>
          </div>
        ) : (
          <p>今天还没有旅行记录。</p>
        )}
      </section>

      <section className="rabbit-gifts-card">
        <h2>小兔带回来的东西</h2>
        <p>{record?.souvenirs.join("、") ?? "旅行收获会显示在这里。"}</p>
      </section>

      <section className="letter-actions">
        <button type="button">📨 发送信件</button>
        <button type="button">📩 收取新信</button>
      </section>

      <section className="travel-history-card">
        <h2>旅行历史</h2>
        {history.length ? history.map((item) => (
          <p key={item.id}>{item.city} · {item.location}</p>
        )) : <p>还没有历史旅行。</p>}
      </section>

      <section className="travel-data-actions">
        <button type="button">导入记录</button>
        <button type="button">导出记录</button>
      </section>

      {onClose ? <button type="button" onClick={onClose}>返回绯界</button> : null}
    </div>
  );
}
