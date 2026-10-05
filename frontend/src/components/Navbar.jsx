import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const link = ({ isActive }) =>
    `text-sm font-medium ${isActive ? "text-brand-600" : "text-slate-600 hover:text-slate-900"}`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-brand-600">
          Shop
        </Link>

        <nav className="flex items-center gap-5">
          <NavLink to="/" end className={link}>
            Products
          </NavLink>
          {user && (
            <NavLink to="/wishlist" className={link}>
              Wishlist
            </NavLink>
          )}
          {user && (
            <NavLink to="/cart" className={link}>
              Cart
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                  {count}
                </span>
              )}
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={link}>
              Orders
            </NavLink>
          )}
          {(user?.role === "admin" || user?.role === "seller") && (
            <NavLink to="/admin" className={link}>
              {user.role === "admin" ? "Admin" : "Seller"}
            </NavLink>
          )}

          {user ? (
            <button onClick={handleLogout} className="btn-outline">
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
