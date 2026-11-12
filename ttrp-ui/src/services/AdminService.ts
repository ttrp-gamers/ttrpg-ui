import { api } from './Api';
import { AdminUserQuery, AdminUserUpdatePayload, UserDTO, QueryValue } from "../pages/admin/admin_types";

export const AdminService = {
    getUserList: async (query?: AdminUserQuery): Promise<UserDTO[]> => {
        const params = new URLSearchParams();

        const appendQueryValue = (prefix: string, qv?: QueryValue<any>) => {
            if (qv && qv.value !== null && qv.value !== undefined && qv.value !== '') {
                params.append(`${prefix}.value`, String(qv.value));
                if (qv.operators) {
                    params.append(`${prefix}.operators`, qv.operators);
                }
                if (qv.ascending !== undefined) {
                    params.append(`${prefix}.ascending`, String(qv.ascending));
                }
            }
        };

        // Safely check if query exists before iterating over its properties
        if (query) {
            appendQueryValue('userRole', query.userRole);
            appendQueryValue('accountStatus', query.accountStatus);
            appendQueryValue('username', query.username);
            appendQueryValue('email', query.email);
        }

        const response = await api.get<UserDTO[]>('/v1/admin/users', { params });
        return response.data;
    },

    updateUserProfile: async (userId: number, updatePayload: AdminUserUpdatePayload): Promise<void> => {
        await api.patch(`/v1/admin/users/${userId}`, updatePayload);
    }
};