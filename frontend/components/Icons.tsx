type P = { size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function Logo({ size = 28, color = "var(--accent)" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="7" fill="none" stroke={color} strokeWidth="2" />
      <path d="M8 19 L14 8 L20 19 M10.5 15 H17.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const ChatIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
);
export const DocIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
);
export const UsersIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" /></svg>
);
export const ShieldIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
);
export const LockIcon = ({ size = 14 }: P) => (
  <svg {...base(size)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const CheckIcon = ({ size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M5 12l5 5L20 7" /></svg>
);
export const ListIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const BuildingIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" /></svg>
);
