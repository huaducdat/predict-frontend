import { useEffect, useState } from "react";
import { getCombinedResult } from "../api/combineApi";

function CombineDebug() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCombinedResult();

        console.log("COMBINED:", res);

        setData(res);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Combine Debug</h2>

      {loading && <p>Loading...</p>}
      {error && <pre style={{ color: "red" }}>{error}</pre>}

      {data && (
        <>
          {/* 🔥 TOP 3 */}
          <h3>Top 3</h3>
          <ul>
            {data.top3.map((n) => (
              <li key={n.number}>
                {n.number.toString().padStart(2, "0")} - {n.score.toFixed(4)}
              </li>
            ))}
          </ul>

          {/* 🔥 TOP 9 */}
          <h3>Top 9</h3>
          <ul>
            {data.top9.map((n) => (
              <li key={n.number}>
                {n.number.toString().padStart(2, "0")} - {n.score.toFixed(4)}
              </li>
            ))}
          </ul>

          {/* 🔥 FULL */}
          <h3>Full Data</h3>
          <pre style={{ fontSize: 12 }}>
            {JSON.stringify(data.full, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

export default CombineDebug;