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
  // variables to center the map
  // how far away from the window the map beginns from right
  const frameX = (window.innerWidth - mapWidth) / 2;
    // how far away from the window the map beginns from top
  const frameY = (window.innerHeight - mapHeight) / 2;
  
  const linesA = [];
  const linesB = [];

  // vertical lines
  for (let i = 0; i < mapHeight / grid; i++) {
    const x = frameX + i * grid;
    linesA.push(
      <Line
        key={`v-${i}`}
        strokeWidth={1}
        stroke={"black"}
        opacity={0.4}
        // starts at x, frameY and ends at x, frameY + mapHeight
        points={[x, frameY, x, frameY + mapHeight]}
      />,
    );
  }

  // horizontal lines
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
            x={frameX}
            y={frameY}
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
