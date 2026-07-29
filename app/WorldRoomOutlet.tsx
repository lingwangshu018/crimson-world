"use client";

import { useEffect, type ComponentType } from "react";
import CafeRoom from "./CafeRoom";
import { JournalRoom } from "./JournalRoom";
import {
  appendRoyalLibraryContext,
  installRoyalLibraryClipboardBridge,
} from "./royal-library-context";
import { StudyRoom } from "./StudyRoom";
import { TimeWheelRoom } from "./TimeWheelRoom";
import TravelRabbitRoom from "./TravelRabbitRoom";
import { getRoom, type RoomId, type RoomRenderer } from "./room-registry";

type RoomComponentProps = {
  onClose: () => void;
};

type BridgedClipboard = Clipboard & {
  __crimsonRoyalLibraryFrameBridge?: boolean;
};

const roomRenderers: Partial<Record<RoomRenderer, ComponentType<RoomComponentProps>>> = {
  cafe: CafeRoom,
  journal: JournalRoom,
  wheel: TimeWheelRoom,
  study: StudyRoom,
  "travel-rabbit": TravelRabbitRoom,
};

type WorldRoomOutletProps = {
  active: RoomId;
  onClose: () => void;
};

function installIframeRoyalLibraryBridge(frame: HTMLIFrameElement) {
  try {
    const clipboard = frame.contentWindow?.navigator.clipboard as BridgedClipboard | undefined;
    if (!clipboard?.writeText || clipboard.__crimsonRoyalLibraryFrameBridge) return;

    const originalWriteText = clipboard.writeText.bind(clipboard);
    clipboard.writeText = (text: string) =>
      originalWriteText(appendRoyalLibraryContext(text));
    clipboard.__crimsonRoyalLibraryFrameBridge = true;
  } catch {
    // Cross-origin or sandboxed frames cannot be patched from the parent page.
  }
}

export function WorldRoomOutlet({ active, onClose }: WorldRoomOutletProps) {
  useEffect(() => {
    installRoyalLibraryClipboardBridge();

    const cleanups = new Map<HTMLIFrameElement, () => void>();
    const attachFrame = (frame: HTMLIFrameElement) => {
      if (cleanups.has(frame)) return;

      const handleLoad = () => installIframeRoyalLibraryBridge(frame);
      frame.addEventListener("load", handleLoad);
      cleanups.set(frame, () => frame.removeEventListener("load", handleLoad));
      installIframeRoyalLibraryBridge(frame);
    };

    const scanFrames = (root: ParentNode) => {
      root.querySelectorAll<HTMLIFrameElement>("iframe").forEach(attachFrame);
    };

    scanFrames(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLIFrameElement) attachFrame(node);
          scanFrames(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  const room = getRoom(active);

  if (room.renderer === "native") return null;

  const RoomComponent = roomRenderers[room.renderer];
  if (RoomComponent) return <RoomComponent onClose={onClose} />;

  return (
    <section
      className={`world-room-preview room-${active}`}
      data-room-theme={room.theme}
      data-room-status={room.status}
      aria-live="polite"
    >
      <div className="world-room-card">
        <span className="world-room-seal">{room.icon}</span>
        <p>{room.english}</p>
        <h1>{room.name}</h1>
        <div className="world-room-rule" />
        <p className="world-room-description">{room.description}</p>
        <span className="world-room-status">房间正在布置中</span>
        <button type="button" onClick={onClose}>返回绯夜酒馆</button>
      </div>
    </section>
  );
}
