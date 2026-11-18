import React, { useState, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";
import { useMapState } from "./../helper/useMapState";
import { MapService } from "../../../services/MapService";
import MapBackground from "./MapBackground";
import PlacedAsset from "./PlacedAsset";

export default function MapEditing({ placedAssets, setPlacedAssets }) {
  const [mapName, setMapName] = useState("");
  const { mapState, loading, fetchMapState } = useMapState();
  const [saving, setSaving] = useState(false);
  const BACKEND_BASE_URL = "http://localhost:8080";

  const grid = mapState?.gridSize || 40;
  const columns = mapState?.columns || 32;
  const rows = mapState?.rows || 18;
  const mapWidth = columns * grid; 
  const mapHeight = rows * grid;
  const frameX = (window.innerWidth - mapWidth) / 2;
  const frameY = (window.innerHeight - mapHeight) / 2;

  // Populate placedAssets whenever mapState is loaded from backend
  // src/components/MapEditing.jsx
// src/components/MapEditing.jsx
useEffect(() => {
  if (mapState && mapState.objects && Array.isArray(mapState.objects)) {
    const loadedAssets = mapState.objects.map((obj, index) => ({
      instanceId: Date.now() + index, // Eindeutige Canvas-Instanz-ID
      // Verschiedene mögliche Feldnamen des Backends abfangen:
      assetId: obj.assetId || obj.id || obj.asset?.id, 
      name: obj.name || "Asset",
      assetPath: obj.assetPath || obj.backgroundPath,
      gridX: obj.gridX,
      gridY: obj.gridY,
    }));
    setPlacedAssets(loadedAssets);
  }
}, [mapState, setPlacedAssets]);

  // Handler to post current placedAssets back to the backend
  const handleSaveMapState = async () => {
    if (!mapState?.id) return;

      const payload = {
        mapId: mapState.id,
        mapObjects: placedAssets.map((item) => ({
          // Greift auf item.assetId zu, mit Fallback auf item.id
          assetId: item.assetId ?? item.id, 
          gridX: item.gridX,
          gridY: item.gridY,
          widthInCells: 2,
          heightInCells: 2,
        })),
      };

    try {
      setSaving(true);
      await MapService.saveMapState(payload);
      alert("Map state saved successfully!");
    } catch (err) {
      console.error("Failed to save map state:", err);
      alert("Error saving map state.");
    } finally {
      setSaving(false);
    }
  };

  const linesA = [];
  const linesB = [];
  for (let i = 0; i < mapWidth / grid; i++) {
    const x = frameX + i * grid;
    linesA.push(
      <Line
        key={`v-${i}`}
        strokeWidth={1}
        stroke={"black"}
        opacity={0.4}
        points={[x, frameY, x, frameY + mapHeight]}
      />
    );
  }
  for (let i = 0; i <= mapHeight / grid; i++) {
    const y = frameY + i * grid;
    linesB.push(
      <Line
        key={`h-${i}`}
        strokeWidth={1}
        stroke={"black"}
        opacity={0.4}
        points={[frameX, y, frameX + mapWidth, y]}
      />
    );
  }

  const handleUpdatePosition = (instanceId, gridX, gridY) => {
    setPlacedAssets((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId ? { ...item, gridX, gridY } : item
      )
    );
  };

  const fullImageUrl = mapState?.backgroundPath
    ? `${BACKEND_BASE_URL}${mapState.backgroundPath}`
    : null;

  return (
    <>
      <div style={{ top: 10, right: 10, zIndex: 10 }}>
        <input
          type="text"
          placeholder="your map name"
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => fetchMapState(mapName)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Map"}
        </button>
        <button
          className="btn btn-success"
          onClick={handleSaveMapState}
          disabled={saving || !mapState}
          style={{ marginLeft: "8px" }}
        >
          {saving ? "Saving..." : "Save State"}
        </button>
      </div>

      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <MapBackground
            frameX={frameX}
            frameY={frameY}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            mapImageSrc={fullImageUrl}
          />
        </Layer>
        <Layer>
          {linesA}
          {linesB}
        </Layer>
        <Layer>
          {placedAssets.map((item) => (
            <PlacedAsset
              key={item.instanceId}
              item={item}
              frameX={frameX}
              frameY={frameY}
              grid={grid}
              onUpdatePosition={handleUpdatePosition}
            />
          ))}
        </Layer>
      </Stage>
    </>
  );
}