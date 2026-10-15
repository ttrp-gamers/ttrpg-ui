import { Stage, Layer, Line } from "react-konva";
import "./Map.css";
import MapList from "./components/MapList";
import CreateMap from "./components/CreateMap";
import MapEditing from "./components/MapEditing";

export default function Map() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Get all maps */}
      <MapList></MapList>
      {/*  Create new map */}
      <CreateMap></CreateMap>
      {/* Map Editing */}
      <MapEditing></MapEditing>
     
    </div>
  );
}
