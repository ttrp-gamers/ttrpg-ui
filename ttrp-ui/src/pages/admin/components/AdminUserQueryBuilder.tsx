import React, {useState} from "react";
import {AdminUserQuery, AdminUserUpdatePayload, QueryOperators, AccountStatus, UserRole} from "../admin_types";
import {User} from "../../auth/AuthContext";
import {QueryBubble} from "./QueryBubble";
import "./AdminUserQueryBuilder.css";

interface Props {
    query: AdminUserQuery;
    onChange: (newQuery: AdminUserQuery) => void;
}

const PARAM_HIERARCHY: (keyof AdminUserQuery)[] = ['username', 'userRole', 'accountStatus', 'email'];

const OPERATORS_MAP: Record<keyof AdminUserQuery, QueryOperators[]> = {
    username: ['LIKE', 'EQUALS', 'NOT_EQUALS'],
    email: ['LIKE', 'EQUALS', 'NOT_EQUALS'],
    userRole: ['EQUALS', 'NOT_EQUALS'],
    accountStatus: ['EQUALS', 'NOT_EQUALS'],
};


export const UserQueryBuilder: React.FC<Props> = ({query = {}, onChange}) => {

    const firstUnsetParam = (currentQuery: AdminUserQuery): keyof AdminUserQuery => {
        const queryKey = PARAM_HIERARCHY.find(p => !currentQuery[p]?.value)
        return queryKey || 'username';
    };

    const getDefaultValueForParam = (param: keyof AdminUserQuery): any => {
        if (param === 'userRole') return 'ADMIN';
        if (param === 'accountStatus') return 'ACTIVE';
        return '';
    };

    const initialParam = firstUnsetParam(query);
    const [selectedParam, setSelectedParams] = useState<keyof AdminUserQuery>(initialParam);
    const [operators, setOperators] = useState<QueryOperators>(OPERATORS_MAP[selectedParam][0]);
    const [value, setValue] = useState<any>('');
    const [ascending, setAscending] = useState<boolean>(true);


    const handleParamChange = (newParam: keyof AdminUserQuery)=> {
        setSelectedParams(newParam);
        setOperators(OPERATORS_MAP[newParam][0]);
        setValue(newParam === 'userRole' ? 'USER' : newParam === 'accountStatus' ? 'ACTIVE' : '');
        setAscending(true);
    }

    const handleAddFilter = () => {
        if(value === '' || value === null || value === undefined){ return; }

        const updatedQuery: AdminUserQuery = {
            ...query,
            [selectedParam]: {
                value: value,
                operators: operators,
                ascending: ascending,
            },
        }
        onChange(updatedQuery);
        const nextUnset = firstUnsetParam(updatedQuery);
        handleParamChange(nextUnset);
    }

    const handleRemoveFilter = (paramKey: keyof AdminUserQuery) => {
        const updatedQuery = {...(query||{})};
        delete updatedQuery[paramKey];
        onChange(updatedQuery);
        const nextUnset = firstUnsetParam(updatedQuery);
        handleParamChange(nextUnset)
    }

    const handleToggleAscending = (paramKey: keyof AdminUserQuery) => {
        const qv = query[selectedParam];
        if (!qv) { return; }
        const updatedQuery: AdminUserQuery = {
            ...query,
            [selectedParam]: {
                ...qv,
                ascending: ascending,
            },
        }
        onChange(updatedQuery);
    }


    return (
        <div className="admin-query-builder">
            <div className="admin-query-builder__header">
                <select
                        onChange={(e)  =>
                            handleParamChange(e.target.value as keyof AdminUserQuery)}
                        value={selectedParam}
                        className="query-select ">{
                            PARAM_HIERARCHY.map((p) => (
                                <option key={p} value={p} disabled={!!query[p]?.value && p !== selectedParam}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)} {query[p]?.value ? 'Active' : ''}
                                </option>
                            ))}
                </select>

                <select
                        onChange={(e)  =>
                            setOperators(e.target.value as QueryOperators)}
                        value={operators}
                        className="query-select ">{
                            OPERATORS_MAP[selectedParam].map((operator) => (
                                <option key={operator} value={operator}>{operator}</option>
                            ))}
                </select>
                {
                    selectedParam === 'userRole' ? (
                        <select value={value}
                                onChange={(e)  =>
                                    setValue(e.target.value as UserRole)}
                                className="query-select "
                        >
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                        </select>
                ) : selectedParam === 'accountStatus' ? (
                        <select value={value}
                                onChange={(e)  =>
                                    setValue(e.target.value as AccountStatus)}
                                className="query-select "
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="DEACTIVATED">DEACTIVATED</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={`Enter ${selectedParam}...`}
                            className="query-input"
                        />
                    )
                }
                <button
                    type="button"
                    onClick={() => setAscending(!ascending)}
                    className="ascending-button"
                >
                    {ascending ? '▲ ASC' : '▼ DESC'}
                </button>

                <button
                    type="button"
                    onClick={() => handleAddFilter()}
                    className="add-button"
                >
                    + Add
                </button>

            </div>

            <div
                className="admin-query-builder__query-bubbles"
            >
                {
                    PARAM_HIERARCHY.map((key: keyof AdminUserQuery) => {
                        const qv = query[key];
                        if (!qv || !qv.value) { return; }

                        return(
                            <QueryBubble
                                key={key}
                                fieldKey={key}
                                query={qv}
                                onToggleSort={handleToggleAscending}
                                onRemove={handleRemoveFilter}/>
                        )
                    })
                }
            </div>
        </div>
    );

}