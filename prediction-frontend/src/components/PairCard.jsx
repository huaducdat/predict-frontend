function PairCard({ data }) {
  if (!Array.isArray(data)) return null;

  return (
    <div>
      <h3>PAIR → NEXT</h3>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {data.map((pair) => {
          const [a, b] = decodePair(pair.pairKey);

          return (
            <div key={pair.pairKey} style={{ marginBottom: 12 }}>
              {/* 🔥 PAIR */}
              <b>
                ({a.toString().padStart(2, "0")}-
                {b.toString().padStart(2, "0")})
              </b>

              {/* 🔥 NEXT */}
              <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                {pair.numbers.map((n, i) => (
                  <div
                    key={n.number}
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
                    {n.number.toString().padStart(2, "0")}
                    <div style={{ fontSize: 9 }}>
                      {(n.score * 100).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PairCard;

const decodePair = (key) => {
  const a = Math.floor(key / 100);
  const b = key % 100;
  return [a, b];
};