import { api } from "./Api";

export interface MonsterPayload {
  name: string;
  version: string;
  source: string;
  monsterType: string;
  challengeRating: string;
  maxHp: number;
  currentHp: number;
  statblock: Record<string, any>;
}

export interface MonsterResponse extends MonsterPayload {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export const MonsterService = {
  searchOpen5e: async (version: string, query: string): Promise<{ results: Record<string, any>[] }> =>
    (await api.get("/v1/open5e/creatures", { params: { version, query: query.trim() || undefined } })).data,
  getAll: async (): Promise<MonsterResponse[]> => (await api.get("/v1/monsters")).data,
  create: async (payload: MonsterPayload): Promise<MonsterResponse> => (await api.post("/v1/monsters", payload)).data,
  update: async (id: number, payload: MonsterPayload): Promise<MonsterResponse> =>
    (await api.put(`/v1/monsters/${id}`, payload)).data,
  delete: async (id: number): Promise<void> => {
    await api.delete(`/v1/monsters/${id}`);
  },
};
