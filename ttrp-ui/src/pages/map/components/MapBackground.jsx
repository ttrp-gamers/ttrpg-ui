import { Rect } from "react-konva";
import { Image } from 'react-konva';
import useImage from 'use-image';

const URLImage = ({ src, width, height, ...rest }) => {
  const [image] = useImage(src, 'anonymous');

  // Calculate coordinates to center the image on screen
  const x = (window.innerWidth - width) / 2;
  const y = (window.innerHeight - height) / 2;

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
  frameColor,
  mapImageSrc,
}) {
  return (
    <>
      {/* Base Colored Canvas Frame */}
      <Rect
        x={frameX}
        y={frameY}
        width={mapWidth}
        height={mapHeight}
        fill={frameColor}
        stroke="black"
        strokeWidth={2}
      />

      {/* Render Image Overlay only if an image source exists */}
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