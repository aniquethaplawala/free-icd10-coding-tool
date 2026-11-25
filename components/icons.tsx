type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowUp = (p: P) => (
  <svg {...base} {...p}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="m5 12 5 5 9-10" /></svg>
);
export const LockIcon = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z" /></svg>
);
export const ListCheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="M10 6h10M10 12h10M10 18h10" /><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /></svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>
);
export const ResetIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
);
export const NoteMark = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="3" y="2" width="18" height="20" rx="4" fill="#27251e" />
    <path d="M7.5 8h9M7.5 12h9M7.5 16h4.5" stroke="#faf8f5" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="16.5" cy="16" r="1.6" fill="#016a71" />
  </svg>
);
