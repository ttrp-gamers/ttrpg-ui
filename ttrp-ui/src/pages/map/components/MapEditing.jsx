import React, { useState, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";
import { useMapState } from "./../helper/useMapState";
import { objectManagment } from "../helper/objectManagment";
import MapBackground from "./MapBackground";

export default function MapEditing() {
  const [mapName, setMapName] = useState("");
  const { mapState, loading, fetchMapState } = useMapState();
  const BACKEND_BASE_URL = "http://localhost:8080";

  const grid = 40;
  const mapWidth = 1000;
  const mapHeight = 1000;
  const frameX = (window.innerWidth - mapWidth) / 2;
  const frameY = (window.innerHeight - mapHeight) / 2;

  // Grid
  const linesA = [];
  const linesB = [];
  //Objects on map
 // const objects_map = fetchObjects();

  for (let i = 0; i < mapHeight / grid; i++) {
    const x = frameX + i * grid;
    linesA.push(
      <Line
        key={`v-${i}`}
        strokeWidth={1}
        stroke={"black"}
        opacity={0.4}
        points={[x, frameY, x, frameY + mapHeight]}
      />,
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
      />,
    );
  }

  const fullImageUrl = mapState?.backgroundPath
    ? `${BACKEND_BASE_URL}${mapState.backgroundPath}`
    : null;

  return (
    <>
      <input
        type="text"
        placeholder="your map name"
        value={mapName}
        onChange={(e) => setMapName(e.target.value)}
      ></input>
      <button
        className="btn btn-primary"
        onClick={() => fetchMapState(mapName)}
        disabled={loading}
      ></button>
      {loading ? "Loading..." : "Load Map"}
      <Stage width={window.innerWidth} height={window.innerHeight}>
        {/* Background Layer */}
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

        </Layer>
      </Stage>
    </>
  );
}
