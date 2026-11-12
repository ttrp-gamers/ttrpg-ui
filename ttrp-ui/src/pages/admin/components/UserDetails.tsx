import React, { useState } from 'react';
import { UserDTO, UserRole, AccountStatus, AdminUserPatchRequest } from '../admin_types';
import './UserDetails.css';

interface Props {
    user: UserDTO;
    onSave: (userId: number, patch: AdminUserPatchRequest) => void;
    onClose: () => void;
}

export const UserDetailModal: React.FC<Props> = ({ user, onSave, onClose }) => {
    const [role, setRole] = useState<UserRole>(user.role);
    const [status, setStatus] = useState<AccountStatus>(user.accountStatus);

    const handleUpdate = () => {
        onSave(user.id, { userRole: role, accountStatus: status });
    };

    return (
        <div className="user-details-overlay">
            <div className="user-detail-modal">
                <h3>Edit User: {user.username}</h3>
                <div className="user-detail-select">
                    <label>Role: </label>
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                    </select>
                </div>
                <div className="user-detail-select">
                    <label>Status: </label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}>
                        <option value="PENDING">PENDING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DEACTIVATED">DEACTIVATED</option>
                    </select>
                </div>
                <button className="save-button"
                        onClick={handleUpdate}>Save Changes</button>
                <button className="cancel-button"
                        onClick={onClose} >Cancel</button>
            </div>


        </div>

    );
};