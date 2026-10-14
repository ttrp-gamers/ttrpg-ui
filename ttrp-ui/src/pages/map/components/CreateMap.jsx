import { useState, useEffect } from "react";
import { MapService } from "../../../services/MapService";



export default function CreateMap() {
    const [mapName, setMapName] = useState("");
    const [backgrounds, setBackgrounds] = useState([]);
    const [selectedBackgroundId, setSelectedBackgroundId] = useState(""); 
    useEffect(() => {
        MapService.getBackgrounds().then((data) => {
        const bgList = data || [];
        setBackgrounds(bgList);
        if (bgList.length > 0) {
            setSelectedBackgroundId(bgList[0].id);        }
        });
    }, []);

    const handleCreateClick = async () => {
        if (!mapName.trim() || !selectedBackgroundId) {
            alert("Please enter a map name and select a background.");
            return;
        }

    const payload = {
      mapName: mapName.trim(),
     backgroundId: Number(selectedBackgroundId)
    };

    try {
      const createdMap = await MapService.createMap(payload);
      onMapCreated(createdMap);
      setMapName(""); 
    } catch (err) {
      console.error("Failed to create map:", err);
      alert("Failed to create map.");
    }
  };

return (
    <div style={{ padding: "16px", border: "1px solid #ccc", marginBottom: "16px" }}>
      <h3>Create New Map</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Map Name: </label>
        <input
          type="text"
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          placeholder="e.g. Goblin Cave"
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Background: </label>
        <select
          value={selectedBackgroundId}
          onChange={(e) => setSelectedBackgroundId(e.target.value)}
        >
          {backgrounds.map((bg) => (
                <option key={bg.id} value={bg.id}> 
                 {bg.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Button */}
      <button onClick={handleCreateClick}>
        Create Map
      </button>
    </div>
  );
}