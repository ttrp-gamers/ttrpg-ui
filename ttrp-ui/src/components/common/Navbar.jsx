import { Link } from "react-router-dom";
import dragonLogo from "../../assets/dragon.png";

export default function Navbar() {
  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-dark px-3">
        <Link className="navbar-brand" to="/overview">
          TTRP Vault
        </Link>
        <div className="navbar-nav me-auto">
          <Link className="nav-link" to="/overview">
            Overview
          </Link>
          <Link className="nav-link" to="/character">
            characters
          </Link>
          <Link className="nav-link" to="/map">
            maps
          </Link>
          <Link className="nav-link" to="/profile">
            profile
          </Link>
          <Link className="nav-link" to="/admin">
            admin
          </Link>
        </div>
        <div className="d-flex align-items-center gap-3">
          <img
            src={dragonLogo}
            alt="dragon"
            className="rounded-circle border border-secondary"
            width="50"
            height="50"
            style={{ objectFit: "cover" }}
          />
        </div>
      </nav>
    </>
  );
}
