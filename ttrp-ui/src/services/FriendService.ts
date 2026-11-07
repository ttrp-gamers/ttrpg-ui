import { api } from "./Api";
import type { PlayerStatus } from "./Api";

export type FriendRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DENIED"
  | "CANCELED";

export interface UserSummary {
  id: number;
  username: string;
}

export interface FriendshipResponse {
  friendshipId: number;
  friendUserId: number;
  friendUsername: string;
  friendStatus: PlayerStatus | null;
  createdAt: string;
}

export interface FriendRequestResponse {
  id: number;
  sender: UserSummary;
  receiver: UserSummary;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt: string | null;
}

export const FriendService = {
  getFriends: async (): Promise<FriendshipResponse[]> => {
    const response = await api.get("/v1/friendships");
    return response.data;
  },

  removeFriend: async (friendUserId: number): Promise<void> => {
    await api.delete(`/v1/friendships/${friendUserId}`);
  },

  sendRequest: async (receiverId: number): Promise<FriendRequestResponse> => {
    const response = await api.post("/v1/friend-requests", { receiverId });
    return response.data;
  },

  // both lists only contain PENDING requests
  getIncomingRequests: async (): Promise<FriendRequestResponse[]> => {
    const response = await api.get("/v1/friend-requests/incoming");
    return response.data;
  },

  getOutgoingRequests: async (): Promise<FriendRequestResponse[]> => {
    const response = await api.get("/v1/friend-requests/outgoing");
    return response.data;
  },

  // receiver only; returns the newly created friendship
  acceptRequest: async (requestId: number): Promise<FriendshipResponse> => {
    const response = await api.post(`/v1/friend-requests/${requestId}/accept`);
    return response.data;
  },

  // receiver only
  denyRequest: async (requestId: number): Promise<FriendRequestResponse> => {
    const response = await api.post(`/v1/friend-requests/${requestId}/deny`);
    return response.data;
  },

  // sender only: withdraws a pending request
  cancelRequest: async (requestId: number): Promise<FriendRequestResponse> => {
    const response = await api.delete(`/v1/friend-requests/${requestId}`);
    return response.data;
  },
};
