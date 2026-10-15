import { api } from "./Api";

export interface CharacterPayload {
  name: string;
  characterClass: string;
  level: number;
  ruleset: string;
  maxHp: number;
  currentHp: number;
  attributes: Record<string, any>;
}

export interface CharacterResponse extends CharacterPayload {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export const CharacterService = {
  create: async (payload: CharacterPayload): Promise<CharacterResponse> => {
    const response = await api.post("/v1/characters", payload);
    return response.data;
  },

  getAll: async (): Promise<CharacterResponse[]> => {
    const response = await api.get("/v1/characters");
    return response.data;
  },

  update: async (id: number, payload: CharacterPayload): Promise<CharacterResponse> => {
    const response = await api.put(`/v1/characters/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/v1/characters/${id}`);
  },
};
