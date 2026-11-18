import { Stage, Layer, Line } from "react-konva";
import { useState } from "react";
import "./Map.css";
import MapList from "./components/MapList";
import CreateMap from "./components/CreateMap";
import MapEditing from "./components/MapEditing";
import AssetManagment from "./components/AssetManagment";
import ImportExportAssets from "./components/ImportExportAssets";

export default function Map() {
  const [placedAssets, setPlacedAssets] = useState([]);
 // src/components/Map.jsx
const handleAddAssetToMap = (asset) => {
  const newPlacedAsset = {
    instanceId: Date.now(),
    assetId: asset.id, 
    name: asset.name,
    assetPath: asset.backgroundPath || asset.assetPath,
    gridX: 0,
    gridY: 0,
  };
  setPlacedAssets((prev) => [...prev, newPlacedAsset]);
};
  return (
    <div className="map-page-container">
      <ImportExportAssets />
      <MapList />
      <CreateMap />
      <AssetManagment onSelectAsset={handleAddAssetToMap} />
      <MapEditing placedAssets={placedAssets} setPlacedAssets={setPlacedAssets} />
    </div>
  );
}
