import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoUrl from "../assets/Valentinas logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <img src={logoUrl} alt="Valentinas" className="navbar-logo" />
        <span className="navbar-title">Valentinas</span>
      </div>

      <div className="navbar-user">
        <div className="navbar-avatar">{initials}</div>
        <span className="navbar-name">{user?.nombre}</span>
        <button className="navbar-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
