import { RANKS, rankAt } from "@/lib/kisses/ranks";
import { KissSkin } from "./kiss-skin";

export function Achievements({ sent, received }: { sent: number; received: number }) {
  const total = sent + received;
  const current = rankAt(total);
  const currentIndex = RANKS.findIndex((r) => r.id === current.id);
  const next = RANKS[currentIndex + 1] ?? null;

  // Progress to next rank
  const from = current.min;
  const to = next?.min ?? from;
  const span = Math.max(1, to - from);
  const pct = next ? Math.min(100, Math.round(((total - from) / span) * 100)) : 100;

  return (
    <div className="achievements">
      <p className="catch-pass-label">Achievements</p>

      {/* Current rank + progress to next */}
      <div className="ach-current">
        <div className="ach-current-row">
          <span className="ach-skin-badge">
            <KissSkin skin={current.skin} className="ach-skin-icon" />
          </span>
          <div className="ach-current-info">
            <span className="ach-current-name">{current.name}</span>
            {next ? (
              <span className="ach-next-label">
                {total} / {next.min} to {next.name}
              </span>
            ) : (
              <span className="ach-next-label">Max rank!</span>
            )}
          </div>
        </div>
        <div className="ach-progress-track">
          <div className="ach-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Rank ladder */}
      <ul className="ach-ladder">
        {RANKS.map((r, i) => {
          const unlocked = total >= r.min;
          const isCurrent = r.id === current.id;
          const prevMin = i > 0 ? RANKS[i - 1]!.min : 0;
          return (
            <li
              key={r.id}
              className={`ach-rank ${unlocked ? "is-unlocked" : "is-locked"} ${isCurrent ? "is-current" : ""}`}
            >
              <span className={`ach-rank-skin skin-${r.skin}`}>
                <KissSkin skin={r.skin} className="ach-rank-icon" />
              </span>
              <span className="ach-rank-name">{r.name}</span>
              <span className="ach-rank-threshold">
                {unlocked ? "✓" : `${r.min}`}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Quick stats */}
      <div className="ach-stats">
        <div className="ach-stat">
          <span className="ach-stat-num">{sent}</span>
          <span className="ach-stat-label">Sent</span>
        </div>
        <div className="ach-stat-sep" />
        <div className="ach-stat">
          <span className="ach-stat-num">{received}</span>
          <span className="ach-stat-label">Caught</span>
        </div>
        <div className="ach-stat-sep" />
        <div className="ach-stat">
          <span className="ach-stat-num">{total}</span>
          <span className="ach-stat-label">Total</span>
        </div>
      </div>
    </div>
  );
}
