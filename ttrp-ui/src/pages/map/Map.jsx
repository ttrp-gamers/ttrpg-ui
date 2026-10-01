import React, { useState, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import './Map.css';
import MapBackground from './components/MapBackground';
import BrushTexture from './components/BrushTexture';

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
  const [brushColor, setBrushColor] = useState('#df4b26');
  const [brushSize, setBrushSize] = useState(5);
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);

  // --- BACKGROUND HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setMapImageSrc(objectUrl);
    }
  };

  const handlePickedFrameColor = (e) => {
    setFrameColor(e.target.value);
  };

  // --- DRAWING HANDLERS ---
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    setLines([
      ...lines,
      {
        tool,
        color: brushColor,
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

  const handleClearDrawing = () => {
    setLines([]);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* 1. COMPLETE HTML CONTROL TOOLBAR */}
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
        {/* --- BACKGROUND INPUTS --- */}
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
            onChange={handlePickedFrameColor}
          />
        </div>

        <span style={{ borderLeft: '1px solid #ccc', height: '24px' }}></span>

        {/* --- BRUSH INPUTS --- */}
        <div>
          <label className="form-label me-1 mb-0">Tool:</label>
          <select
            className="form-select form-select-sm d-inline-block w-auto"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
          >
            <option value="pen">Pen</option>
            <option value="eraser">Eraser</option>
          </select>
        </div>

        {tool === 'pen' && (
          <div>
            <label className="form-label me-1 mb-0">Brush Color:</label>
            <input
              type="color"
              className="form-control form-control-color form-control-sm d-inline-block"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="form-label me-1 mb-0">Size:</label>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>

        <button className="btn btn-sm btn-outline-danger" onClick={handleClearDrawing}>
          Clear Drawing
        </button>
      </div>

      {/* 2. KONVA STAGE */}
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
        {/* LAYER 1: Background Image or Frame Color */}
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

        {/* LAYER 2: Drawing Layer */}
        <Layer>
          <BrushTexture lines={lines} />
        </Layer>
      </Stage>
    </div>
  );
}