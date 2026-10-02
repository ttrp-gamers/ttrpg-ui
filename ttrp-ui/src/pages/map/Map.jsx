import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import useImage from 'use-image';
import './Map.css';
import MapBackground from './components/MapBackground';

// Render individual line using pattern texture or eraser
function RenderedLine({ line }) {
  const [patternImage] = useImage(line.textureSrc || '');
  const isEraser = line.tool === 'eraser';

  if (isEraser) {
    return (
      <Line
        points={line.points}
        stroke="#000"
        strokeWidth={line.size}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="destination-out"
      />
    );
  }

  if (patternImage) {
    return (
      <Line
        points={line.points}
        strokeWidth={line.size}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        fillPatternImage={patternImage}
        fillPatternRepeat="repeat"
        globalCompositeOperation="source-over"
      />
    );
  }

  return null;
}

export default function Map() {
  const mapWidth = 800;
  const mapHeight = 800;
  const frameX = (window.innerWidth - mapWidth) / 2;
  const frameY = (window.innerHeight - mapHeight) / 2;

  // --- BACKGROUND STATE ---
  const [mapImageSrc, setMapImageSrc] = useState(null);
  const [frameColor, setFrameColor] = useState('#f8f9fa');

  // --- DRAWING STATE ---
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [textureSrc, setTextureSrc] = useState(null);
  const [brushSize, setBrushSize] = useState(15);
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);

  // --- BACKGROUND HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMapImageSrc(URL.createObjectURL(file));
    }
  };

  const handleTextureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTextureSrc(URL.createObjectURL(file));
    }
  };

  // --- DRAWING HANDLERS ---
  const handleMouseDown = (e) => {
    // Prevent drawing if no texture is loaded when using the pen tool
    if (tool === 'pen' && !textureSrc) {
      alert('Please upload a brush texture image first!');
      return;
    }

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();

    setLines((prev) => [
      ...prev,
      {
        tool,
        textureSrc,
        size: brushSize,
        points: [pos.x, pos.y],
      },
    ]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    setLines((prevLines) => {
      if (prevLines.length === 0) return prevLines;
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      return [...prevLines.slice(0, -1), lastLine];
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* TOOLBAR */}
      <div
        className="d-flex gap-3 p-3 align-items-center flex-wrap"
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div>
          <label className="form-label me-1 mb-0">Map Image:</label>
          <input
            className="form-control form-control-sm d-inline-block w-auto"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <div>
          <label className="form-label me-1 mb-0">Bg Color:</label>
          <input
            type="color"
            className="form-control form-control-color form-control-sm d-inline-block"
            value={frameColor}
            onChange={(e) => setFrameColor(e.target.value)}
          />
        </div>

        <span style={{ borderLeft: '1px solid #ccc', height: '24px' }}></span>

        {/* TOOL SELECTION */}
        <div>
          <label className="form-label me-1 mb-0">Tool:</label>
          <select
            className="form-select form-select-sm d-inline-block w-auto"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
          >
            <option value="pen">Texture Brush</option>
            <option value="eraser">Eraser</option>
          </select>
        </div>

        {/* TEXTURE FILE INPUT */}
        {tool === 'pen' && (
          <div>
            <label className="form-label me-1 mb-0">Brush Texture:</label>
            <input
              className="form-control form-control-sm d-inline-block w-auto"
              type="file"
              accept="image/*"
              onChange={handleTextureUpload}
            />
          </div>
        )}

        <div>
          <label className="form-label me-1 mb-0">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>

        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => setLines([])}
        >
          Clear Drawing
        </button>
      </div>

      {/* KONVA STAGE */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          <MapBackground
            frameX={frameX}
            frameY={frameY}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            frameColor={frameColor}
            mapImageSrc={mapImageSrc}
          />
        </Layer>

        <Layer>
          {lines.map((line, index) => (
            <RenderedLine key={index} line={line} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}