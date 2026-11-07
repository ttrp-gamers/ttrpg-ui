import "./Overview.css";
import FriendsSidebar from "./components/FriendsSidebar.jsx";

export default function Overview() {
  return (
    <div className="overview-page d-flex flex-column flex-md-row align-items-md-start">
      <main className="overview-main flex-grow-1 p-4">
        <p>Dashboard ^_^</p>
      </main>
      <FriendsSidebar />
    </div>
  );
}
