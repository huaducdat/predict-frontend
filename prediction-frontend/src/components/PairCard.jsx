function PairCard({ data }) {
  if (!Array.isArray(data)) return null;

  // 🔥 format chuẩn toàn hệ thống
  const formatScore = (score) => {
    return Number(score.toFixed(3));
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

  return (
    <div>
      <h3>PAIR → NEXT (Context)</h3>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {data.map((item) => (
          <div key={item.number} style={{ marginBottom: 14 }}>

            {/* 🔥 NUMBER */}
            <b style={{ fontSize: 16 }}>
              {formatNumber(item.number)}{" "}
              <span style={{ fontSize: 12, color: "#aaa" }}>
                ({formatScore(item.score)})
              </span>
            </b>

            {/* 🔥 SOURCES (PAIR) */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {item.sources.slice(0, 5).map((s, i) => (
                <div
                  key={s.pair} // ✅ tránh dùng index
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
                  {s.pair}

                  <div style={{ fontSize: 9 }}>
                    {formatScore(s.score)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PairCard;