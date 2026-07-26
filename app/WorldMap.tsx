"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { RoomIcon } from "./RoomIcon";
import { worldMapNodes, type WorldMapNode } from "./world-map-data";
import {
  isWorldNodeUnlocked,
  readWorldProgress,
  worldUnlockProgress,
  type WorldProgress,
} from "./world-progress";
import {
  getVisibleRooms,
  type RoomDefinition,
  type RoomId,
  type RoomStatus,
} from "./room-registry";
import "./world-map.css";

type WorldMapProps = {
  open: boolean;
  active: RoomId;
  onClose: () => void;
  onSelect: (room: RoomDefinition) => void;
};

const EMPTY_PROGRESS: WorldProgress = {
  cafeStories: 0,
  diaries: 0,
  timeRecords: 0,
  totalMemories: 0,
};

function isPlannedRoom(status: RoomStatus) {
  return status === "planned";
}

export function WorldMap({ open, active, onClose, onSelect }: WorldMapProps) {
  const rooms = getVisibleRooms();
  const roomById = useMemo(
    () => new Map<RoomId, RoomDefinition>(rooms.map((room) => [room.id, room] as const)),
    [rooms],
  );
  const [progress, setProgress] = useState<WorldProgress>(EMPTY_PROGRESS);
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    if (open) setProgress(readWorldProgress());
  }, [open]);

  function enterNode(node: WorldMapNode) {
    if (!node.roomId || entering) return;
    const room = roomById.get(node.roomId);
    if (!room || isPlannedRoom(room.status) || !isWorldNodeUnlocked(node, progress)) return;

    setEntering(node.id);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      onSelect(room);
      setEntering(null);
    }, reduceMotion ? 0 : 650);
  }

  return (
    <section
      className={`world-map-shell world-map-home ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      aria-label="绯界世界地图首页"
    >
      <div className="world-map-head">
        <div className="world-map-title">
          <p>CRIMSON WORLD ATLAS</p>
          <h1>绯界 · 世界卷轴</h1>
          <span>所有故事发生过的地方，都会在这里留下坐标。</span>
        </div>
        <button className="world-map-enter-current" type="button" onClick={onClose}>
          进入当前房间
        </button>
      </div>

      <div className="world-map-canvas" role="navigation" aria-label="绯界地点">
        <div className="world-map-moon" aria-hidden="true">☾</div>
        <svg className="world-map-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 47 C50 34 50 27 50 15" />
          <path d="M50 47 C39 46 31 46 22 46" />
          <path d="M50 47 C61 45 69 44 78 43" />
          <path d="M50 47 C61 57 67 64 72 72" />
          <path d="M50 47 C43 58 37 67 31 74" />
          <path d="M72 72 C80 76 86 81 91 86" />
        </svg>

        {worldMapNodes.map((node) => {
          const room = node.roomId ? roomById.get(node.roomId) : undefined;
          const planned = room ? isPlannedRoom(room.status) : false;
          const unlocked = isWorldNodeUnlocked(node, progress) && !planned;
          const unlockProgress = worldUnlockProgress(node, progress);
          const activeNode = node.roomId === active;
          const percentage = unlockProgress
            ? `${Math.round((unlockProgress.current / unlockProgress.target) * 100)}%`
            : "100%";
          const style = {
            left: `${node.position.x}%`,
            top: `${node.position.y}%`,
            "--unlock-percent": percentage,
          } as CSSProperties;

          return (
            <button
              className={`world-map-node ${room ? `theme-${room.theme}` : ""} is-${node.kind} ${activeNode ? "is-active" : ""} ${planned ? "is-planned" : ""} ${unlocked ? "" : "is-locked"} ${entering === node.id ? "is-entering" : ""}`}
              style={style}
              type="button"
              key={node.id}
              onClick={() => enterNode(node)}
              disabled={!node.roomId || !unlocked || Boolean(entering)}
              aria-label={`${node.name}，${unlocked ? node.subtitle : node.unlock?.label || "布置中"}`}
            >
              <span className="world-map-building">
                {node.roomId ? <RoomIcon roomId={node.roomId} /> : node.icon}
              </span>
              <span className="world-map-label">
                <strong>{unlocked ? node.name : "未知领域"}</strong>
                <em>{node.english}</em>
                <small>{unlocked ? node.subtitle : node.unlock?.label || "布置中"}</small>
                {unlockProgress ? (
                  <span className="world-map-progress" aria-label={`${unlockProgress.current}/${unlockProgress.target}`}>
                    <b>{unlockProgress.current}</b><i /><b>{unlockProgress.target}</b>
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <footer className="world-map-legend">
        <span><i className="is-ready" /> 已开放</span>
        <span><i className="is-planned" /> 等待探索</span>
        <strong>{progress.totalMemories} 条故事与记忆已点亮绯界</strong>
        <em>选择地点进入；现有房间始终保持开放</em>
      </footer>
    </section>
  );
}
