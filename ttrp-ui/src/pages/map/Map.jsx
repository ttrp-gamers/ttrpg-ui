import { Stage, Layer, Line } from "react-konva";
import "./Map.css";
import MapList from "./components/MapList";
import CreateMap from "./components/CreateMap";

export default function Map() {
  const grid = 40;
  const mapWidth = 800;
  const mapHeight = 800;
  const frameX = (window.innerWidth - mapWidth) / 2;
  const frameY = (window.innerHeight - mapHeight) / 2;

  const linesA = [];
  const linesB = [];

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

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Get all maps */}
      <MapList></MapList>
      {/*  Create new map */}
      <CreateMap></CreateMap>
      {/* KONVA STAGE */}
      <Stage width={window.innerWidth} height={window.innerHeight}>
        {/* Background Layer */}
        <Layer></Layer>
        <Layer>
          {linesA}
          {linesB}
        </Layer>
        {/* Background Layer */}
      </Stage>
    </div>
  );
}
