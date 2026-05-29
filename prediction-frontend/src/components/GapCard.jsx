import { vi } from "../i18n/vi";

function GapCard({ data }) {
  if (!data || !data["-1"]) return null;

  const list = data["-1"];

  const formatScore = (score) => {
    return score.toFixed(3); // 🔥 3 số sau dấu phẩy
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

  return (
    <div>
      <h3>{vi.predictor.GAP}</h3>

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
              key={item.number}
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
    </div>
  );
}

export default GapCard;
