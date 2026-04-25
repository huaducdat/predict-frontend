import { useEffect, useState } from "react";
import { getPredictData } from "../api/predictApi";

function PredictDebug() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");


  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPredictData();
        console.log("PREDICT RAW:", res);
        setData(res);
      } catch (err) {
        console.error("PREDICT ERROR:", err);
        setError(err.message);
      }
    };

    load();
  }, []);



  if (!data) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>Predict Debug</h2>

      {error && <pre style={{ color: "red" }}>{error}</pre>}

      {!data && !error && <p>Loading...</p>}

      {data && (
        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default PredictDebug;
