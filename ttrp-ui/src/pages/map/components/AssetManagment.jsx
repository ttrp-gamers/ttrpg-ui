// src/components/AssetManagment.jsx
import { useState, useEffect } from "react";
import { MapService } from "../../../services/MapService";

export default function AssetManagment({ onSelectAsset }) {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    MapService.getObjects()
      .then((data) => {
        setObjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading objects:", err);
        setError("Could not load assets.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading objects...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div >
      <h2>Object Assets</h2>
      {objects.length === 0 ? (
        <p>No objects available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, cursor: "pointer" }}>
          {objects.map((obj) => (
            <li 
              key={obj.id} 
              onClick={() => onSelectAsset(obj)}
            >{obj.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}