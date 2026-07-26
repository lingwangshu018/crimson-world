"use client";

import { useEffect, useState } from "react";
import { CloudCellar } from "./CloudCellar";
import { RoomIcon } from "./RoomIcon";
import { WorldMap } from "./WorldMap";
import { WorldRoomOutlet } from "./WorldRoomOutlet";
import { roomRegistry, type RoomDefinition, type RoomId } from "./room-registry";
import "./world-nav.css";
import "./gpt-mobile-nav.css";

const sidebarNames: Record<RoomId, string> = {
  tavern: "酒馆",
  cafe: "咖啡馆",
  journal: "日记本",
  wheel: "时光之轮",
  study: "自习室",
};

export function WorldNav() {
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [active, setActive] = useState<RoomId>("tavern");
  const [previousActive, setPreviousActive] = useState<RoomId | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mapOpen]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");
    if (!shell) return;

    shell.dataset.activeRoom = active;
    const worldSelectors = [
      ".world-trigger",
      ".world-backdrop",
      ".world-drawer",
      ".world-map-shell",
      ".world-active-room",
      ".cellar-orb",
      ".assistive-scrim",
      ".assistive-cloud-menu",
      ".cellar-backdrop",
    ].join(",");

    Array.from(shell.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      const belongsToWorldNavigation = child.matches(worldSelectors);
      child.hidden = active === "tavern" ? child.classList.contains("world-active-room") : !belongsToWorldNavigation;
    });

    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      delete shell.dataset.activeRoom;
      Array.from(shell.children).forEach((child) => {
        if (child instanceof HTMLElement) child.hidden = false;
      });
    };
  }, [active]);

  function selectSpace(space: RoomDefinition) {
    if (space.id !== active) setPreviousActive(active);
    setActive(space.id);
    setOpen(false);
    setMapOpen(false);
  }

  const openMap = () => {
    setOpen(false);
    setMapOpen(true);
  };

  return (
    <>
      <CloudCellar />
      <button className="world-trigger" type="button" aria-label="打开绯界侧边栏" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true" />
      </button>
      <button className={`world-backdrop ${open ? "is-open" : ""}`} type="button" aria-label="关闭绯界导航" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside className={`world-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="world-drawer-head"><div><p>CRIMSON WORLD</p><h2>绯界</h2></div></header>
        <button className="world-map-entry" type="button" onClick={openMap}><span aria-hidden="true">⌖</span><strong>世界地图</strong><small>WORLD ATLAS</small><em>→</em></button>
        <nav className="world-space-list" aria-label="绯界房间">
          {roomRegistry.map((space, index) => (
            <button className={active === space.id ? "is-active" : ""} type="button" key={space.id} onClick={() => selectSpace(space)}>
              <span className="world-space-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="world-space-icon"><RoomIcon roomId={space.id} variant="sidebar" /></span>
              <span className="world-space-copy"><strong>{sidebarNames[space.id]}</strong><small>{space.english}</small><em>{space.description}</em></span>
            </button>
          ))}
        </nav>
      </aside>
      <WorldMap open={mapOpen} active={active} onClose={() => setMapOpen(false)} onSelect={selectSpace} onOpenCloud={() => {}} />
      <div className="world-active-room"><WorldRoomOutlet active={active} onClose={() => setPreviousActive(null)} /></div>
    </>
  );
}
