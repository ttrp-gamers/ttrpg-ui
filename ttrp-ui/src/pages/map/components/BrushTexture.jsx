import React from 'react';
import { Line } from 'react-konva';

export default function BrushTexture({ lines }) {
  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke={line.color || '#df4b26'}
          strokeWidth={line.size || 5}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          /* 'destination-out' acts as an eraser without deleting the background layer */
          globalCompositeOperation={
            line.tool === 'eraser' ? 'destination-out' : 'source-over'
          }
        />
      ))}
    </>
  );
}