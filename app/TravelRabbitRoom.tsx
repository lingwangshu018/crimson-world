import React from 'react';

export default function TravelRabbitRoom() {
  return (
    <div className="travel-rabbit-room">
      <section className="travel-header">
        <h1>🐰 小兔旅行</h1>
        <p>带着小兔出发，记录每一次相遇与收获。</p>
      </section>

      <section className="travel-result-card">
        <h2>今日旅行结果</h2>
        <div className="travel-empty-state">
          <span>🌙</span>
          <p>今天还没有旅行记录。</p>
        </div>
      </section>

      <section className="rabbit-gifts-card">
        <h2>小兔带回来的东西</h2>
        <p>旅行收获会显示在这里。</p>
      </section>

      <section className="letter-actions">
        <button type="button">📨 发送信件</button>
        <button type="button">📩 收取新信</button>
      </section>

      <section className="travel-history-card">
        <h2>旅行历史</h2>
        <p>历史旅行记录将在这里保存。</p>
      </section>

      <section className="travel-data-actions">
        <button type="button">导入记录</button>
        <button type="button">导出记录</button>
      </section>
    </div>
  );
}
