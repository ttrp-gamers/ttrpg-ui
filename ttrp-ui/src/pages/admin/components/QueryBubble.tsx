import React from "react";
import { AdminUserQuery, QueryValue } from "../admin_types";
import "./QueryBubble.css"

interface Props {
    fieldKey: keyof AdminUserQuery;
    query: QueryValue<any>;
    onToggleSort: (key: keyof AdminUserQuery) => void;
    onRemove: (key: keyof AdminUserQuery) => void;
}

export const QueryBubble: React.FC<Props> = ({fieldKey, query, onToggleSort, onRemove}) => {

    return (
        <div className="query-bubble">
            <p>{fieldKey}</p>
            <span>{query.operator}</span>
            <span>{String(query.value)}</span>

            <button
                onClick={() => onToggleSort(fieldKey)}
                title="Sort Order {query.ascending ? 'Ascending' : 'Descending'}"
                className="query-sort-order"
            >
                {query.ascending ? 'ASC' : 'DESC'}
            </button>

            <button
                onClick={() => onRemove(fieldKey)}
                title="Remove Filter"
                className="query-close"
            >
                x
            </button>
        </div>
    )
}