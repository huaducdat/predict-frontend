import { useState } from "react";
import { vi } from "../i18n/vi";

function normalizeNumberRows(value) {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object")
    : [];
}

function formatNumber(n) {
  const value = Number(n);
  return Number.isFinite(value) ? String(value).padStart(2, "0") : "--";
}

function formatScore(score) {
  const value = Number(score);
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function PositionCard({ data }) {
  const safeData = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const WINDOW_SIZE = 10;

  const formatGroup = (g) => {
    const start = g * 10;
    const end = start + 9;
    return `${start.toString().padStart(2, "0")}-${end
      .toString()
      .padStart(2, "0")}`;
  };

  const context = normalizeNumberRows(safeData["-1"]);
  const global = Object.entries(safeData)
    .filter(([k]) => k !== "-1")
    .map(([group, numbers]) => [group, normalizeNumberRows(numbers)])
    .filter(([, numbers]) => numbers.length > 0);

  return (
    <div style={{ marginBottom: 30 }}>
      <h3>{vi.predictor.POS}</h3>

      {context.length > 0 && (
        <ContextRow numbers={context} windowSize={WINDOW_SIZE} />
      )}

      {global.length === 0 && context.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13 }}>
          {vi.common.noData || "Chua co du lieu"}
        </div>
      ) : (
        global.map(([group, numbers]) => (
          <GroupRow
            key={group}
            group={Number(group)}
            numbers={numbers}
            formatGroup={formatGroup}
            windowSize={WINDOW_SIZE}
          />
        ))
      )}
    </div>
  );
}

export default PositionCard;

function ContextRow({ numbers, windowSize }) {
  const [start, setStart] = useState(0);

  const end = start + windowSize;
  const visible = numbers.slice(start, end);

  return (
    <div style={{ marginBottom: 20 }}>
      <b style={{ color: "#00e0ff" }}>{vi.context.today}</b>

      <div style={{ margin: "6px 0" }}>
        <button
          onClick={() => setStart(Math.max(0, start - windowSize))}
          disabled={start === 0}
        >
          &lt;
        </button>

        <span style={{ margin: "0 10px" }}>
          {start} - {Math.min(end, numbers.length)}
        </span>

        <button
          onClick={() =>
            setStart(end >= numbers.length ? start : start + windowSize)
          }
          disabled={end >= numbers.length}
        >
          &gt;
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map((n, index) => {
          const globalIndex = start + index;

          let bg = "#333";

          if (globalIndex < 3) bg = "#ff4d4f";
          else if (globalIndex < 10) bg = "#faad14";

          return (
            <div
              key={`${n.number ?? "unknown"}-${globalIndex}`}
              style={{
                width: 55,
                padding: 6,
                borderRadius: 6,
                background: bg,
                color: "white",
                textAlign: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              <div>{formatNumber(n.number)}</div>

              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {formatScore(n.score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupRow({ group, numbers, formatGroup, windowSize }) {
  const [start, setStart] = useState(0);

  const end = start + windowSize;
  const visible = numbers.slice(start, end);

  return (
    <div style={{ marginBottom: 15 }}>
      <b>{formatGroup(group)}</b>

      <div style={{ margin: "6px 0" }}>
        <button
          onClick={() => setStart(Math.max(0, start - windowSize))}
          disabled={start === 0}
        >
          &lt;
        </button>

        <span style={{ margin: "0 10px" }}>
          {start} - {Math.min(end, numbers.length)}
        </span>

        <button
          onClick={() =>
            setStart(end >= numbers.length ? start : start + windowSize)
          }
          disabled={end >= numbers.length}
        >
          &gt;
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map((n, index) => {
          const globalIndex = start + index;

          let bg = "#222";

          if (globalIndex < 3) bg = "#ff4d4f";
          else if (globalIndex < 9) bg = "#faad14";

          return (
            <div
              key={`${n.number ?? "unknown"}-${globalIndex}`}
              style={{
                width: 50,
                padding: 6,
                borderRadius: 6,
                background: bg,
                color: "white",
                textAlign: "center",
                fontSize: 12,
              }}
            >
              <div>{formatNumber(n.number)}</div>

              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {formatScore(n.score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
