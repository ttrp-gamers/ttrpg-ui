import React, { useState, useEffect } from "react";
import { MapService } from "../../../services/MapService";

export default function MapList() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

const fetchMaps = async () => {
    try {
      setLoading(true);
      const data = await MapService.getMaps();
      setMaps(data || []);
    } catch (err) {
      console.log("Failed to fetch maps:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    fetchMaps();
  }, []);

  return (
    <div className="map-list-container" style={{ padding: "16px", zIndex: 10, position: "relative" }}>
    <h1>Your maps</h1>
        <button onClick={fetchMaps} className="btn btn-primary">Refresh List</button>
      {loading && <p>Loading maps...</p>}


        {!loading && maps.length === 0 && <p>No maps created yet.</p>}

        {!loading && maps.length > 0 && (
            <ul>
            {maps.map((map) => (
                <li
                key={map.id}
                style={{ cursor: "pointer", margin: "6px 0" }}
                onClick={() => onSelectMap && onSelectMap(map)}
                >
                {map.name} (ID: {map.id})
                </li>
            ))}
            </ul>
        )}
    </div>
  );
}