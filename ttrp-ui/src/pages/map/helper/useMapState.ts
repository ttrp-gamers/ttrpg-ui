import { useState } from "react";
import { MapService } from "../../../services/MapService";

export function useMapState() {
  const [mapState, setMapState] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMapState = async (mapName) => {
    const trimmedName = mapName.trim();
    if (!trimmedName) {
      alert("Please enter a map name to load.");
      return;
    }

    try {
      setLoading(true);
      const data = await MapService.getMapState(trimmedName);
      setMapState(data || null);
    } catch (err) {
      console.error("Failed to fetch map state:", err);
      alert("Map state not found.");
    } finally {
      setLoading(false);
    }
  };

  return { mapState, loading, fetchMapState };
}