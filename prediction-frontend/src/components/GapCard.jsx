function GapCard({ data }) {
  if (!data || !data["-1"]) return null;

  const list = data["-1"];

  return (
    <div>
      <h3>GAP (Lâu chưa ra)</h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {list.map((item, i) => {
          let bg = "#222";

          if (i < 3) bg = "#ff4d4f";       // 🔴 top
          else if (i < 10) bg = "#faad14"; // 🟡 mid

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
              {/* 🔥 number */}
              <div>
                {item.number.toString().padStart(2, "0")}
              </div>

              {/* 🔥 gap */}
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {item.score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GapCard;