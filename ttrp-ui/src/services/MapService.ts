import { api } from "./Api";

export const MapService = {
  getMaps: async () => {
    const response = await api.get("/v1/map");
    return response.data;
  },

  getBackgrounds: async () => {
    const response = await api.get("/v1/map/backgrounds");
    return response.data;
  },

  getObjects: async () => {
    const response = await api.get("/v1/map/objects");
    return response.data;
  },

  createMap: async (mapRequest) => {
    const response = await api.post("/v1/map", mapRequest);
    return response.data;
  },

  getMapState: async (mapName) => {
    const encodedName = encodeURIComponent(mapName);
    const response = await api.get(`/v1/map/state/${encodedName}`);
    return response.data;
  },
};
