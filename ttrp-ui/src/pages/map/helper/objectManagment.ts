import { useState } from "react";
import { MapService } from "../../../services/MapService";

export function objectManagment() {
  const [objects, setObjects] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const data = await MapService.getObjects();
      setObjects(data || null);
    } catch (err) {
      console.error("Failed to fetch map state:", err);
      alert("Map state not found.");
    } finally {
      setLoading(false);
    }
  };

  return { objects, loading };
}