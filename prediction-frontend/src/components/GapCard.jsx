import { vi } from "../i18n/vi";

function GapCard({ data }) {
  const list = Array.isArray(data?.["-1"])
    ? data["-1"].filter((item) => item && typeof item === "object")
    : [];

  const formatScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? value.toFixed(3) : "--";
  };

  const formatNumber = (n) => {
    const value = Number(n);
    return Number.isFinite(value) ? String(value).padStart(2, "0") : "--";
  };

  return (
    <div>
      <h3>{vi.predictor.GAP}</h3>
      <div style={{ color: "#0F766E", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        GAP Logic: Recent gaps favored
      </div>

      {list.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13 }}>
          {vi.common.noData || "Chua co du lieu"}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {list.map((item, i) => {
            let bg = "#222";

            if (i < 3) bg = "#ff4d4f";
            else if (i < 10) bg = "#faad14";

            return (
              <div
                key={`${item.number ?? "unknown"}-${i}`}
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
                <div>{formatNumber(item.number)}</div>

                <div style={{ fontSize: 10, opacity: 0.7 }}>
                  {formatScore(item.score)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GapCard;
