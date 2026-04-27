function PairCard({ data }) {
  if (!Array.isArray(data)) return null;

  return (
    <div>
      <h3>PAIR → NEXT (Context)</h3>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 14 }}>
            
            {/* 🔥 NUMBER */}
            <b style={{ fontSize: 16 }}>
              {item.number.toString().padStart(2, "0")}
              {" "}
              <span style={{ fontSize: 12, color: "#aaa" }}>
                ({item.score.toFixed(1)})
              </span>
            </b>

            {/* 🔥 SOURCES (PAIR) */}
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {item.sources.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    background:
                      i === 0 ? "#ff4d4f" :
                      i < 3 ? "#faad14" :
                      "#222",
                    color: "white",
                    fontSize: 11,
                  }}
                >
                  {s.pair}
                  <div style={{ fontSize: 9 }}>
                    {s.score.toFixed(1)}
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