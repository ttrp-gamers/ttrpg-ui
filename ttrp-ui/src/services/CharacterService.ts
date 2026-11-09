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

export interface RulesetDefinition {
  id: string;
  name: string;
  description?: string;
  terminology: { archetype: string; level: string };
  archetypes: string[];
  sections: Array<{ id: string; title: string; fields: Array<Record<string, any>> }>;
  derivedStats?: Array<Record<string, any>>;
  resources?: Array<Record<string, any>>;
}

export interface CharacterCalculationResponse {
  derivedStats: Record<string, number | null>;
  calculatedMaxHp: number | null;
}

export const CharacterService = {
  getRulesets: async (): Promise<RulesetDefinition[]> => {
    const response = await api.get("/v1/rulesets");
    return response.data;
  },

  calculate: async (payload: {
    rulesetKey: string;
    rulesetSchema?: RulesetDefinition;
    values: Record<string, any>;
    level: number;
    hitDie: number;
  }): Promise<CharacterCalculationResponse> => {
    const response = await api.post("/v1/rulesets/calculate", payload);
    return response.data;
  },

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
