import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true, roles: ["admin"] },
  { to: "/admin/products", label: "Products", roles: ["admin", "seller"] },
  { to: "/admin/categories", label: "Categories", roles: ["admin"] },
  { to: "/admin/orders", label: "Orders", roles: ["admin"] },
  { to: "/admin/users", label: "Users", roles: ["admin"] },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-24 md:h-fit">
        <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-slate-400 md:block">
          {user.role === "admin" ? "Admin panel" : "Seller panel"}
        </p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {LINKS.filter((l) => l.roles.includes(user.role)).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
