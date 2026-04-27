import { useState } from "react";

function PositionCard({ data }) {
  if (!data) return null;

  const WINDOW_SIZE = 10;

  const formatGroup = (g) => {
    const start = g * 10;
    const end = start + 9;
    return `${start.toString().padStart(2, "0")}-${end
      .toString()
      .padStart(2, "0")}`;
  };

  const context = data["-1"];
  const global = Object.entries(data).filter(([k]) => k !== "-1");

  return (
    <div style={{ marginBottom: 30 }}>
      <h3>POSITION</h3>

      {/* 🔥 CONTEXT */}
      {context && (
        <ContextRow numbers={context} windowSize={WINDOW_SIZE} />
      )}

      {/* 🔹 GLOBAL */}
      {global.map(([group, numbers]) => (
        <GroupRow
          key={group}
          group={Number(group)}
          numbers={numbers}
          formatGroup={formatGroup}
          windowSize={WINDOW_SIZE}
        />
      ))}
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
      <b style={{ color: "#00e0ff" }}>🔥 TODAY CONTEXT</b>

      <div style={{ margin: "6px 0" }}>
        <button
          onClick={() => setStart(Math.max(0, start - windowSize))}
          disabled={start === 0}
        >
          ◀
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
          ▶
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map((n, index) => {
          const globalIndex = start + index;

          let bg = "#333";

          if (globalIndex < 3) bg = "#ff4d4f";      // 🔴 top 3
          else if (globalIndex < 10) bg = "#faad14"; // 🟡 top 10

          return (
            <div
              key={n.number}
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
              <div>{n.number.toString().padStart(2, "0")}</div>

              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {n.score.toFixed(2)}
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
          ◀
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
          ▶
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
              key={n.number}
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
              <div>{n.number.toString().padStart(2, "0")}</div>

              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {n.score.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}