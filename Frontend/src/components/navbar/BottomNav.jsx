import { NavLink } from "react-router-dom";
import { Home, Search, PlusSquare, User } from "lucide-react";

export default function BottomNav() {
  const cls = "flex flex-col items-center text-xs gap-1";

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-white border-t">
      <nav className="w-full max-w-md h-16 flex justify-around items-center">
      <NavLink to="/" className={({ isActive }) =>
        `${cls} ${isActive ? "text-blue-600" : "text-gray-500"}`
      }>
        <Home size={22} />
        Home
      </NavLink>

      <NavLink to="/search" className={({ isActive }) =>
        `${cls} ${isActive ? "text-blue-600" : "text-gray-500"}`
      }>
        <Search size={22} />
        Search
      </NavLink>

      <NavLink to="/create" className={({ isActive }) =>
        `${cls} ${isActive ? "text-blue-600" : "text-gray-500"}`
      }>
        <PlusSquare size={22} />
        Create
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) =>
        `${cls} ${isActive ? "text-blue-600" : "text-gray-500"}`
      }>
        <User size={22} />
        Profile
      </NavLink>
    </nav>
    </div>
  );
}
