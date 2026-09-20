import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";

export default function AppLayout() {
  return (
    <>
      <Navbar/>
      <div className="container mt-4">
        <Outlet />
      </div>
    </>
  );
}
