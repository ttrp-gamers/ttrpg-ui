import React from "react";
import { Rect, Image } from "react-konva";
import useImage from "use-image";

const URLImage = ({ src, x, y, width, height, ...rest }) => {
  const [image] = useImage(src, "anonymous");

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rest}
    />
  );
};

export default function MapBackground({
  frameX,
  frameY,
  mapWidth,
  mapHeight,
  frameColor = "#f0f0f0",
  mapImageSrc,
}) {
  return (
    <>
      {/* Base Canvas Frame */}
      <Rect
        x={frameX}
        y={frameY}
        width={mapWidth}
        height={mapHeight}
        fill={frameColor}
        stroke="black"
        strokeWidth={2}
      />

      {/* Render Image Overlay using explicit frame coordinates */}
      {mapImageSrc && (
        <URLImage
          src={mapImageSrc}
          x={frameX}
          y={frameY}
          width={mapWidth}
          height={mapHeight}
        />
      )}
    </>
  );
}