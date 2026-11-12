import "./Admin.css";
import {UserQueryBuilder} from "./components/AdminUserQueryBuilder"
import {AdminTable} from "./components/AdminTable";
import {AdminUserQuery, UserDTO, UserRole, QueryValue} from "./admin_types"


export default function Admin(){

  return (
    <div className="admin_panel">
        <AdminTable />
    </div>
  );
}
