const common = {
  viewBox: "0 0 48 48",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function CrimsonCoreIcon() {
  return (
    <svg {...common}>
      <circle cx="24" cy="24" r="16" opacity="0.7" />
      <ellipse cx="24" cy="24" rx="21" ry="9" transform="rotate(-25 24 24)" opacity="0.75" />
      <path d="M24 10L35 24L24 38L13 24Z" />
      <path d="M24 16L30 24L24 32L18 24Z" />
      <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
      <path d="M24 4v4M24 40v4M4 24h4M40 24h4" />
    </svg>
  );
}
