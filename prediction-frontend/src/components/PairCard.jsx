import { vi } from "../i18n/vi";

function PairCard({ data }) {
  const rows = Array.isArray(data)
    ? data.filter((item) => item && typeof item === "object")
    : [];

  const formatScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? Number(value.toFixed(3)) : "--";
  };

  const formatNumber = (n) => {
    const value = Number(n);
    return Number.isFinite(value) ? String(value).padStart(2, "0") : "--";
  };

  return (
    <div>
      <h3>{vi.predictor.PAIR}</h3>

      {rows.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13 }}>
          {vi.common.noData || "Chua co du lieu"}
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {rows.map((item, itemIndex) => {
            const sources = Array.isArray(item.sources) ? item.sources : [];

            return (
              <div key={`${item.number ?? "unknown"}-${itemIndex}`} style={{ marginBottom: 14 }}>
                <b style={{ fontSize: 16 }}>
                  {formatNumber(item.number)}{" "}
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    ({formatScore(item.score)})
                  </span>
                </b>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {sources.filter(Boolean).slice(0, 5).map((s, i) => (
                    <div
                      key={`${s?.pair ?? "unknown"}-${i}`}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        background:
                          i === 0
                            ? "#ff4d4f"
                            : i < 3
                            ? "#faad14"
                            : "#222",
                        color: "white",
                        fontSize: 11,
                      }}
                    >
                      {s?.pair || "--"}

                      <div style={{ fontSize: 9 }}>
                        {formatScore(s?.score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PairCard;
