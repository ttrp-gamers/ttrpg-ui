import React from "react";
import { Image } from "react-konva";
import useImage from "use-image";

export default function PlacedAsset({ item, frameX, frameY, grid, onUpdatePosition }) {
  const BACKEND_BASE_URL = "http://localhost:8080";
  
  // Format asset path safely
  const formattedPath = item.assetPath
    ? item.assetPath.startsWith("/") ? item.assetPath : `/${item.assetPath}`
    : "";
    
  const [image] = useImage(formattedPath ? `${BACKEND_BASE_URL}${formattedPath}` : "");
  
  const itemWidth = 80;
  const itemHeight = 80;

  // Initial top-left screen position derived from grid cell coordinates
  const initialX = frameX + (item.gridX * grid + grid / 2) - itemWidth / 2;
  const initialY = frameY + (item.gridY * grid + grid / 2) - itemHeight / 2;

  return (
    <Image
      image={image}
      x={initialX}
      y={initialY}
      width={itemWidth}
      height={itemHeight}
      draggable
      onDragEnd={(e) => {
        // 1. Center point relative to map origin
        const centerX = e.target.x() - frameX + itemWidth / 2;
        const centerY = e.target.y() - frameY + itemHeight / 2;

        // 2. Discrete Grid Cell Indices
        const gridX = Math.floor(centerX / grid);
        const gridY = Math.floor(centerY / grid);

        // 3. Pixel position for snapped center
        const snappedCenterX = gridX * grid + grid / 2;
        const snappedCenterY = gridY * grid + grid / 2;

        // 4. Update parent state
        onUpdatePosition(item.instanceId, gridX, gridY);

        // 5. Animate to top-left coordinate for Konva
        e.target.to({
          x: frameX + snappedCenterX - itemWidth / 2,
          y: frameY + snappedCenterY - itemHeight / 2,
          duration: 0.1,
        });
      }}
    />
  );
}