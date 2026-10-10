// Pixlume brand primitives: the logo mark, the faceted "crystal" backdrop used
// on gradient surfaces, and the ring / bar meters for usage + progress.

// White "P" whose bowl breaks into stepped pixels, plus a small sparkle — the
// same mark as the app icon. Rendered on a gradient tile unless `bare`.
export function LogoMark({ size = 32, bare = false }) {
  return (
    <span
      className={`lm-logo${bare ? " lm-logo--bare" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <path
          d="M20 50V14h14a12 12 0 0 1 0 24h-6"
          fill="none"
          stroke="#fff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="22" y="40" width="5" height="5" rx="1.2" fill="#fff" />
        <rect x="28" y="44" width="4" height="4" rx="1" fill="#fff" opacity="0.85" />
        <rect x="33" y="47" width="3" height="3" rx="0.8" fill="#fff" opacity="0.65" />
        <path d="M49 8l1.6 4.4L55 14l-4.4 1.6L49 20l-1.6-4.4L43 14l4.4-1.6z" fill="#fff" />
      </svg>
    </span>
  );
}

// Fixed polygon set (no randomness, so server and client render identically).
// Light shards catch the "light", dark shards add depth.
const FACETS = [
  { p: "0,0 520,0 300,360", t: "l", o: 0.07 },
  { p: "300,360 520,0 760,420", t: "d", o: 0.1 },
  { p: "760,420 520,0 1100,0", t: "l", o: 0.05 },
  { p: "1100,0 1600,0 1600,380 1240,300", t: "l", o: 0.09 },
  { p: "1240,300 1600,380 1380,760", t: "d", o: 0.12 },
  { p: "0,520 300,360 420,900 0,900", t: "d", o: 0.1 },
  { p: "300,360 760,420 420,900", t: "l", o: 0.05 },
  { p: "760,420 1240,300 1100,900 420,900", t: "d", o: 0.06 },
  { p: "1100,900 1380,760 1600,900", t: "l", o: 0.08 },
];

export function Facets() {
  return (
    <svg
      className="lm-facets"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {FACETS.map((f, i) => (
        <polygon key={i} points={f.p} fill={f.t === "l" ? "#fff" : "#1E0A7A"} opacity={f.o} />
      ))}
    </svg>
  );
}

// Circular gauge. `onDark` renders white strokes for gradient surfaces.
export function Ring({ pct = 0, size = 128, onDark = false, label, children }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`lm-ring${onDark ? " lm-ring--dark" : ""}${v >= 100 ? " is-full" : ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label || `${Math.round(v)}%`}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle className="lm-ring-track" cx="60" cy="60" r={r} />
        <circle
          className="lm-ring-value"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
        />
      </svg>
      <div className="lm-ring-center">{children}</div>
    </div>
  );
}

// Slim horizontal meter. `alertWhenFull` turns it red at 100% (for quotas;
// a finished progress bar should stay on-brand).
export function Meter({ pct = 0, onDark = false, alertWhenFull = false, label }) {
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`lm-meter${onDark ? " lm-meter--dark" : ""}${alertWhenFull && v >= 100 ? " is-full" : ""}`}
      role="img"
      aria-label={label || `${Math.round(v)}%`}
    >
      <i style={{ width: `${v}%` }} />
    </div>
  );
}
