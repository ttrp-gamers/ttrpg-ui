import { Stage, Layer, Line, Image } from "react-konva";
import MapBackground from "./components/MapBackground";
import Forest from "../../assets/forestNoRaster.jpg";
import Bush from "../../assets/bush.png";
import useImage from "use-image";

export default function MapDragDrop() {
  const [bushImage] = useImage(Bush);
  const grid = 40;
  const mapWidth = 1000;
  const mapHeight = 1000;
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
    <>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <MapBackground
            frameX={frameX}
            frameY={frameY}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            frameColor="#00000"
            mapImageSrc={Forest}
          />
        </Layer>
        <Layer>
          {linesA}
          {linesB}
        </Layer>
        <Layer>
          <Image
            onDragEnd={(e) => {
              const itemWidth = 100;
              const itemHeight = 100;

              // 1. Center point relative to frame
              const centerX = e.target.x() - frameX + itemWidth / 2;
              const centerY = e.target.y() - frameY + itemHeight / 2;

              // 2. DISCRETE GRID CELL COORDINATES (Integer Column & Row for DB)
              const gridX = Math.floor(centerX / grid); // e.g., 4
              const gridY = Math.floor(centerY / grid); // e.g., 7
              console.log("Grid Cell:", gridX, gridY);

              // 3. Pixel position for snapped center
              const snappedCenterX = gridX * grid + grid / 2;
              const snappedCenterY = gridY * grid + grid / 2;

              // 4. Animate to top-left coordinate for Konva
              e.target.to({
                x: frameX + snappedCenterX - itemWidth / 2,
                y: frameY + snappedCenterY - itemHeight / 2,
              });
            }}
            x={80}
            y={80}
            draggable
            width={100}
            height={100}
            image={bushImage}
          />
        </Layer>
      </Stage>
    </>
  );
}
