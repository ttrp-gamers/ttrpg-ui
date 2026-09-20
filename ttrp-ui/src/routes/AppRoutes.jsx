import { Routes, Route } from "react-router-dom";

import Auth from "../pages/auth/Auth.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import Overview from "../pages/overview/Overview.jsx";
import Character from "../pages/character/Character.jsx";
import Profile from "../pages/profile/Profile.jsx";
import Admin from "../pages/admin/Admin.jsx";
import Map from "../pages/map/Map.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Login Page: NO Navbar rendered */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Auth />} />
      </Route>

      {/* 2. All routes inside AppLayout render WITH the Navbar */}
      <Route element={<AppLayout />}>
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/character" element={<Character />} />
        <Route path="/map" element={<Map />} />
      </Route>
    </Routes>
  );
}
