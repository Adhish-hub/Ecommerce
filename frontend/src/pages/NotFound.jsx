import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <p className="mt-2 mb-6 text-lg text-slate-500">
        This page doesn't exist.
      </p>
      <Link to="/" className="btn-primary">
        Back to shop
      </Link>
    </div>
  );
}
