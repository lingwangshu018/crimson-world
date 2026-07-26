import { spawnSync } from "node:child_process";

const patches = [
  { file: "apply-v2-card-system.mjs", label: "card system" },
  { file: "apply-menu-studio.mjs", label: "menu studio" },
  { file: "apply-opening-scene.mjs", label: "opening scene" },
  { file: "apply-opening-preference.mjs", label: "opening preference" },
  { file: "apply-world-nav.mjs", label: "world navigation" },
  { file: "apply-layered-tavern-art.mjs", label: "layered tavern artwork" },
  { file: "apply-journal-ai-mailbox.mjs", label: "journal mailbox" },
  { file: "apply-journal-sync-metadata.mjs", label: "journal sync metadata" },
  { file: "apply-journal-paper-polish.mjs", label: "journal paper theme" },
  { file: "apply-journal-line-alignment.mjs", label: "journal ruled-line alignment" },
  { file: "apply-journal-pin-favorite.mjs", label: "journal pin and favorite" },
  { file: "apply-cloud-orb-top-layer.mjs", label: "cloud orb layer" },
  { file: "apply-cloud-journal-archive.mjs", label: "cloud journal archive" },
  { file: "apply-unified-cloud-archive.mjs", label: "unified cloud archive" },
  { file: "apply-assistive-cloud-menu.mjs", label: "cloud assistive menu" },
  // This is a compatibility polish. A changed selector must not block every room build.
  { file: "apply-static-world-trigger.mjs", label: "static world trigger", optional: true },
  { file: "apply-time-wheel-ai-tools.mjs", label: "time wheel AI read reply and locate" },
  { file: "apply-time-wheel-room.mjs", label: "time wheel room" },
  { file: "apply-local-backup-tools.mjs", label: "journal and time wheel backups" },
  { file: "apply-unified-vault-keys.mjs", label: "shared vault API and keys" },
  { file: "apply-cloudflare-owned-vault.mjs", label: "configurable cloud routing" },
  { file: "apply-cloud-key-center.mjs", label: "three-key cloud identity center" },
  { file: "apply-unified-module-cloud-status.mjs", label: "unified module cloud status and key migration" },
  { file: "apply-time-wheel-history-layout-fix.mjs", label: "time wheel mobile history layout" },
  { file: "apply-time-wheel-confirm-only.mjs", label: "time wheel simple confirmation" },
  { file: "apply-unified-ai-task-instructions.mjs", label: "unified AI task instructions" },
  { file: "apply-time-wheel-local-ai-send.mjs", label: "time wheel local AI sending" },
  { file: "apply-journal-local-ai-send.mjs", label: "journal local AI sending" },
  { file: "apply-journal-reply-collection.mjs", label: "journal reply collection" },
  { file: "apply-tavern-ai-workflow.mjs", label: "tavern AI sending and note collection" },
  { file: "apply-tavern-numbered-ai-send.mjs", label: "numbered tavern direct AI sending" },
  { file: "apply-tavern-unified-record-sync.mjs", label: "tavern unified record sync" },
  { file: "apply-direct-reply-collection.mjs", label: "direct tavern and time wheel reply collection" },
  { file: "apply-time-wheel-html-ai-workflow.mjs", label: "time wheel HTML template AI workflow" },
  { file: "apply-time-wheel-html-write-guard.mjs", label: "time wheel HTML reply validation" },
  { file: "apply-cafe-room.mjs", label: "standalone Crimson Cafe room" },
  { file: "apply-study-room.mjs", label: "study rooms" },
];

console.log("\nCrimson World UI patch pipeline\n");

for (const patch of patches) {
  const result = spawnSync(process.execPath, [`scripts/${patch.file}`], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status === 0) {
    console.log(`✓ ${patch.label}`);
    continue;
  }

  if (patch.optional) {
    console.warn(`⚠ Skipped optional patch: ${patch.label}`);
    continue;
  }

  console.error(`✗ Required patch failed: ${patch.label}`);
  process.exit(result.status || 1);
}

console.log("\n✓ Crimson World UI patches complete.\n");