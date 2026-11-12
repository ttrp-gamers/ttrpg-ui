import React, { useState, useEffect } from "react";
import { AdminService } from "../../../services/AdminService";
import { AdminUserQuery, UserDTO, AdminUserUpdatePayload } from "../admin_types";
import { UserQueryBuilder } from "./AdminUserQueryBuilder";
import { UserRow } from "./UserRow";
import { UserDetailModal } from "./UserDetails";
import './AdminTable.css'

export const AdminTable: React.FC = () => {
    const [query, setQuery] = useState<AdminUserQuery>({});
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [editingUser, setEditingUser] = useState<UserDTO | null>(null);


    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await AdminService.getUserList(query);
                setUsers(data);
            } catch (err) {
                console.error("Failed to load user list:", err);
            }
        };

        loadUsers();
    }, [query]);


    const handleSavePatch = async (userId: number, patch: AdminUserPatchRequest) => {
        try {
            await AdminService.updateUserProfile(userId, patch);
            setEditingUser(null);
            // Refresh list after successful update
            const updatedData = await AdminService.getUserList(query);
            setUsers(updatedData);
        } catch (err) {
            console.error("Failed to update user:", err);
        }
    };


    return (
        <div className="admin_panel">
            <h2>Admin-Panel</h2>

            <UserQueryBuilder query={query}
                              onChange={setQuery}
            ></UserQueryBuilder>

            <table className="user-list-table">
                <thead className="user-list-thead">
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>

                <tbody className="user-list-tbody">
                {
                    users.length > 0 ? (
                        users.map((user) => (
                            <UserRow
                                key={user.id}
                                user={user}
                                onEdit={(u) => setEditingUser(u)}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center' }}>No users found matching your query.</td>
                        </tr>
                    )
                }
                </tbody>
            </table>

            {editingUser && (
                <UserDetailModal
                    user={editingUser}
                    onSave={handleSavePatch}
                    onClose={() => setEditingUser(null)}
                />
            )}

        </div>
    );
}
