import React from 'react';
import { UserDTO } from '../admin_types';

interface Props {
    user: UserDTO;
    onEdit: (user: UserDTO) => void;
}

export const UserRow: React.FC<Props> = ({ user, onEdit }) => {
    return (
        <tr>
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.accountStatus}</td>
            <td>
                <button onClick={() => onEdit(user)}>Edit</button>
            </td>
        </tr>
    );
};