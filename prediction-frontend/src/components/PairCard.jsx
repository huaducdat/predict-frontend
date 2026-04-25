function PairCard({ data }) {
  if (!data) return null;

  return (
    <div style={{ marginBottom: 30 }}>
      <h3>PAIR</h3>

      {/* 🔥 SCROLL DỌC */}
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          paddingRight: 6,
        }}
      >
        {Object.entries(data).map(([num, numbers]) => (
          <PairRow
            key={num}
            baseNumber={Number(num)}
            numbers={numbers}
          />
        ))}
      </div>
    </div>
  );
}

export default PairCard;

function PairRow({ baseNumber, numbers }) {
  const top = numbers.slice(0, 10);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* 🔥 TITLE: 00, 01, 02 */}
      <b>{baseNumber.toString().padStart(2, "0")}</b>

      {/* 🔥 LIST */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        {top.map((n, i) => {
          let bg = "#222";

          if (i < 3) bg = "#ff4d4f";      // 🔴 top 3
          else if (i < 9) bg = "#faad14"; // 🟡 top 9

          return (
            <div
              key={n.number}
              style={{
                width: 45,
                padding: 5,
                borderRadius: 6,
                background: bg,
                color: "white",
                textAlign: "center",
                fontSize: 11,
              }}
            >
              <div>{n.number.toString().padStart(2, "0")}</div>

              <div style={{ fontSize: 9, opacity: 0.7 }}>
                {n.score.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}