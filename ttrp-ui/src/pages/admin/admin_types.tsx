export type UserRole = 'ADMIN' | 'USER'; // Match your Java enum values
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
export type QueryOperators = 'EQUALS' | 'NOT_EQUALS' | 'LIKE' | 'IN' | 'NOT_IN';


export interface AdminUserUpdatePayload{
    accountStatus?: AccountStatus | null;
    userRole?: UserRole | null;
}

export interface QueryValue<T> {
    value: T | null;
    operator: QueryOperators;
    ascending: boolean;
}

export interface AdminUserQuery {
    userRole?: QueryValue<UserRole>;
    accountStatus?: QueryValue<AccountStatus>;
    username?: QueryValue<string>;
    email?: QueryValue<string>;
}


export interface UserDTO {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
}

